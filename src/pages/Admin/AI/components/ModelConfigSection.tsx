import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import type { CacheUpdate, RateLimitUpdate } from '../../../../types/ai';

interface Props {
  temperature: number;
  maxTokens: number;
  cache: CacheUpdate;
  rateLimit: RateLimitUpdate;
  onTemperatureChange: (v: number) => void;
  onMaxTokensChange: (v: number) => void;
  onCacheChange: (v: CacheUpdate) => void;
  onRateLimitChange: (v: RateLimitUpdate) => void;
}

export default function ModelConfigSection({
  temperature,
  maxTokens,
  cache,
  rateLimit,
  onTemperatureChange,
  onMaxTokensChange,
  onCacheChange,
  onRateLimitChange,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Generation parameters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Generation Parameters
        </h3>

        {/* Temperature */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-gray-600">Temperature</label>
            <span className="text-sm font-semibold text-orange-600 tabular-nums">
              {temperature.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={temperature}
            onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
            className="w-full h-2 accent-orange-500 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Precise (0)</span>
            <span>Creative (2)</span>
          </div>
        </div>

        {/* Max tokens */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Max Tokens
            <span className="ml-1 text-xs text-gray-400">(per response)</span>
          </label>
          <InputText
            type="number"
            value={String(maxTokens)}
            onChange={(e) => onMaxTokensChange(parseInt(e.target.value, 10) || 1024)}
            className="w-full max-w-xs"
            min={64}
            max={32768}
          />
        </div>
      </div>

      {/* Cache settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Response Cache
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Identical prompts return cached results to reduce cost and latency.
            </p>
          </div>
          <InputSwitch
            checked={cache.enabled}
            onChange={(e) => onCacheChange({ ...cache, enabled: e.value })}
          />
        </div>

        {cache.enabled && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Default TTL (seconds)
            </label>
            <InputText
              type="number"
              value={String(cache.defaultTtlSeconds)}
              onChange={(e) =>
                onCacheChange({ ...cache, defaultTtlSeconds: parseInt(e.target.value, 10) || 3600 })
              }
              className="w-full max-w-xs"
              min={60}
              max={86400}
            />
          </div>
        )}
      </div>

      {/* Rate limit settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Rate Limits
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Requests / min (per user)
              <span className="ml-1 text-xs text-gray-400">0 = unlimited</span>
            </label>
            <InputText
              type="number"
              value={String(rateLimit.requestsPerMinutePerUser)}
              onChange={(e) =>
                onRateLimitChange({
                  ...rateLimit,
                  requestsPerMinutePerUser: parseInt(e.target.value, 10) || 0,
                })
              }
              className="w-full"
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Requests / min (global)
              <span className="ml-1 text-xs text-gray-400">0 = unlimited</span>
            </label>
            <InputText
              type="number"
              value={String(rateLimit.requestsPerMinuteGlobal)}
              onChange={(e) =>
                onRateLimitChange({
                  ...rateLimit,
                  requestsPerMinuteGlobal: parseInt(e.target.value, 10) || 0,
                })
              }
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
