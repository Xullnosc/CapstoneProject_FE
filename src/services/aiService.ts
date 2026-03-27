import api from './api';
import type {
  AIStatus,
  AIMetricsSummary,
  UserAISettingsView,
  SaveUserAISettingsRequest,
  AIChatRequest,
  AIChatResponse,
} from '../types/ai';

export const aiService = {
  /** GET /api/ai/status — public, requires auth */
  getStatus: async (): Promise<AIStatus> => {
    const res = await api.get<AIStatus>('/AI/status');
    return res.data;
  },

  /** GET /api/ai/metrics — Admin only */
  getMetrics: async (): Promise<AIMetricsSummary> => {
    const res = await api.get<AIMetricsSummary>('/AI/metrics');
    return res.data;
  },

  /** GET /api/ai/user-settings — current user's BYOK settings stored in Redis */
  getUserSettings: async (): Promise<UserAISettingsView> => {
    const res = await api.get<UserAISettingsView>('/AI/user-settings');
    return res.data;
  },

  /** PUT /api/ai/user-settings — save current user's BYOK settings to Redis */
  saveUserSettings: async (request: SaveUserAISettingsRequest): Promise<{ message: string }> => {
    const res = await api.put<{ message: string }>('/AI/user-settings', request);
    return res.data;
  },

  /** DELETE /api/ai/user-settings/{provider} — remove a saved provider for the current user */
  deleteUserProvider: async (provider: string): Promise<void> => {
    await api.delete(`/AI/user-settings/${provider}`);
  },

  /** Legacy alias kept only to avoid wider FE churn while the page is being repurposed */
  getConfig: async (): Promise<UserAISettingsView> => {
    const res = await api.get<UserAISettingsView>('/AI/user-settings');
    return res.data;
  },

  /** Legacy alias kept only to avoid wider FE churn while the page is being repurposed */
  updateConfig: async (request: SaveUserAISettingsRequest): Promise<{ message: string }> => {
    const res = await api.put<{ message: string }>('/AI/user-settings', request);
    return res.data;
  },

  /** POST /api/ai/chat — all authenticated users */
  chat: async (request: AIChatRequest): Promise<AIChatResponse> => {
    const res = await api.post<AIChatResponse>('/AI/chat', request);
    return res.data;
  },

  /** Convenience: test a provider connection with a simple ping message */
  testConnection: async (provider?: string): Promise<AIChatResponse> => {
    return aiService.chat({
      messages: [{ role: 'user', content: 'Ping — respond with "pong" only.' }],
      systemPrompt: provider ? `You are a test assistant for the ${provider} provider.` : undefined,
      temperature: 0,
      maxTokens: 10,
      useCache: false,
    });
  },
};
