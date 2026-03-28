import type { AIMetricsSummary } from "../../../../types/ai";
import type { DashboardStats } from "../../../../services/dashboardService";

interface Props {
  metrics: AIMetricsSummary | null;
  dashboardStats: DashboardStats | null;
  loading: boolean;
}

const Stat = ({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
      {label}
    </p>
    <p
      className={`text-2xl font-bold ${accent ? "text-orange-600" : "text-gray-800"}`}
    >
      {value}
    </p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

export default function MetricsSummarySection({
  metrics,
  dashboardStats,
  loading,
}: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <i className="pi pi-spin pi-spinner mr-2" />
        Loading metrics…
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        <i className="pi pi-info-circle mr-2" />
        No metrics data available yet.
      </div>
    );
  }

  const successRate =
    metrics.totalCalls > 0
      ? ((metrics.successfulCalls / metrics.totalCalls) * 100).toFixed(1)
      : "—";

  const cacheHitRate =
    metrics.totalCalls > 0
      ? ((metrics.cacheHits / metrics.totalCalls) * 100).toFixed(1)
      : "—";

  return (
    <div className="space-y-5">
      {/* Platform stats */}
      {dashboardStats && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Platform
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Stat
              label="Users"
              value={dashboardStats.totalUsers.toLocaleString()}
            />
            <Stat
              label="Theses"
              value={dashboardStats.totalTheses.toLocaleString()}
            />
            <Stat
              label="Teams"
              value={dashboardStats.totalTeams.toLocaleString()}
            />
            <Stat
              label="Semesters"
              value={dashboardStats.totalSemesters.toLocaleString()}
            />
          </div>
        </>
      )}

      {/* AI metrics grid */}
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        AI Usage
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <Stat
          label="Total Calls"
          value={metrics.totalCalls.toLocaleString()}
          accent
        />
        <Stat
          label="Success Rate"
          value={`${successRate}%`}
          sub={`${metrics.successfulCalls.toLocaleString()} successful`}
        />
        <Stat
          label="Failed Calls"
          value={metrics.failedCalls.toLocaleString()}
        />
        <Stat
          label="Cache Hit Rate"
          value={`${cacheHitRate}%`}
          sub={`${metrics.cacheHits.toLocaleString()} hits`}
        />
        <Stat
          label="Avg Latency"
          value={`${metrics.averageLatencyMs.toFixed(0)} ms`}
        />
        <Stat
          label="Total Tokens"
          value={metrics.totalTokensUsed.toLocaleString()}
        />
        <Stat
          label="Est. Cost"
          value={`$${metrics.totalEstimatedCostUsd.toFixed(4)}`}
          sub="USD (approximate)"
          accent
        />
      </div>

      {/* Calls by provider */}
      {Object.keys(metrics.callsByProvider).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Calls by Provider
          </h3>
          <div className="space-y-2">
            {Object.entries(metrics.callsByProvider)
              .sort(([, a], [, b]) => b - a)
              .map(([provider, count]) => {
                const pct =
                  metrics.totalCalls > 0
                    ? Math.round((count / metrics.totalCalls) * 100)
                    : 0;
                return (
                  <div key={provider}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">
                        {provider}
                      </span>
                      <span className="text-gray-500">
                        {count.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-orange-400 h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
