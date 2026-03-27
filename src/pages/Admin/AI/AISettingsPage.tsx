import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { authService } from '../../../services/authService';
import { aiService } from '../../../services/aiService';
import type {
  AIMetricsSummary,
  AIProviderType,
  SaveUserAIProvider,
  SaveUserAISettingsRequest,
  UserAISettingsView,
} from '../../../types/ai';
import { PROVIDER_META } from '../../../types/ai';
import ApiKeySection from './components/ApiKeySection';
import MetricsSummarySection from './components/MetricsSummarySection';

const SETTINGS_NAV = [
  { label: 'General', icon: 'pi pi-sliders-h', active: false },
  { label: 'AI Models', icon: 'pi pi-sparkles', active: true },
  { label: 'API Keys', icon: 'pi pi-key', active: true },
  { label: 'Usage', icon: 'pi pi-chart-line', active: false },
  { label: 'Billing', icon: 'pi pi-wallet', active: false },
  { label: 'Team', icon: 'pi pi-users', active: false },
];

type FormState = {
  aiEnabled: boolean;
  defaultProvider: AIProviderType;
  providers: Record<string, SaveUserAIProvider>;
};

const buildDefaultProviders = (): Record<string, SaveUserAIProvider> =>
  Object.fromEntries(
    PROVIDER_META.map((provider) => [
      provider.key,
      {
        provider: provider.key,
        apiKey: '',
        model: provider.defaultModel,
        baseUrl: null,
        apiVersion: provider.key === 'AzureOpenAI' ? '2024-05-01-preview' : null,
        deploymentName: null,
        timeoutSeconds: 60,
        maxRetries: 2,
      } satisfies SaveUserAIProvider,
    ]),
  );

const mapSettingsToForm = (settings: UserAISettingsView): FormState => {
  const providers = buildDefaultProviders();
  for (const provider of settings.providers) {
    providers[provider.provider] = {
      provider: provider.provider,
      apiKey: '',
      model: provider.model,
      baseUrl: provider.baseUrl,
      apiVersion: provider.apiVersion,
      deploymentName: provider.deploymentName,
      timeoutSeconds: provider.timeoutSeconds,
      maxRetries: provider.maxRetries,
    };
  }

  return {
    aiEnabled: settings.aiEnabled,
    defaultProvider: settings.defaultProvider,
    providers,
  };
};

const INITIAL_FORM: FormState = {
  aiEnabled: false,
  defaultProvider: 'OpenAI',
  providers: buildDefaultProviders(),
};

export default function AISettingsPage() {
  const toast = useRef<Toast>(null);
  const currentUser = authService.getUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [userSettings, setUserSettings] = useState<UserAISettingsView | null>(null);
  const [metrics, setMetrics] = useState<AIMetricsSummary | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [dirty, setDirty] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set());

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const settings = await aiService.getUserSettings();
      setUserSettings(settings);
      setForm(mapSettingsToForm(settings));
      setDirty(false);
      setConnectedProviders(new Set(settings.providers.filter((provider) => provider.hasApiKey).map((provider) => provider.provider)));
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Load failed',
        detail: 'Could not load your AI provider settings.',
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      setMetricsLoading(true);
      const summary = await aiService.getMetrics();
      setMetrics(summary);
    } catch {
      setMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadMetrics();
  }, [loadSettings, loadMetrics]);

  const patchProviders = (providers: Record<string, SaveUserAIProvider>) => {
    setForm((prev) => ({ ...prev, providers }));
    setDirty(true);
  };

  const patchDefaultProvider = (provider: AIProviderType) => {
    setForm((prev) => ({ ...prev, defaultProvider: provider }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const request: SaveUserAISettingsRequest = {
        defaultProvider: form.defaultProvider,
        providers: Object.values(form.providers),
      };
      const result = await aiService.saveUserSettings(request);
      toast.current?.show({
        severity: 'success',
        summary: 'Saved',
        detail: result.message,
        life: 4000,
      });
      await loadSettings();
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Save failed',
        detail: 'Could not save your AI provider settings to Redis.',
        life: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!userSettings) {
      return;
    }

    setForm(mapSettingsToForm(userSettings));
    setDirty(false);
  };

  const handleDeleteProvider = async (provider: AIProviderType) => {
    try {
      await aiService.deleteUserProvider(provider);
      toast.current?.show({
        severity: 'success',
        summary: 'Deleted',
        detail: `${provider} was removed from your saved Redis settings.`,
        life: 3000,
      });
      await loadSettings();
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Delete failed',
        detail: `Could not remove ${provider} from your saved settings.`,
        life: 4000,
      });
    }
  };

  const handleTestConnection = async (provider: AIProviderType) => {
    const providerSettings = form.providers[provider];
    if (!providerSettings?.apiKey) {
      toast.current?.show({
        severity: 'warn',
        summary: 'API key required',
        detail: `Enter a ${provider} API key before testing.`,
        life: 3000,
      });
      return;
    }

    setTestingProvider(provider);
    try {
      await aiService.chat({
        provider,
        providerSettings: {
          apiKey: providerSettings.apiKey,
          model: providerSettings.model,
          baseUrl: providerSettings.baseUrl,
          apiVersion: providerSettings.apiVersion,
          deploymentName: providerSettings.deploymentName,
          timeoutSeconds: providerSettings.timeoutSeconds,
          maxRetries: providerSettings.maxRetries,
        },
        messages: [{ role: 'user', content: 'Respond with exactly: pong' }],
        temperature: 0,
        maxTokens: 8,
        useCache: false,
      });

      setConnectedProviders((prev) => new Set(prev).add(provider));
      toast.current?.show({
        severity: 'success',
        summary: 'Connected',
        detail: `${provider} responded successfully using your key.`,
        life: 3000,
      });
    } catch {
      setConnectedProviders((prev) => {
        const next = new Set(prev);
        next.delete(provider);
        return next;
      });
      toast.current?.show({
        severity: 'error',
        summary: 'Connection failed',
        detail: `Could not connect to ${provider} using your current settings.`,
        life: 5000,
      });
    } finally {
      setTestingProvider(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-gray-500">
        <i className="pi pi-spin pi-spinner text-3xl text-orange-500 mr-3" />
        <span>Loading your AI settings…</span>
      </div>
    );
  }

  return (
    <>
      <Toast ref={toast} />

      <div className="min-h-[calc(100vh-12rem)] rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#fff_0%,#fff7ef_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.08)] overflow-hidden">
        <div className="border-b border-slate-200 bg-white/85 backdrop-blur px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                <span>AI Studio</span>
                <i className="pi pi-angle-right" style={{ fontSize: '0.7rem' }} />
                <span>Settings</span>
                <i className="pi pi-angle-right" style={{ fontSize: '0.7rem' }} />
                <span className="text-slate-700 font-medium">API Keys</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Bring Your Own AI</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <span className="font-semibold">{form.aiEnabled ? 'Platform Ready' : 'Platform Disabled'}</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                <span className="font-semibold text-slate-800">Workspace:</span> {currentUser?.fullName || currentUser?.email || 'Current account'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border-r border-slate-200 bg-[#fbfbfc] px-4 py-6 sm:px-5">
            <div className="rounded-3xl bg-slate-950 px-5 py-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)]">
              <p className="text-xs uppercase tracking-[0.24em] text-orange-200">Account Vault</p>
              <h2 className="mt-2 text-xl font-semibold">AI Studio</h2>
              <p className="mt-2 text-sm text-slate-300">
                Your provider keys are scoped to your account and saved in Redis.
              </p>
            </div>

            <nav className="mt-6 space-y-1.5">
              {SETTINGS_NAV.map((item) => {
                const enabledItem = item.label === 'AI Models' || item.label === 'API Keys';
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all ${
                      item.active
                        ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm'
                        : enabledItem
                          ? 'text-slate-600 bg-white border border-slate-200'
                          : 'text-slate-400 bg-transparent border border-transparent'
                    }`}
                  >
                    <i className={`${item.icon} text-sm`} />
                    <span className="font-medium">{item.label}</span>
                    {!enabledItem && <span className="ml-auto text-[11px] uppercase tracking-wide">Soon</span>}
                  </div>
                );
              })}
            </nav>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">How it works</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>Save your own provider key.</li>
                <li>Test the connection before use.</li>
                <li>Admins cannot view your third-party key.</li>
              </ul>
            </div>
          </aside>

          <div className="px-4 py-5 sm:px-8 sm:py-8">
            <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">API Key Management</p>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-900">Connect your AI providers</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                        Match the settings page you provided: configure provider keys, models, Azure endpoints, and test each connection from one place.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                      <span className="font-semibold">Default provider:</span> {form.defaultProvider}
                    </div>
                  </div>

                  <div className="mt-6">
                    <ApiKeySection
                      providers={form.providers}
                      onChange={patchProviders}
                      defaultProvider={form.defaultProvider}
                      fallbackProvider={null}
                      onDefaultProviderChange={patchDefaultProvider}
                      onFallbackProviderChange={() => {}}
                      onTestConnection={handleTestConnection}
                      connectedProviders={connectedProviders}
                      testingProvider={testingProvider}
                      onDeleteProvider={handleDeleteProvider}
                      showFallbackProvider={false}
                      showApiVersionField
                      readOnly={!form.aiEnabled}
                    />
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Status</p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-900">Workspace state</h2>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${form.aiEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                      {form.aiEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Owner</p>
                      <p className="mt-1 font-medium text-slate-800">{currentUser?.fullName || 'Current account'}</p>
                      <p className="mt-1 text-sm text-slate-500">{currentUser?.email || 'No email available'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Connected Providers</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">{connectedProviders.size}</p>
                      <p className="mt-1 text-sm text-slate-500">Saved against your account settings.</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Storage</p>
                      <p className="mt-1 font-medium text-slate-800">Redis-backed vault</p>
                      <p className="mt-1 text-sm text-slate-500">Keys are stored per user, not in admin configuration.</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Usage</p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-900">Metrics snapshot</h2>
                    </div>
                    <Button
                      label="Refresh"
                      icon="pi pi-refresh"
                      size="small"
                      outlined
                      severity="secondary"
                      loading={metricsLoading}
                      onClick={loadMetrics}
                    />
                  </div>
                  <MetricsSummarySection metrics={metrics} loading={metricsLoading} />
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 px-6 py-3 flex items-center justify-between shadow-[0_-12px_30px_rgba(15,23,42,0.08)]">
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <i className="pi pi-info-circle text-orange-500" />
            You have unsaved changes to your personal AI provider settings.
          </p>
          <div className="flex gap-3">
            <Button
              label="Discard"
              icon="pi pi-times"
              severity="secondary"
              outlined
              onClick={handleDiscard}
              disabled={saving}
            />
            <Button
              label={saving ? 'Saving…' : 'Save to Redis'}
              icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
              className="!bg-orange-500 !border-orange-500 hover:!bg-orange-600"
              loading={saving}
              onClick={handleSave}
              disabled={!form.aiEnabled}
            />
          </div>
        </div>
      )}
    </>
  );
}
