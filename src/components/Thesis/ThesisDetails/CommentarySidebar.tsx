import React from "react";
import { Button as PrimeButton } from "primereact/button";
import MemberAvatar from "../../team/MemberAvatar";
import type { Whitelist } from "../../../services/semesterService";
import type { ThesisReviewStatus, Thesis } from "../../../types/thesis";
import SubmissionCalendar from "./SubmissionCalendar";

interface CommentarySidebarProps {
  thesis: Thesis;
  reviewStatus: ThesisReviewStatus | null;
  hodMembers: Whitelist[];
  submissionDateRaw: string | null | undefined;
  submissionDateLabel: string;
  canEvaluate: boolean;
  canToggleLock: boolean;
  canCancel: boolean;
  canUploadRevision: boolean;
  canComment: boolean;
  locking: boolean;
  cancelling: boolean;
  onOpenReview: () => void;
  onToggleLock: () => void;
  onCancel: () => void;
  onUploadRevision: () => void;
  onOpenComment: () => void;
  isHOD?: boolean;
  infoMessage?: string;
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-3 pt-4 border-t border-slate-200/70 first:pt-0 first:border-t-0">
    <div className="flex items-center justify-between group">
      <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        {title}
      </h5>
    </div>
    {children}
  </section>
);

const CommentarySidebar: React.FC<CommentarySidebarProps> = ({
  thesis,
  reviewStatus,
  hodMembers,
  submissionDateRaw,
  submissionDateLabel,
  canEvaluate,
  canToggleLock,
  canCancel,
  canUploadRevision,
  canComment,
  locking,
  cancelling,
  onOpenReview,
  onToggleLock,
  onCancel,
  onUploadRevision,
  onOpenComment,
  isHOD,
  infoMessage,
}) => {
  const reviewers = reviewStatus?.reviewers ?? [];

  return (
    <aside className="space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm sticky top-8 space-y-6">
        <Section title="Actions">
          <div className="space-y-2">
            {canEvaluate && (
              <button
                onClick={onOpenReview}
                className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 active:scale-95 transition-all text-white font-bold py-3 px-4 rounded-xl grid grid-cols-[20px_1fr] items-center gap-3 shadow-md hover:shadow-lg text-sm uppercase tracking-wider"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/15 shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </span>
                <span className="text-center leading-tight">
                  {isHOD ? "Finalize" : "Submit My Evaluation"}
                </span>
              </button>
            )}
            {canComment && (
              <button
                onClick={onOpenComment}
                className="w-full bg-sky-600 hover:bg-sky-700 active:bg-sky-800 active:scale-95 transition-all text-white font-bold py-3 px-4 rounded-xl grid grid-cols-[20px_1fr] items-center gap-3 shadow-md hover:shadow-lg text-sm uppercase tracking-wider"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/15 shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <span className="text-center leading-tight">Add Comment</span>
              </button>
            )}
            {(canToggleLock || canCancel || canUploadRevision) && (
              <div className="space-y-2">
                {canToggleLock && (
                  <PrimeButton
                    label={
                      thesis.isLocked
                        ? "Unlock Registration"
                        : "Lock Registration"
                    }
                    icon={thesis.isLocked ? "pi pi-lock-open" : "pi pi-lock"}
                    onClick={onToggleLock}
                    loading={locking}
                    className={`p-button-sm w-full font-bold uppercase tracking-wider py-3 text-xs ${thesis.isLocked ? "p-button-success" : "p-button-warning"}`}
                  />
                )}
                {canCancel && (
                  <PrimeButton
                    label={cancelling ? "Cancelling..." : "Revoke Proposal"}
                    icon="pi pi-trash"
                    onClick={onCancel}
                    loading={cancelling}
                    className="p-button-sm p-button-danger p-button-text w-full font-bold uppercase tracking-wider text-xs"
                  />
                )}
                {canUploadRevision && (
                  <PrimeButton
                    label="Submit Revision"
                    icon="pi pi-upload"
                    onClick={onUploadRevision}
                    className="p-button-sm w-full font-bold uppercase tracking-wider py-3 text-xs"
                    style={{
                      backgroundColor: "#f26f21",
                      borderColor: "#f26f21",
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </Section>

        <Section title="Reviewers">
          <div className="space-y-3">
            {reviewers.length > 0 ? (
              reviewers.map((reviewer) => (
                <div
                  key={reviewer.userId}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MemberAvatar
                      email={reviewer.email ?? ""}
                      fullName={reviewer.fullName ?? "Reviewer"}
                      className="w-7 h-7 rounded-full shrink-0"
                    />
                    <span className="text-xs font-medium text-slate-900 truncate">
                      {reviewer.fullName ?? "Reviewer"}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold ${reviewer.decision === "Pass" ? "text-emerald-600" : reviewer.decision === "Fail" ? "text-rose-600" : "text-slate-500"}`}
                  >
                    {reviewer.decision === "Pass"
                      ? "OK"
                      : reviewer.decision === "Fail"
                        ? "Consider"
                        : (reviewer.decision ?? "Awaiting review")}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">
                No reviewers assigned yet.
              </p>
            )}
          </div>
        </Section>

        <Section title="Author">
          <div className="flex items-center gap-2">
            <MemberAvatar
              email={thesis.ownerEmail ?? ""}
              fullName={thesis.ownerName ?? "Author"}
              className="w-7 h-7 rounded-full shrink-0"
            />
            <span className="text-xs font-medium text-slate-900">
              {thesis.ownerName ?? "Unknown author"}
            </span>
          </div>
        </Section>

        <Section title="HOD">
          <div className="space-y-2">
            {hodMembers.length > 0 ? (
              hodMembers.map((hod) => (
                <div
                  key={hod.whitelistId}
                  className="flex items-center gap-2 min-w-0"
                >
                  <MemberAvatar
                    email={hod.email ?? ""}
                    fullName={hod.fullName ?? "HOD"}
                    avatarUrl={hod.avatar}
                    className="w-7 h-7 rounded-full shrink-0"
                  />
                  <span className="text-xs font-medium text-slate-900 truncate">
                    {hod.fullName ?? hod.email ?? "HOD"}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-600">
                {reviewStatus?.hodDecision?.fullName ??
                  "No HOD found for this semester"}
              </div>
            )}
          </div>
        </Section>

        <Section title="Submission date">
          <div className="text-sm font-semibold text-slate-900">
            {submissionDateLabel}
          </div>
          <SubmissionCalendar dateValue={submissionDateRaw} />
        </Section>

        {infoMessage && (
          <Section title="Information">
            <p className="text-xs text-slate-600 leading-relaxed">
              {infoMessage}
            </p>
          </Section>
        )}
      </div>
    </aside>
  );
};

export default React.memo(CommentarySidebar);
