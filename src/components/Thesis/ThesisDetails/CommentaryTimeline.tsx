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
  Pass: "bg-emerald-100 text-emerald-700",
  Fail: "bg-rose-100 text-rose-700",
  Pending: "bg-slate-100 text-slate-500",
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
    <div className="space-y-6 relative">
      {events.map((event) => (
        <article key={event.id} className="relative z-10 pl-10">
          <span className="absolute left-[10px] top-6 w-3 h-3 rounded-full bg-white border-2 border-slate-300 shadow-sm" />
          <div className="bg-white rounded-xl overflow-hidden border border-slate-300/25 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-slate-100/60 px-4 py-2.5 flex items-center justify-between gap-4 border-b border-slate-200/70">
              <div className="flex items-center gap-3 min-w-0">
                <MemberAvatar
                  email={event.actorEmail}
                  fullName={event.actorName}
                  className="w-6 h-6 rounded-full shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">
                      {event.actorName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {event.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {event.timestampLabel}
                  </p>
                </div>
              </div>
              {event.decision && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${decisionClasses[event.decision] ?? "bg-orange-100 text-orange-700"}`}
                >
                  {event.decision}
                </span>
              )}
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {event.content}
              </p>
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
      ))}
    </div>
  );
};

export default React.memo(CommentaryTimeline);
