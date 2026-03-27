import { useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import type { AIProviderType, SaveUserAIProvider } from '../../../../types/ai';
import { PROVIDER_META } from '../../../../types/ai';

interface Props {
  providers: Record<string, SaveUserAIProvider>;
  onChange: (providers: Record<string, SaveUserAIProvider>) => void;
  defaultProvider: AIProviderType;
  fallbackProvider: AIProviderType | null;
  onDefaultProviderChange: (v: AIProviderType) => void;
  onFallbackProviderChange: (v: AIProviderType | null) => void;
  onTestConnection: (provider: AIProviderType) => Promise<void>;
  connectedProviders: Set<string>;
  testingProvider: string | null;
  onDeleteProvider?: (provider: AIProviderType) => Promise<void>;
  showFallbackProvider?: boolean;
  showApiVersionField?: boolean;
  readOnly?: boolean;
}

const PROVIDER_OPTIONS = PROVIDER_META.map((p) => ({ label: p.label, value: p.key }));
const FALLBACK_OPTIONS = [
  { label: 'None', value: null },
  ...PROVIDER_OPTIONS,
];

export default function ApiKeySection({
  providers,
  onChange,
  defaultProvider,
  fallbackProvider,
  onDefaultProviderChange,
  onFallbackProviderChange,
  onTestConnection,
  connectedProviders,
  testingProvider,
  onDeleteProvider,
  showFallbackProvider = true,
  showApiVersionField = false,
  readOnly = false,
}: Props) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const toggleVisibility = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const updateProvider = (
    providerKey: AIProviderType,
    field: keyof SaveUserAIProvider,
    value: string | number | null,
  ) => {
    const current = providers[providerKey] ?? defaultProviderState(providerKey);
    onChange({ ...providers, [providerKey]: { ...current, [field]: value } });
  };

  const defaultProviderState = (key: AIProviderType): SaveUserAIProvider => {
    const meta = PROVIDER_META.find((p) => p.key === key)!;
    return {
      provider: key,
      apiKey: '',
      model: meta.defaultModel,
      baseUrl: null,
      apiVersion: key === 'AzureOpenAI' ? '2024-05-01-preview' : null,
      deploymentName: null,
      timeoutSeconds: 60,
      maxRetries: 2,
    };
  };

  const selectedMeta = PROVIDER_META.find((provider) => provider.key === defaultProvider)!;
  const providerData = providers[defaultProvider] ?? defaultProviderState(defaultProvider);
  const isVisible = visibleKeys.has(defaultProvider);
  const isTesting = testingProvider === defaultProvider;
  const isConnected = connectedProviders.has(defaultProvider);

  return (
    <div className="space-y-6">
      {/* Provider selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          Provider Selection
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Provider</label>
            <Dropdown
              value={defaultProvider}
              options={PROVIDER_OPTIONS}
              onChange={(e) => onDefaultProviderChange(e.value as AIProviderType)}
              className="w-full"
              disabled={readOnly}
              pt={{ root: { className: 'w-full' } }}
            />
          </div>
          {showFallbackProvider && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Fallback Provider
                <span className="ml-1 text-xs text-gray-400">(auto-used on error)</span>
              </label>
              <Dropdown
                value={fallbackProvider}
                options={FALLBACK_OPTIONS}
                onChange={(e) => onFallbackProviderChange(e.value as AIProviderType | null)}
                className="w-full"
                disabled={readOnly}
                pt={{ root: { className: 'w-full' } }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className={`${selectedMeta.icon} text-orange-500`} />
            <span className="font-semibold text-gray-800">{selectedMeta.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                <i className="pi pi-check-circle text-green-600" style={{ fontSize: '0.75rem' }} />
                Connected
              </span>
            )}
            {onDeleteProvider && (
              <Button
                icon="pi pi-trash"
                size="small"
                rounded
                text
                severity="danger"
                disabled={readOnly}
                onClick={() => onDeleteProvider(defaultProvider)}
                aria-label={`Delete ${selectedMeta.label}`}
              />
            )}
            <Button
              label={isTesting ? 'Testing…' : 'Test Connection'}
              icon={isTesting ? 'pi pi-spin pi-spinner' : 'pi pi-wifi'}
              size="small"
              outlined
              severity="secondary"
              disabled={isTesting || !providerData.apiKey}
              onClick={() => onTestConnection(defaultProvider)}
              className="!text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">API Key</label>
          <div className="relative">
            <InputText
              type={isVisible ? 'text' : 'password'}
              value={providerData.apiKey}
              onChange={(e) => updateProvider(defaultProvider, 'apiKey', e.target.value)}
              placeholder={`Enter ${selectedMeta.label} API key…`}
              className="w-full pr-10"
              disabled={readOnly}
            />
            <button
              type="button"
              onClick={() => toggleVisibility(defaultProvider)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={isVisible ? 'Hide key' : 'Show key'}
              disabled={readOnly}
            >
              <i className={`pi ${isVisible ? 'pi-eye-slash' : 'pi-eye'}`} />
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Leave blank to keep the existing key saved in Redis for your account.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Model</label>
          <Dropdown
            value={providerData.model || selectedMeta.defaultModel}
            options={selectedMeta.modelOptions.map((model) => ({ label: model, value: model }))}
            editable
            onChange={(e) => updateProvider(defaultProvider, 'model', e.value as string)}
            className="w-full"
            disabled={readOnly}
            pt={{ root: { className: 'w-full' } }}
          />
        </div>

        {selectedMeta.requiresBaseUrl && (
          <div className={`grid grid-cols-1 ${showApiVersionField ? 'lg:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Base URL</label>
              <InputText
                value={providerData.baseUrl ?? ''}
                onChange={(e) => updateProvider(defaultProvider, 'baseUrl', e.target.value || null)}
                placeholder="https://<resource>.openai.azure.com"
                className="w-full"
                disabled={readOnly}
              />
            </div>
            {showApiVersionField && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">API Version</label>
                <InputText
                  value={providerData.apiVersion ?? ''}
                  onChange={(e) => updateProvider(defaultProvider, 'apiVersion', e.target.value || null)}
                  placeholder="2024-05-01-preview"
                  className="w-full"
                  disabled={readOnly}
                />
              </div>
            )}
            {selectedMeta.requiresDeployment && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Deployment Name</label>
                <InputText
                  value={providerData.deploymentName ?? ''}
                  onChange={(e) => updateProvider(defaultProvider, 'deploymentName', e.target.value || null)}
                  placeholder="my-gpt4o-deployment"
                  className="w-full"
                  disabled={readOnly}
                />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Timeout (seconds)</label>
            <InputText
              type="number"
              value={String(providerData.timeoutSeconds)}
              onChange={(e) => updateProvider(defaultProvider, 'timeoutSeconds', parseInt(e.target.value, 10) || 60)}
              className="w-full"
              disabled={readOnly}
              min={5}
              max={300}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Max Retries</label>
            <InputText
              type="number"
              value={String(providerData.maxRetries)}
              onChange={(e) => updateProvider(defaultProvider, 'maxRetries', parseInt(e.target.value, 10) || 2)}
              className="w-full"
              disabled={readOnly}
              min={0}
              max={5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
