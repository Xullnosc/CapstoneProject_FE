import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { InputSwitch } from "primereact/inputswitch";
import type { Thesis } from "../../types/thesis";
import ThesisStatusBadge from "./ThesisStatusBadge";

interface Props {
  thesis: Thesis;
  onUploadClick?: (thesis: Thesis) => void;
  canUpload?: boolean;
  canLock?: boolean;
  onToggleLock?: (thesis: Thesis) => void;
  isLocking?: boolean;
  isHOD?: boolean;
  onHodDecisionClick?: (thesis: Thesis) => void;
  showLockStatus?: boolean;
}

const ThesisCard = ({
  thesis,
  onUploadClick,
  canUpload = false,
  canLock = false,
  onToggleLock,
  isLocking = false,
  showLockStatus = false,
}: Props) => {
  const navigate = useNavigate();
  const [now] = useState<number>(() => Date.now());

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return dateStr;

      const nowDate = new Date(now);
      const diffMs = now - date.getTime();
      const oneMinuteMs = 60_000;
      const oneHourMs = 3_600_000;
      const oneDayMs = 86_400_000;

      if (diffMs < oneMinuteMs) return "just now";

      if (diffMs < oneDayMs) {
        const isSameDay = date.toDateString() === nowDate.toDateString();
        const diffHours = Math.floor(diffMs / oneHourMs);

        if (isSameDay && diffHours >= 9) {
          return date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        if (diffMs < oneHourMs) {
          const minutes = Math.floor(diffMs / oneMinuteMs);
          return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
        }

        return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
      }

      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Use updateDate first, then upDate as fallback (both may be returned from BE)
  const displayDate = thesis.updateDate ?? thesis.upDate;

  return (
    <div className="bg-white border rounded-2xl border-slate-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col overflow-hidden">
      <div className="p-6 flex-1 bg-white">
        {/* Header: Title + Status */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <h3 className="text-slate-900 font-bold text-base leading-snug line-clamp-2 flex-1">
            {thesis.title}
          </h3>
          <ThesisStatusBadge status={thesis.status} />
        </div>

        {/* Author */}
        {thesis.ownerName && (
          <div className="flex items-center gap-3 mb-3">
            <div className="size-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold flex-shrink-0">
              {thesis.ownerName.charAt(0).toUpperCase()}
            </div>
            <span className="text-slate-600 text-sm font-medium">
              {thesis.ownerName}
            </span>
          </div>
        )}

        {/* Description */}
        {thesis.shortDescription && (
          <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">
            {thesis.shortDescription}
          </p>
        )}

        {/* Footer: date + lock state */}
        <div className="flex items-center justify-between text-xs text-slate-400 gap-1 mt-auto">
          <div className="flex items-center gap-1">
            <i className="pi pi-history text-xs" />
            <span>Last updated: {formatDate(displayDate)}</span>
          </div>
          {showLockStatus && thesis.status === "Published" && (
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                thesis.isLocked
                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                  : "bg-emerald-50 text-emerald-600 border border-emerald-200"
              }`}
              title={
                thesis.isLocked
                  ? "Closed — students cannot register"
                  : "Open — students can register"
              }
            >
              <i
                className={thesis.isLocked ? "pi pi-lock" : "pi pi-lock-open"}
              />
              <span>
                {thesis.isLocked ? "Registration Closed" : "Open Registration"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 pt-2 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(`/thesis/${thesis.thesisId}`)}
          className="flex-1 py-2.5 border-2 border-primary text-primary font-bold rounded-xl cursor-pointer hover:bg-orange-50 transition-colors text-sm"
        >
          View Details
        </button>
        {canUpload && (
          <button
            onClick={() => onUploadClick?.(thesis)}
            className="flex-1 py-2.5 bg-primary text-white cursor-pointer font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            Upload New
          </button>
        )}
        {canLock && thesis.status === "Published" && (
          <div className="flex flex-1 items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:border-amber-200 transition-colors group/lock">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 leading-none mb-1">
                Thesis Access
              </span>
              <span
                className={`text-xs font-bold leading-none ${thesis.isLocked ? "text-amber-600" : "text-emerald-600"}`}
              >
                {thesis.isLocked ? "Locked" : "Open Registration"}
              </span>
            </div>
            <div className="relative">
              {isLocking && (
                <i className="pi pi-spinner pi-spin absolute -left-6 top-1/2 -translate-y-1/2 text-primary" />
              )}
              <InputSwitch
                checked={thesis.isLocked}
                onChange={() => onToggleLock?.(thesis)}
                disabled={isLocking}
                className="orange-switch"
                tooltip={
                  thesis.isLocked ? "Current: Locked" : "Current: Unlocked"
                }
                tooltipOptions={{ position: "top" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThesisCard;
