import api from "./api";
import type {
  AIStatus,
  AIMetricsSummary,
  UserAISettingsView,
  SaveUserAISettingsRequest,
  AddUserAIEntryRequest,
  AIChatRequest,
  AIChatResponse,
  AIProviderType,
  SaveUserAIProvider,
} from "../types/ai";
import { PROVIDER_META } from "../types/ai";

export const aiService = {
  /** GET /api/ai/status — public, requires auth */
  getStatus: async (): Promise<AIStatus> => {
    const res = await api.get<AIStatus>("/AI/status");
    return res.data;
  },

  /** GET /api/ai/metrics — Admin only */
  getMetrics: async (): Promise<AIMetricsSummary> => {
    const res = await api.get<AIMetricsSummary>("/AI/metrics");
    return res.data;
  },

  /** GET /api/ai/user-settings — current user's BYOK settings stored in Redis */
  getUserSettings: async (): Promise<UserAISettingsView> => {
    const res = await api.get<UserAISettingsView>("/AI/user-settings");
    return res.data;
  },

  /** PUT /api/ai/user-settings — save current user's BYOK settings to Redis */
  saveUserSettings: async (
    request: SaveUserAISettingsRequest,
  ): Promise<{ message: string }> => {
    const res = await api.put<{ message: string }>(
      "/AI/user-settings",
      request,
    );
    return res.data;
  },

  /** DELETE /api/ai/user-settings/{entryKey} — remove a saved entry for the current user */
  deleteUserProvider: async (entryKey: string): Promise<void> => {
    await api.delete(`/AI/user-settings/${encodeURIComponent(entryKey)}`);
  },

  /** POST /api/ai/user-settings/entry — add a new provider entry with an auto-generated key */
  addEntry: async (
    request: AddUserAIEntryRequest,
  ): Promise<{ entryKey: string; message: string }> => {
    const res = await api.post<{ entryKey: string; message: string }>(
      "/AI/user-settings/entry",
      request,
    );
    return res.data;
  },

  /** PATCH /api/ai/user-settings/default — set which entry is the active one for AI calls */
  setDefaultEntry: async (entryKey: string): Promise<void> => {
    await api.patch("/AI/user-settings/default", { entryKey });
  },

  /** Legacy alias kept only to avoid wider FE churn while the page is being repurposed */
  getConfig: async (): Promise<UserAISettingsView> => {
    const res = await api.get<UserAISettingsView>("/AI/user-settings");
    return res.data;
  },

  /** Legacy alias kept only to avoid wider FE churn while the page is being repurposed */
  updateConfig: async (
    request: SaveUserAISettingsRequest,
  ): Promise<{ message: string }> => {
    const res = await api.put<{ message: string }>(
      "/AI/user-settings",
      request,
    );
    return res.data;
  },

  /** POST /api/ai/chat — all authenticated users */
  chat: async (request: AIChatRequest): Promise<AIChatResponse> => {
    const res = await api.post<AIChatResponse>("/AI/chat", request);
    return res.data;
  },

  /** Convenience: test a provider connection with a simple ping message */
  testConnection: async (
    provider: AIProviderType,
    providerSettings: SaveUserAIProvider,
  ): Promise<AIChatResponse> => {
    const providerMeta = PROVIDER_META.find((entry) => entry.key === provider);
    const resolvedModel =
      providerSettings.model?.trim() || providerMeta?.defaultModel;

    return aiService.chat({
      provider,
      providerSettings: {
        apiKey: providerSettings.apiKey,
        model: resolvedModel,
        baseUrl: providerSettings.baseUrl,
        apiVersion: providerSettings.apiVersion,
        deploymentName: providerSettings.deploymentName,
        timeoutSeconds: providerSettings.timeoutSeconds,
        maxRetries: providerSettings.maxRetries,
      },
      messages: [{ role: "user", content: "Respond with exactly: pong" }],
      systemPrompt: `You are a connectivity test assistant for ${provider}.`,
      temperature: 0,
      maxTokens: 8,
      useCache: false,
    });
  },
};
