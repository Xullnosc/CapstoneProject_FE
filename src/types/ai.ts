// ─── AI Provider Types ────────────────────────────────────────────────────────

export type AIProviderType = 'OpenAI' | 'AzureOpenAI' | 'Anthropic' | 'GoogleGemini';

// ─── User settings DTOs (returned from GET /api/ai/user-settings) ────────────

export interface UserAISettingsView {
  aiEnabled: boolean;
  defaultProvider: AIProviderType;
  providers: UserAIProviderView[];
}

export interface UserAIProviderView {
  provider: AIProviderType;
  hasApiKey: boolean;
  apiKeyMasked: string;
  model: string;
  baseUrl: string | null;
  apiVersion: string | null;
  deploymentName: string | null;
  timeoutSeconds: number;
  maxRetries: number;
}

// ─── Save DTOs (sent to PUT /api/ai/user-settings) ───────────────────────────

export interface SaveUserAISettingsRequest {
  defaultProvider: AIProviderType;
  providers: SaveUserAIProvider[];
}

export interface SaveUserAIProvider {
  provider: AIProviderType;
  apiKey: string;
  model: string;
  baseUrl: string | null;
  apiVersion: string | null;
  deploymentName: string | null;
  timeoutSeconds: number;
  maxRetries: number;
}

// ─── Status & Metrics (GET /api/ai/status, GET /api/ai/metrics) ───────────────

export interface AIStatus {
  enabled: boolean;
}

export interface AIMetricsSummary {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  cacheHits: number;
  averageLatencyMs: number;
  totalTokensUsed: number;
  totalEstimatedCostUsd: number;
  callsByProvider: Record<string, number>;
}

// ─── Chat (POST /api/ai/chat) ─────────────────────────────────────────────────

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIChatRequest {
  messages: AIChatMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  useCache?: boolean;
  provider?: AIProviderType;
  providerSettings?: {
    apiKey: string;
    model?: string;
    baseUrl?: string | null;
    apiVersion?: string | null;
    deploymentName?: string | null;
    timeoutSeconds?: number;
    maxRetries?: number;
  };
}

export interface AIChatResponse {
  content: string;
  provider: string;
  model: string;
  fromCache: boolean;
  latencyMs: number;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
}

// ─── Provider metadata (for UI display) ──────────────────────────────────────

export interface ProviderMeta {
  key: AIProviderType;
  label: string;
  icon: string;
  defaultModel: string;
  modelOptions: string[];
  requiresBaseUrl: boolean;
  requiresDeployment: boolean;
}

export const PROVIDER_META: ProviderMeta[] = [
  {
    key: 'OpenAI',
    label: 'OpenAI',
    icon: 'pi pi-bolt',
    defaultModel: 'gpt-4o',
    modelOptions: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    requiresBaseUrl: false,
    requiresDeployment: false,
  },
  {
    key: 'AzureOpenAI',
    label: 'Azure OpenAI',
    icon: 'pi pi-microsoft',
    defaultModel: 'gpt-4o',
    modelOptions: ['gpt-4o', 'gpt-4-turbo', 'gpt-35-turbo'],
    requiresBaseUrl: true,
    requiresDeployment: true,
  },
  {
    key: 'Anthropic',
    label: 'Anthropic',
    icon: 'pi pi-send',
    defaultModel: 'claude-3-5-sonnet-20241022',
    modelOptions: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    requiresBaseUrl: false,
    requiresDeployment: false,
  },
  {
    key: 'GoogleGemini',
    label: 'Google Gemini',
    icon: 'pi pi-star',
    defaultModel: 'gemini-1.5-pro',
    modelOptions: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
    requiresBaseUrl: false,
    requiresDeployment: false,
  },
];
