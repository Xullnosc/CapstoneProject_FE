import React, { useState } from "react";
import MemberAvatar from "../../team/MemberAvatar";
import type { ReviewTimelineComment } from "../../../types/thesis";

interface MockReplySectionProps {
  placeholder?: string;
  replies?: ReviewTimelineComment[];
  canReply?: boolean;
  onSubmit?: (message: string) => Promise<void>;
}

const MockReplySection: React.FC<MockReplySectionProps> = ({
  placeholder = "Write a quick reply...",
  replies = [],
  canReply = true,
  onSubmit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !onSubmit) return;

    try {
      setSubmitting(true);
      await onSubmit(trimmed);
      setDraft("");
      setIsOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const formatReplyDate = (value: string) => {
    try {
      return new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  return (
    <div className="pt-2 border-t border-slate-100">
      {replies.length > 0 && (
        <div className="space-y-2 mb-3">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="bg-slate-50 border border-slate-200/70 rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <MemberAvatar
                  email={reply.authorEmail ?? ""}
                  fullName={reply.authorName ?? "Participant"}
                  className="w-5 h-5 rounded-full shrink-0"
                />
                <span className="text-xs font-semibold text-slate-700">
                  {reply.authorName ?? "Participant"}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {reply.body}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                {formatReplyDate(reply.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}

      {!canReply ? null : isOpen ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder={placeholder}
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 resize-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setDraft("");
              }}
              className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !draft.trim()}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-md"
            >
              {submitting ? "Posting..." : "Post Reply"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full text-left px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-xs text-slate-500 transition-colors border border-slate-200/80"
        >
          Reply...
        </button>
      )}
    </div>
  );
};

export default React.memo(MockReplySection);
