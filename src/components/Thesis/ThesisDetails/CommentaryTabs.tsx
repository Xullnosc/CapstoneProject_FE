import React from "react";

export type CommentaryTab = "conversations" | "versions";

interface CommentaryTabsProps {
  activeTab: CommentaryTab;
  conversationCount: number;
  versionCount: number;
  onChange: (tab: CommentaryTab) => void;
  showConversations?: boolean;
}

const TabButton = ({
  active,
  label,
  icon,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: string;
  count: number;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 px-1 py-3 border-b-2 text-sm transition-colors ${
      active
        ? "border-orange-500 text-slate-900 font-semibold"
        : "border-transparent text-slate-500 hover:text-slate-800 font-medium"
    }`}
  >
    <i className={`${icon} text-sm ${active ? "text-orange-600" : ""}`} />
    <span>{label}</span>
    <span
      className={`${active ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"} px-1.5 py-0.5 rounded-full text-[10px] font-bold`}
    >
      {count}
    </span>
  </button>
);

const CommentaryTabs: React.FC<CommentaryTabsProps> = ({
  activeTab,
  conversationCount,
  versionCount,
  onChange,
  showConversations = true,
}) => {
  return (
    <nav className="bg-white border-b border-slate-200/70 px-4 md:px-8 rounded-2xl">
      <div className="max-w-[1440px] mx-auto flex items-center gap-8">
        {showConversations && (
          <TabButton
            active={activeTab === "conversations"}
            label="Conversations"
            icon="pi pi-comments"
            count={conversationCount}
            onClick={() => onChange("conversations")}
          />
        )}
        <TabButton
          active={activeTab === "versions"}
          label="Versions"
          icon="pi pi-history"
          count={versionCount}
          onClick={() => onChange("versions")}
        />
      </div>
    </nav>
  );
};

export default React.memo(CommentaryTabs);
