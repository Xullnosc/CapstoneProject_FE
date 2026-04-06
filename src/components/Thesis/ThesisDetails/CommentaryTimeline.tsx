import React from "react";
import MemberAvatar from "../../team/MemberAvatar";
import type { CommentaryEvent } from "../../../types/thesis";
import MockReplySection from "./MockReplySection";

interface CommentaryTimelineProps {
  events: CommentaryEvent[];
  emptyMessage: string;
  canReply?: boolean;
  onAddReply?: (eventId: number, body: string) => Promise<void>;
}

const decisionClasses: Record<string, string> = {
  Pass: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Fail: "bg-rose-50 text-rose-700 border-rose-100",
  OK: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Consider: "bg-rose-50 text-rose-700 border-rose-100",
  Pending: "bg-slate-100 text-slate-500",
};

const decisionLabelMap: Record<string, string> = {
  Pass: "OK",
  Fail: "Consider",
  OK: "OK",
  Consider: "Consider",
};

const CommentaryTimeline: React.FC<CommentaryTimelineProps> = ({
  events,
  emptyMessage,
  canReply = false,
  onAddReply,
}) => {
  if (events.length === 0) {
    return (
      <div className="relative z-10 pl-10">
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500 text-sm shadow-sm">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative overflow-hidden">
      {events.map((event, idx) => {
        const isLast = idx === events.length - 1;
        const isFinalDecision = event.eventType === "FINAL_DECISION";
        const isHodFinalDecision =
          isFinalDecision && event.actorRole?.toUpperCase() === "HOD";
        const isSystemFinalDecision = isFinalDecision && !isHodFinalDecision;

        const getCircleClass = () => {
          if (isHodFinalDecision) {
            return "border-amber-500 bg-amber-50";
          }
          if (isSystemFinalDecision) {
            return "border-sky-500 bg-sky-50";
          }
          if (event.decision === 'Pass' || event.decision === 'OK') {
            return "border-emerald-500 bg-emerald-50";
          }
          if (event.decision === 'Fail' || event.decision === 'Consider') {
            return "border-rose-500 bg-rose-50";
          }
          // Default / Proposer / Student submission
          return "border-orange-500 bg-orange-50";
        };

        return (
          <article key={event.id} className="relative z-10 pl-10">
            {!isLast && (
              <div className="absolute left-[15.5px] top-[34px] bottom-[-24px] w-[2px] bg-slate-100 -z-10" />
            )}
            <span className={`absolute left-[10px] top-6 w-3 h-3 rounded-full border-2 transition-all duration-300 z-10 ${getCircleClass()}`} />
          <div className={`bg-white rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow ${isHodFinalDecision ? "border-amber-300/70" : isSystemFinalDecision ? "border-sky-300/70" : "border-slate-300/25"}`}>
            <div className={`px-4 py-2.5 flex items-center justify-between gap-4 border-b ${isHodFinalDecision ? "bg-amber-50/80 border-amber-200/70" : isSystemFinalDecision ? "bg-sky-50/80 border-sky-200/70" : "bg-slate-100/60 border-slate-200/70"}`}>
              <div className="flex items-center gap-3 min-w-0">
                {!isSystemFinalDecision ? (
                  <MemberAvatar
                    email={event.actorEmail}
                    fullName={event.actorName}
                    avatarUrl={event.actorAvatar ?? undefined}
                    className="w-6 h-6 rounded-full shrink-0"
                  />
                ) : (
                  <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-sky-100 text-sky-700 shrink-0">
                    <i className="pi pi-sparkles text-[10px]" />
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isSystemFinalDecision ? (
                      <span className="text-sm font-semibold text-sky-900">
                        Final Decision
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-slate-900">
                        {event.actorName} {event.actorRole ? `(${event.actorRole.toLowerCase()})` : ""}
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      {event.label}
                    </span>
                    {isFinalDecision && typeof event.round === "number" && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-600">
                        Round {event.round}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {event.timestampLabel}
                  </p>
                </div>
              </div>
              {event.decision && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border-2 shadow-sm ${decisionClasses[event.decision] || decisionClasses.Pending}`}
                >
                  {decisionLabelMap[event.decision] || event.decision}
                </span>
              )}
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {event.content}
              </p>
              
              {event.checklistResults && event.checklistResults.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {event.checklistResults.map((result, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100/50 shadow-sm animate-in fade-in zoom-in duration-300"
                    >
                      <i className="pi pi-check text-[9px]" />
                      {result}
                    </span>
                  ))}
                </div>
              )}
              {event.fileUrl && (
                <button
                  type="button"
                  onClick={() =>
                    window.open(event.fileUrl!, "_blank", "noopener,noreferrer")
                  }
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                    <i className="pi pi-file-pdf" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      Attachment
                    </p>
                    <p className="text-xs font-bold text-slate-700 truncate">
                      Open review document
                    </p>
                  </div>
                </button>
              )}
              <MockReplySection
                placeholder={`Reply to ${event.actorName}...`}
                replies={event.replies ?? []}
                canReply={canReply && Boolean(event.eventId)}
                onSubmit={
                  event.eventId && onAddReply
                    ? (message) => onAddReply(event.eventId!, message)
                    : undefined
                }
              />
            </div>
          </div>
          </article>
        );
      })}
    </div>
  );
};

export default React.memo(CommentaryTimeline);
