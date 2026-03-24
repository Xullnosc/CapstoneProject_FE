import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { SweetAlertResult } from "sweetalert2";
import PremiumBreadcrumb from "../../components/Common/PremiumBreadcrumb";
import CommentaryHeader from "../../components/Thesis/ThesisDetails/CommentaryHeader";
import CommentarySidebar from "../../components/Thesis/ThesisDetails/CommentarySidebar";
import CommentaryTabs, {
  type CommentaryTab,
} from "../../components/Thesis/ThesisDetails/CommentaryTabs";
import CommentaryTimeline from "../../components/Thesis/ThesisDetails/CommentaryTimeline";
import ResearchDocumentCard from "../../components/Thesis/ThesisDetails/ResearchDocumentCard";
import ReviewProgressCard from "../../components/Thesis/ThesisDetails/ReviewProgressCard";
import ResultTimelineItem from "../../components/Thesis/ThesisDetails/ResultTimelineItem";
import HodDecisionModal from "../../components/Thesis/HodDecisionModal";
import ReviewSubmissionModal from "../../components/Thesis/ReviewSubmissionModal";
import UpdateThesisModal from "../../components/Thesis/UpdateThesisModal";
import CommentModal from "../../components/Thesis/CommentModal";
import { authService } from "../../services/authService";
import {
  semesterService,
  type Whitelist,
} from "../../services/semesterService";
import { thesisService } from "../../services/thesisService";
import { useThesisCommentary } from "../../hooks/useThesisCommentary";
import type {
  CommentaryEvent,
  Thesis,
  ReviewTimelineEvent,
} from "../../types/thesis";
import Swal from "../../utils/swal";
import styles from "./Thesis.module.css";

const ThesisHistoryTable = lazy(
  () => import("../../components/Thesis/ThesisHistoryTable"),
);

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const formatRelativeTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "just now";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "just now";

  const diffMs = Date.now() - date.getTime();
  const diffInMinutes = Math.floor(diffMs / (1000 * 60));
  const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return relativeTime.format(-diffInMinutes, "minute");

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return relativeTime.format(-diffInHours, "hour");

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return relativeTime.format(-diffInDays, "day");

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const timelineLabelByType: Record<string, string> = {
  REVIEWER_DECISION: "reviewed the proposal",
  HOD_FINAL_DECISION: "made final decision",
  COMMENT_ADDED: "commented",
  COMMENT_EDITED: "edited a comment",
  STATUS_CHANGED: "updated status",
  SYSTEM: "system update",
};

const buildConversationEvents = (
  thesis: Thesis,
  timeline: ReviewTimelineEvent[],
): CommentaryEvent[] => {
  const baseEvents: CommentaryEvent[] = [
    {
      id: `${thesis.thesisId}-proposal`,
      actorName: thesis.ownerName ?? "Student",
      actorEmail: thesis.ownerEmail ?? "",
      label: "proposal submitted",
      content: thesis.shortDescription ?? "No description provided.",
      timestamp: thesis.upDate ?? thesis.updateDate ?? new Date().toISOString(),
      timestampLabel: formatRelativeTime(thesis.upDate ?? thesis.updateDate),
      decision: thesis.status,
    },
  ];

  const reviewEvents = timeline.map((event, index) => {
    const mainComment = event.comments.find(
      (comment) => !comment.parentCommentId,
    );
    return {
      id: `${thesis.thesisId}-event-${event.eventId}`,
      eventId: event.eventId,
      actorName: event.actorName ?? `Participant ${index + 1}`,
      actorEmail: event.actorEmail ?? "",
      label: timelineLabelByType[event.eventType] ?? "updated thesis review",
      content:
        mainComment?.body ??
        (event.eventType === "REVIEWER_DECISION"
          ? "Reviewer decision submitted."
          : event.eventType === "HOD_FINAL_DECISION"
            ? "HOD final decision recorded."
            : "No additional details."),
      timestamp: event.createdAt,
      timestampLabel: formatRelativeTime(event.createdAt),
      decision: event.decision ?? undefined,
      replies: event.comments.filter(
        (comment) => comment.parentCommentId || comment.id !== mainComment?.id,
      ),
    };
  });

  return [...baseEvents, ...reviewEvents].sort(
    (left, right) =>
      new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  );
};

const ThesisDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = authService.getUser();
  const isStudent = user?.roleName === "Student";
  const isLecturer = user?.roleName === "Lecturer";
  const isReviewer =
    (user as { isReviewer?: boolean } | null)?.isReviewer === true;
  const isHOD =
    user?.roleName === "HOD" || user?.roleName === "Head of Department";

  const [activeTab, setActiveTab] = useState<CommentaryTab>("conversations");
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [hodDecisionVisible, setHodDecisionVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [locking, setLocking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [semesterHods, setSemesterHods] = useState<Whitelist[]>([]);

  const {
    thesis,
    reviewStatus,
    reviewTimeline,
    loading,
    error,
    isLeader,
    pausePolling,
    resumePolling,
  } = useThesisCommentary(id, isStudent);

  const showSuccess = useCallback((message: string) => {
    Swal.fire({
      icon: "success",
      title: "Success",
      text: message,
      timer: 3000,
      showConfirmButton: false,
    });
  }, []);

  const showError = useCallback((message: string) => {
    Swal.fire({ icon: "error", title: "Error", text: message });
  }, []);

  const refreshAfterAction = useCallback(async () => {
    pausePolling();
    await resumePolling();
  }, [pausePolling, resumePolling]);

  const executeCancel = useCallback(async () => {
    if (!id) return;
    setCancelling(true);
    pausePolling();
    try {
      await thesisService.cancelThesis(id);
      showSuccess("Thesis proposal has been cancelled.");
      await resumePolling();
    } catch (err) {
      console.error("Failed to cancel thesis", err);
      const axiosError = err as { response?: { data?: { Message?: string } } };
      const message =
        axiosError.response?.data?.Message || "Failed to cancel thesis.";
      showError(message);
    } finally {
      setCancelling(false);
    }
  }, [id, pausePolling, resumePolling, showError, showSuccess]);

  const handleCancelClick = useCallback(() => {
    Swal.fire({
      title: "Cancel Proposal?",
      text: "Are you sure you want to cancel this thesis proposal? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Yes, cancel it!",
    }).then((result: SweetAlertResult) => {
      if (result.isConfirmed) {
        void executeCancel();
      }
    });
  }, [executeCancel]);

  const executeToggleLock = useCallback(async () => {
    if (!id) return;
    setLocking(true);
    pausePolling();
    try {
      const updatedThesis = await thesisService.toggleThesisLock(id);
      showSuccess(
        `Thesis ${updatedThesis.isLocked ? "locked" : "unlocked"} successfully.`,
      );
      await resumePolling();
    } catch (err) {
      console.error("Failed to toggle lock", err);
      const axiosError = err as { response?: { data?: { Message?: string } } };
      const message =
        axiosError.response?.data?.Message || "Failed to toggle thesis lock.";
      showError(message);
    } finally {
      setLocking(false);
    }
  }, [id, pausePolling, resumePolling, showError, showSuccess]);

  const handleToggleLockClick = useCallback(() => {
    if (!thesis) return;
    Swal.fire({
      title: thesis.isLocked ? "Unlock Registration?" : "Lock Registration?",
      text: thesis.isLocked
        ? "Unlocking will allow students to register for it once published."
        : "Locking will prevent students from registering, even if published.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: thesis.isLocked ? "#10b981" : "#f59e0b",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: thesis.isLocked
        ? "Yes, Unlock"
        : "Yes, Lock Registration",
    }).then((result: SweetAlertResult) => {
      if (result.isConfirmed) {
        void executeToggleLock();
      }
    });
  }, [executeToggleLock, thesis]);

  const conversationEvents = useMemo(
    () => (thesis ? buildConversationEvents(thesis, reviewTimeline) : []),
    [thesis, reviewTimeline],
  );

  const canReplyToTimeline = Boolean(isHOD || isReviewer || isLecturer);
  const canComment = Boolean(isHOD || isReviewer || isLecturer);

  const handleAddReply = useCallback(
    async (eventId: number, body: string) => {
      if (!id) return;
      await thesisService.addReviewComment(id, {
        eventId,
        body,
        commentType: "REPLY",
        visibilityScope: "PUBLIC",
      });
      await refreshAfterAction();
    },
    [id, refreshAfterAction],
  );

  const handleAddComment = useCallback(
    async (comment: string) => {
      if (!id) return;
      await thesisService.addReviewComment(id, {
        body: comment,
        commentType: "FOLLOW_UP",
        visibilityScope: "PUBLIC",
      });
      await refreshAfterAction();
    },
    [id, refreshAfterAction],
  );

  useEffect(() => {
    const loadSemesterHods = async () => {
      if (!thesis?.semesterId) {
        setSemesterHods([]);
        return;
      }

      try {
        const result = await semesterService.getWhitelistsPaginated(
          thesis.semesterId,
          {
            page: 1,
            pageSize: 200,
            role: "HOD",
          },
        );
        setSemesterHods(result.items ?? []);
      } catch (err) {
        console.error("Failed to load semester HOD list", err);
        setSemesterHods([]);
      }
    };

    void loadSemesterHods();
  }, [thesis?.semesterId]);

  const submissionDateStr = thesis?.upDate ?? thesis?.updateDate;
  const submissionDateLabel = formatDate(submissionDateStr);
  const reviewers = reviewStatus?.reviewers ?? [];
  const reviewedCount = reviewers.filter((item) => item.reviewedAt).length;
  const latestReviewer = [...reviewers]
    .filter((item) => item.reviewedAt)
    .sort(
      (left, right) =>
        new Date(right.reviewedAt ?? 0).getTime() -
        new Date(left.reviewedAt ?? 0).getTime(),
    )[0]?.fullName;

  const breadcrumbItems = useMemo(
    () => [
      {
        label: isHOD || isReviewer ? "Thesis Repository" : "My Thesis",
        to: isHOD || isReviewer ? "/thesis" : "/my-thesis",
      },
      { label: "Proposal Detail" },
    ],
    [isHOD, isReviewer],
  );

  const canEvaluate = useMemo(() => {
    if (!thesis) return false;
    const assignedReviewers = reviewStatus?.reviewers ?? [];
    const hasReviewed = Boolean(
      assignedReviewers.some(
        (review) =>
          review.userId === user?.userId &&
          review.decision &&
          review.decision !== "Pending",
      ),
    );
    // Show for: Reviewers (who haven't reviewed), Lecturer (thesis owner), and HOD
    return (
      (isReviewer &&
        (thesis.status === "Reviewing" ||
          thesis.status === "On Mentor Inviting") &&
        !hasReviewed) ||
      isLecturer ||
      isHOD
    );
  }, [
    isReviewer,
    isLecturer,
    isHOD,
    reviewStatus?.reviewers,
    thesis,
    user?.userId,
  ]);

  const canMakeHodDecision = Boolean(isHOD && thesis);
  const canToggleLock = Boolean(
    thesis &&
    thesis.status === "Published" &&
    Boolean(isLecturer || isHOD) &&
    thesis.userId === user?.userId,
  );
  const canCancel = Boolean(
    thesis &&
    isStudent &&
    isLeader &&
    (thesis.status === "Reviewing" ||
      thesis.status === "Registered" ||
      thesis.status === "On Mentor Inviting" ||
      thesis.status === "Need Update"),
  );
  const canUploadRevision = Boolean(isStudent && thesis);

  if (loading) {
    return (
      <div className="p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-48 mb-6" />
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !thesis) {
    return (
      <div className="flex items-center justify-center p-6 bg-slate-50 min-h-[60vh]">
        <div className="bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 max-w-md w-full text-center border border-slate-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="pi pi-exclamation-circle text-red-500 text-4xl" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            Thesis not found
          </h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={() =>
              navigate(isHOD || isReviewer ? "/thesis" : "/my-thesis")
            }
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-sm"
          >
            Return to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 lg:p-10 font-sans text-gray-800 bg-[#fafbfc] min-h-screen ${styles.thesisContainer}`}
    >
      <div className="max-w-[1440px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <PremiumBreadcrumb items={breadcrumbItems} />
        </div>

        <CommentaryHeader
          thesis={thesis}
          subtitle={`${thesis.ownerName ?? "Unknown author"} ${formatRelativeTime(submissionDateStr)}`}
        />

        <CommentaryTabs
          activeTab={activeTab}
          conversationCount={conversationEvents.length}
          versionCount={thesis.histories?.length ?? 0}
          onChange={setActiveTab}
        />

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="order-2 lg:order-1 lg:col-span-9 space-y-6 relative">
            <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-slate-300/45 z-0" />
            {activeTab === "conversations" ? (
              <>
                <ResearchDocumentCard fileUrl={thesis.fileUrl} />
                <ReviewProgressCard
                  reviewedCount={reviewedCount}
                  totalCount={reviewers.length}
                  latestReviewer={latestReviewer ?? undefined}
                />
                <CommentaryTimeline
                  events={conversationEvents}
                  emptyMessage="Evaluation in progress. Waiting for reviewers..."
                  canReply={canReplyToTimeline}
                  onAddReply={handleAddReply}
                />
                <ResultTimelineItem
                  canFinalize={canMakeHodDecision}
                  onFinalize={() => {
                    pausePolling();
                    setHodDecisionVisible(true);
                  }}
                  decision={reviewStatus?.hodDecision?.decision}
                />
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
                  <h3 className="font-black text-slate-900 tracking-tight">
                    Iteration Log
                  </h3>
                  <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase">
                    {thesis.histories?.length ?? 0} Phases
                  </div>
                </div>
                <Suspense
                  fallback={
                    <div className="p-8 text-sm text-slate-500">
                      Loading version history...
                    </div>
                  }
                >
                  <ThesisHistoryTable histories={thesis.histories ?? []} />
                </Suspense>
              </div>
            )}
          </div>

          <div className="order-1 lg:order-2 lg:col-span-3">
            <CommentarySidebar
              thesis={thesis}
              reviewStatus={reviewStatus}
              submissionDateRaw={submissionDateStr}
              submissionDateLabel={submissionDateLabel}
              hodMembers={semesterHods}
              canEvaluate={canEvaluate}
              canComment={canComment}
              canToggleLock={canToggleLock}
              canCancel={canCancel}
              canUploadRevision={canUploadRevision}
              locking={locking}
              cancelling={cancelling}
              onOpenReview={() => {
                pausePolling();
                setReviewModalVisible(true);
              }}
              onOpenComment={() => {
                pausePolling();
                setCommentModalVisible(true);
              }}
              onToggleLock={handleToggleLockClick}
              onCancel={handleCancelClick}
              onUploadRevision={() => {
                pausePolling();
                setUploadModalVisible(true);
              }}
              infoMessage={
                isReviewer
                  ? "Reviewers should evaluate proposals based on academic rigor and technical feasibility."
                  : "Status updates and decision progress are refreshed automatically."
              }
            />
          </div>
        </main>
      </div>

      <UpdateThesisModal
        visible={uploadModalVisible}
        thesis={thesis}
        onHide={() => {
          setUploadModalVisible(false);
          void resumePolling();
        }}
        onSuccess={refreshAfterAction}
      />

      <ReviewSubmissionModal
        visible={reviewModalVisible}
        thesisId={id || ""}
        onHide={() => {
          setReviewModalVisible(false);
          void resumePolling();
        }}
        onSuccess={refreshAfterAction}
      />

      <HodDecisionModal
        visible={hodDecisionVisible}
        thesisId={id || ""}
        onHide={() => {
          setHodDecisionVisible(false);
          void resumePolling();
        }}
        onSuccess={refreshAfterAction}
      />

      <CommentModal
        visible={commentModalVisible}
        onHide={() => {
          setCommentModalVisible(false);
          void resumePolling();
        }}
        onSubmit={handleAddComment}
      />
    </div>
  );
};

export default ThesisDetailPage;
