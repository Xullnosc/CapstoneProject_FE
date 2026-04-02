import { useNavigate } from "react-router-dom";

type NavItem = {
  label: string;
  icon: string;
  path?: string;
};

const SETTINGS_NAV: NavItem[] = [
  { label: "AI Models", icon: "pi pi-sparkles", path: "/ai-settings" },
  { label: "API Keys", icon: "pi pi-key", path: "/ai-settings/api-keys" },
];

type AIStudioSidebarProps = {
  currentPath: string;
  badge: string;
  description: string;
  footerTitle?: string;
  footerItems?: string[];
};

export default function AIStudioSidebar({
  currentPath,
  badge,
  description,
  footerTitle,
  footerItems,
}: AIStudioSidebarProps) {
  const navigate = useNavigate();

  return (
    <aside className="border-r border-slate-200 bg-white/60 px-4 py-6 sm:px-5">
      <div className="rounded-3xl bg-slate-950 px-5 py-5 text-white shadow-[0_18px_44px_rgba(15,23,42,0.22)]">
        <p className="text-xs uppercase tracking-[0.24em] text-orange-200">
          {badge}
        </p>
        <h2 className="mt-2 text-xl font-semibold">AI Studio</h2>
        <p className="mt-2 text-sm text-slate-300">{description}</p>
      </div>

      <nav className="mt-6 space-y-1.5">
        {SETTINGS_NAV.map((item) => {
          const enabledItem = Boolean(item.path);
          const isActive = enabledItem && currentPath === item.path;

          return (
            <button
              type="button"
              key={item.label}
              onClick={() => {
                if (item.path) {
                  navigate(item.path);
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

      {footerTitle && footerItems && footerItems.length > 0 && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            {footerTitle}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {footerItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
