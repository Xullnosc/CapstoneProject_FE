import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { authService } from "../../../services/authService";
import { aiService } from "../../../services/aiService";
import type { UserAISettingsView } from "../../../types/ai";
import { PROVIDER_META } from "../../../types/ai";

const SETTINGS_NAV = [
  { label: "General", icon: "pi pi-sliders-h" },
  { label: "AI Models", icon: "pi pi-sparkles", path: "/ai-settings" },
  { label: "API Keys", icon: "pi pi-key", path: "/ai-settings/api-keys" },
  { label: "Usage", icon: "pi pi-chart-line" },
  { label: "Billing", icon: "pi pi-wallet" },
  { label: "Team", icon: "pi pi-users" },
];

const PROVIDER_ICON_MAP: Record<string, string> = {
  OpenAI: "pi pi-bolt",
  AzureOpenAI: "pi pi-microsoft",
  Anthropic: "pi pi-send",
  GoogleGemini: "pi pi-google",
};

const shortenMaskedKey = (maskedKey: string): string => {
  if (!maskedKey) return "";
  if (maskedKey.length <= 14) return maskedKey;
  return `${maskedKey.slice(0, 6)}...${maskedKey.slice(-4)}`;
};

export default function AIApiKeysPage() {
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userSettings, setUserSettings] = useState<UserAISettingsView | null>(
    null,
  );

  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const [selectedEntryKey, setSelectedEntryKey] = useState<string | null>(null);

  const dirty = useMemo(
    () =>
      pendingDeletes.size > 0 ||
      (selectedEntryKey !== null &&
        selectedEntryKey !== userSettings?.defaultEntryKey),
    [pendingDeletes, selectedEntryKey, userSettings],
  );

  const savedKeyEntries = useMemo(
    () =>
      (userSettings?.providers ?? []).filter(
        (provider) => provider.hasApiKey && provider.apiKeyMasked,
      ),
    [userSettings],
  );

  const providerLabelByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const meta of PROVIDER_META) {
      map.set(meta.key, meta.label);
    }
    return map;
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const settings = await aiService.getUserSettings();
      setUserSettings(settings);
      setPendingDeletes(new Set());
      setSelectedEntryKey(settings.defaultEntryKey ?? null);
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Load failed",
        detail: "Could not load your AI provider settings.",
        life: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const togglePendingDelete = (entryKey: string) => {
    setPendingDeletes((prev) => {
      const next = new Set(prev);
      if (next.has(entryKey)) {
        next.delete(entryKey);
      } else {
        next.add(entryKey);
      }
      return next;
    });
  };

  const handleDiscard = () => {
    setPendingDeletes(new Set());
    setSelectedEntryKey(userSettings?.defaultEntryKey ?? null);
  };

  const handleSave = async () => {
    if (!dirty) {
      return;
    }

    setSaving(true);
    try {
      const ops: Promise<unknown>[] = [];

      for (const key of pendingDeletes) {
        ops.push(aiService.deleteUserProvider(key));
      }

      const newDefault = selectedEntryKey;
      if (newDefault && newDefault !== userSettings?.defaultEntryKey) {
        ops.push(aiService.setDefaultEntry(newDefault));
      }

      await Promise.all(ops);

      const parts: string[] = [];
      if (pendingDeletes.size > 0) {
        parts.push(`Removed ${pendingDeletes.size} key(s)`);
      }
      if (newDefault && newDefault !== userSettings?.defaultEntryKey) {
        parts.push("Updated active key");
      }

      toast.current?.show({
        severity: "success",
        summary: "Saved",
        detail: parts.join(" · ") || "Changes applied.",
        life: 4000,
      });

      await loadSettings();
    } catch {
      toast.current?.show({
        severity: "error",
        summary: "Save failed",
        detail: "Could not apply all changes. Please try again.",
        life: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        <i className="pi pi-spin pi-spinner mr-3 text-3xl text-orange-500" />
        <span>Loading your API keys...</span>
      </div>
    );
  }

  return (
    <>
      <Toast ref={toast} />

      <div className="min-h-[calc(100vh-12rem)] overflow-hidden rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,#fff2dc_0%,#ffffff_45%,#f8fafc_100%)] shadow-[0_24px_72px_rgba(15,23,42,0.09)]">
        <div className="border-b border-slate-200/80 bg-white/85 px-5 py-4 backdrop-blur sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-sm text-slate-400">
                <span>AI Studio</span>
                <i
                  className="pi pi-angle-right"
                  style={{ fontSize: "0.7rem" }}
                />
                <span>Settings</span>
                <i
                  className="pi pi-angle-right"
                  style={{ fontSize: "0.7rem" }}
                />
                <span className="font-medium text-slate-700">API Keys</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                Stored API Keys
              </h1>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              <span className="font-semibold text-slate-800">Workspace:</span>{" "}
              {currentUser?.fullName || currentUser?.email || "Current account"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border-r border-slate-200 bg-white/60 px-4 py-6 sm:px-5">
            <div className="rounded-3xl bg-slate-950 px-5 py-5 text-white shadow-[0_18px_44px_rgba(15,23,42,0.22)]">
              <p className="text-xs uppercase tracking-[0.24em] text-orange-200">
                Key Control
              </p>
              <h2 className="mt-2 text-xl font-semibold">AI Studio</h2>
              <p className="mt-2 text-sm text-slate-300">
                Set the active key and remove stale entries.
              </p>
            </div>

            <nav className="mt-6 space-y-1.5">
              {SETTINGS_NAV.map((item) => {
                const enabledItem = Boolean((item as { path?: string }).path);
                const isActive =
                  enabledItem &&
                  location.pathname === (item as { path?: string }).path;

                return (
                  <button
                    type="button"
                    key={item.label}
                    onClick={() => {
                      if ((item as { path?: string }).path) {
                        navigate((item as { path?: string }).path as string);
                      }
                    }}
                    disabled={!enabledItem}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all ${
                      isActive
                        ? "border-orange-200 bg-orange-50 text-orange-700 shadow-sm"
                        : enabledItem
                          ? "border-slate-200 bg-white text-slate-600"
                          : "border-transparent bg-transparent text-slate-400"
                    }`}
                  >
                    <i className={`${item.icon} text-sm`} />
                    <span className="font-medium">{item.label}</span>
                    {!enabledItem && (
                      <span className="ml-auto text-[11px] uppercase tracking-wide">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="space-y-6 px-4 py-5 sm:px-8 sm:py-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                    Key Activation
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Manage active key and cleanup
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    This page only manages saved keys. Add or update keys in AI
                    Models, then return here to choose the active one.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                    {savedKeyEntries.length} saved
                  </span>
                </div>
              </div>

              {savedKeyEntries.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                  <p className="text-sm text-slate-600">
                    No stored API keys found for this account.
                  </p>
                  <Button
                    type="button"
                    label="Add key in AI Models"
                    icon="pi pi-external-link"
                    className="mt-4 !border-orange-500 !bg-orange-500"
                    onClick={() => navigate("/ai-settings")}
                  />
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100/70">
                      <tr>
                        <th className="w-14 px-4 py-3 text-left font-semibold text-slate-600">
                          Active
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Provider
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Model
                        </th>
                        <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 md:table-cell">
                          Masked Key
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-600"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {savedKeyEntries.map((entry) => {
                        const isActive = selectedEntryKey === entry.entryKey;
                        const pendingDelete = pendingDeletes.has(
                          entry.entryKey,
                        );

                        return (
                          <tr
                            key={entry.entryKey}
                            className={
                              pendingDelete
                                ? "bg-rose-50/60"
                                : isActive
                                  ? "bg-orange-50/70"
                                  : "bg-white"
                            }
                          >
                            <td className="px-4 py-3 text-center align-middle">
                              {isActive && (
                                <span
                                  aria-label="Currently active key"
                                  title="Currently active"
                                  className={`relative inline-block h-5 w-5 rounded-full border-2 ${
                                    pendingDelete
                                      ? "border-emerald-200 opacity-40"
                                      : "border-emerald-500 bg-emerald-100 animate-pulse"
                                  }`}
                                >
                                  <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500" />
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3 align-middle font-medium text-slate-900">
                              <div className="flex items-center gap-2">
                                <i
                                  className={`${PROVIDER_ICON_MAP[entry.provider] ?? "pi pi-box"} text-sky-600`}
                                />
                                <span>
                                  {providerLabelByKey.get(entry.provider) ??
                                    entry.provider}
                                </span>
                                {pendingDelete && (
                                  <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                                    Remove
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3 align-middle">
                              <div className="group max-w-[220px] overflow-hidden whitespace-nowrap font-mono text-xs text-slate-600">
                                <span
                                  className={`inline-block ${
                                    entry.model.length > 24
                                      ? "transition-transform duration-700 group-hover:-translate-x-24"
                                      : ""
                                  }`}
                                  title={entry.model}
                                >
                                  {entry.model}
                                </span>
                              </div>
                            </td>

                            <td className="hidden px-4 py-3 align-middle font-mono text-xs text-emerald-700 md:table-cell">
                              {shortenMaskedKey(entry.apiKeyMasked)}
                            </td>

                            <td className="px-4 py-3 text-right align-middle">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  type="button"
                                  size="small"
                                  rounded
                                  text
                                  severity="success"
                                  icon="pi pi-check-circle"
                                  disabled={pendingDelete || isActive}
                                  onClick={() =>
                                    setSelectedEntryKey(entry.entryKey)
                                  }
                                  aria-label="Set active"
                                  tooltip="Set active"
                                  tooltipOptions={{ position: "top" }}
                                />
                                <Button
                                  type="button"
                                  size="small"
                                  rounded
                                  text
                                  severity={
                                    pendingDelete ? "secondary" : "danger"
                                  }
                                  icon={
                                    pendingDelete ? "pi pi-undo" : "pi pi-trash"
                                  }
                                  onClick={() =>
                                    togglePendingDelete(entry.entryKey)
                                  }
                                  aria-label={
                                    pendingDelete ? "Undo remove" : "Remove"
                                  }
                                  tooltip={pendingDelete ? "Undo" : "Remove"}
                                  tooltipOptions={{ position: "top" }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-slate-200 bg-white/95 px-6 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="flex items-center gap-1.5 text-sm text-gray-500">
            <i className="pi pi-info-circle text-orange-500" />
            {pendingDeletes.size > 0 &&
              `${pendingDeletes.size} key(s) to remove`}
            {pendingDeletes.size > 0 &&
              selectedEntryKey !== userSettings?.defaultEntryKey &&
              " · "}
            {selectedEntryKey !== userSettings?.defaultEntryKey &&
              "Active key changed"}
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
              label={saving ? "Saving..." : "Save changes"}
              icon={saving ? "pi pi-spin pi-spinner" : "pi pi-check"}
              className="!border-orange-500 !bg-orange-500 hover:!bg-orange-600"
              loading={saving}
              onClick={handleSave}
              disabled={!dirty}
            />
          </div>
        </div>
      )}
    </>
  );
}
