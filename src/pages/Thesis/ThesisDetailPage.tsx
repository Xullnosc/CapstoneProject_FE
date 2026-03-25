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
import { applicationService } from "../../services/applicationService";
import type { ApplicationStatus } from "../../types/application";
import { useThesisCommentary } from "../../hooks/useThesisCommentary";
import type {
  CommentaryEvent,
  Thesis,
  ReviewTimelineEvent,
} from "../../types/thesis";
import Swal from "../../utils/swal";
import { Button as PrimeButton } from "primereact/button";
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
  const isReviewer = (user as { isReviewer?: boolean } | null)?.isReviewer === true;
  const isHOD = user?.roleName === "HOD" || user?.roleName === "Head of Department";

  const [activeTab, setActiveTab] = useState<CommentaryTab>("conversations");
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [hodDecisionVisible, setHodDecisionVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [locking, setLocking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [semesterHods, setSemesterHods] = useState<Whitelist[]>([]);

  // Application assignment related states
  const [applyingForThesis, setApplyingForThesis] = useState(false);
  const [existingAppStatus, setExistingAppStatus] = useState<ApplicationStatus | null>(null);
  const [existingAppId, setExistingAppId] = useState<number | null>(null);

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
    if (isStudent && isLeader && thesis?.status === 'Published') {
        try {
            const myApps = await applicationService.getMyApplications();
            const existingApp = myApps.find(a => a.thesisId === thesis.thesisId);
            if (existingApp) {
                setExistingAppStatus(existingApp.status);
                setExistingAppId(existingApp.id);
            } else {
                setExistingAppStatus(null);
                setExistingAppId(null);
            }
        } catch (err) {
            console.error('Failed to update application status', err);
        }
    }
    await resumePolling();
  }, [pausePolling, resumePolling, isStudent, isLeader, thesis]);

  useEffect(() => {
    const checkApplication = async () => {
        if (isStudent && isLeader && thesis?.status === 'Published') {
            try {
                const myApps = await applicationService.getMyApplications();
                const existingApp = myApps.find(a => a.thesisId === thesis.thesisId);
                if (existingApp) {
                    setExistingAppStatus(existingApp.status);
                    setExistingAppId(existingApp.id);
                }
            } catch (err) {
                console.error('Failed to check existing application', err);
            }
        }
    };
    void checkApplication();
  }, [isStudent, isLeader, thesis?.status, thesis?.thesisId]);

  const executeCancel = useCallback(async () => {
    if (!id) return;
    setCancelling(true);
    pausePolling();
    try {
      await thesisService.cancelThesis(id);
      showSuccess("Thesis proposal has been cancelled.");
      await resumePolling();
    } catch (err) {
      const axiosError = err as { response?: { data?: { Message?: string } } };
      const message = axiosError.response?.data?.Message || "Failed to cancel thesis.";
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

  const handleCancelRequest = useCallback(async () => {
    if (!existingAppId) return;
    const result = await Swal.fire({
        title: 'Cancel Assignment Request?',
        html: `Are you sure you want to cancel your request for <strong>"${thesis?.title}"</strong>?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, cancel it',
        cancelButtonText: 'No, keep it',
    });

    if (!result.isConfirmed) return;

    setApplyingForThesis(true);
    try {
        await applicationService.cancelApplication(existingAppId);
        showSuccess('Request cancelled successfully.');
        setExistingAppStatus(null);
        setExistingAppId(null);
        await refreshAfterAction();
    } catch (err: unknown) {
        const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        showError(axiosMsg || 'Failed to cancel request.');
    } finally {
        setApplyingForThesis(false);
    }
  }, [existingAppId, thesis?.title, showSuccess, showError, refreshAfterAction]);

  const executeToggleLock = useCallback(async () => {
    if (!id) return;
    setLocking(true);
    pausePolling();
    try {
      const updatedThesis = await thesisService.toggleThesisLock(id);
      showSuccess(`Thesis ${updatedThesis.isLocked ? "locked" : "unlocked"} successfully.`);
      await resumePolling();
    } catch (err) {
      const axiosError = err as { response?: { data?: { Message?: string } } };
      const message = axiosError.response?.data?.Message || "Failed to toggle thesis lock.";
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
        : "Locking will prevent students from registering.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: thesis.isLocked ? "#10b981" : "#f59e0b",
      confirmButtonText: thesis.isLocked ? "Yes, Unlock" : "Yes, Lock Registration",
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
          { page: 1, pageSize: 200, role: "HOD" },
        );
        setSemesterHods(result.items ?? []);
      } catch {
        setSemesterHods([]);
      }
    };
    void loadSemesterHods();
  }, [thesis?.semesterId]);

  const submissionDateStr = thesis?.upDate ?? thesis?.updateDate;
  const submissionDateLabel = formatDate(submissionDateStr);
  const reviewers = reviewStatus?.reviewers ?? [];
  const reviewedCount = reviewers.filter((item) => item.reviewedAt).length;
  
  // FIX: Type 'string | null' is not assignable to 'string | undefined'
  const latestReviewer = useMemo(() => {
    const sorted = [...reviewers]
      .filter((item) => item.reviewedAt)
      .sort((a, b) => {
        const dateA = new Date(a.reviewedAt!).getTime();
        const dateB = new Date(b.reviewedAt!).getTime();
        return dateB - dateA;
      });
    return sorted[0]?.fullName ?? undefined;
  }, [reviewers]);

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
    const hasReviewed = assignedReviewers.some(
        (review) => review.userId === user?.userId && review.decision && review.decision !== "Pending"
    );
    return (
      (isReviewer && (thesis.status === "Reviewing" || thesis.status === "On Mentor Inviting") && !hasReviewed) ||
      isLecturer ||
      isHOD
    );
  }, [isReviewer, isLecturer, isHOD, reviewStatus?.reviewers, thesis, user?.userId]);

  const canMakeHodDecision = Boolean(isHOD && thesis);
  const canToggleLock = Boolean(
    thesis &&
    thesis.status === "Published" &&
    Boolean(isLecturer || isHOD) &&
    thesis.userId === user?.userId,
  );
  const canCancel = Boolean(
    thesis && isStudent && isLeader &&
    (thesis.status === "Reviewing" || thesis.status === "Registered" || thesis.status === "On Mentor Inviting" || thesis.status === "Need Update")
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
          </div>
        </div>
      </div>
    );
  }

  if (error || !thesis) {
    return (
      <div className="flex items-center justify-center p-6 bg-slate-50 min-h-[60vh]">
        <div className="bg-white rounded-3xl p-10 shadow-xl max-w-md w-full text-center border">
          <i className="pi pi-exclamation-circle text-red-500 text-4xl mb-6" />
          <h2 className="text-2xl font-black mb-2">Thesis not found</h2>
          <p className="text-slate-500 text-sm mb-8">{error}</p>
          <button type="button" onClick={() => navigate(isHOD || isReviewer ? "/thesis" : "/my-thesis")} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold">Return to List</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 lg:p-10 font-sans bg-[#fafbfc] min-h-screen ${styles.thesisContainer}`}>
      <div className="max-w-[1440px] mx-auto space-y-6">
        <PremiumBreadcrumb items={breadcrumbItems} />
        <CommentaryHeader thesis={thesis} subtitle={`${thesis.ownerName ?? "Unknown"} ${formatRelativeTime(submissionDateStr)}`} />
        <CommentaryTabs activeTab={activeTab} conversationCount={conversationEvents.length} versionCount={thesis.histories?.length ?? 0} onChange={setActiveTab} />
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="order-2 lg:order-1 lg:col-span-9 space-y-6 relative">
            {activeTab === "conversations" ? (
              <>
                <ResearchDocumentCard fileUrl={thesis.fileUrl} />
                <ReviewProgressCard reviewedCount={reviewedCount} totalCount={reviewers.length} latestReviewer={latestReviewer} />
                <CommentaryTimeline events={conversationEvents} emptyMessage="Evaluation in progress..." canReply={canReplyToTimeline} onAddReply={handleAddReply} />
                <ResultTimelineItem canFinalize={canMakeHodDecision} onFinalize={() => { pausePolling(); setHodDecisionVisible(true); }} decision={reviewStatus?.hodDecision?.decision} />
              </>
            ) : (
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b bg-slate-50/80 flex justify-between items-center">
                  <h3 className="font-black tracking-tight">Iteration Log</h3>
                </div>
                <Suspense fallback={<div className="p-8 text-sm">Loading...</div>}>
                  <ThesisHistoryTable histories={thesis.histories ?? []} />
                </Suspense>
              </div>
            )}
          </div>
          <div className="order-1 lg:order-2 lg:col-span-3">
            <div className="space-y-6">
                <CommentarySidebar
                    thesis={thesis} reviewStatus={reviewStatus} submissionDateRaw={submissionDateStr} submissionDateLabel={submissionDateLabel} hodMembers={semesterHods}
                    canEvaluate={canEvaluate} canComment={canComment} canToggleLock={canToggleLock} canCancel={canCancel} canUploadRevision={canUploadRevision} locking={locking} cancelling={cancelling}
                    onOpenReview={() => { pausePolling(); setReviewModalVisible(true); }}
                    onOpenComment={() => { pausePolling(); setCommentModalVisible(true); }}
                    onToggleLock={handleToggleLockClick} onCancel={handleCancelClick} onUploadRevision={() => { pausePolling(); setUploadModalVisible(true); }}
                    infoMessage={isReviewer ? "Reviewers should..." : "Refreshed automatically."}
                />
                {thesis.status === 'Published' && isStudent && isLeader && (
                    <div className="bg-white rounded-2xl p-6 border shadow-sm">
                        <h3 className="text-[10px] font-black uppercase text-slate-400 mb-5">Registration</h3>
                        {existingAppStatus ? (
                            <PrimeButton
                                label={existingAppStatus === 'Pending' ? (applyingForThesis ? 'Cancelling...' : 'Cancel Assign') : `Application ${existingAppStatus}`}
                                icon={existingAppStatus === 'Approved' ? 'pi pi-check' : 'pi pi-times'}
                                onClick={existingAppStatus === 'Pending' ? handleCancelRequest : undefined}
                                loading={applyingForThesis} disabled={existingAppStatus !== 'Pending'}
                                className="p-button-sm w-full font-bold uppercase py-3"
                                style={{ backgroundColor: existingAppStatus === 'Approved' ? '#10b981' : '#ef4444', borderColor: existingAppStatus === 'Approved' ? '#10b981' : '#ef4444' }}
                            />
                        ) : (
                            <PrimeButton
                                label={applyingForThesis ? 'Submitting...' : 'Apply for this Thesis'} icon="pi pi-send"
                                onClick={async () => {
                                    const res = await Swal.fire({ title: 'Apply?', icon: 'question', showCancelButton: true });
                                    if (!res.isConfirmed) return;
                                    setApplyingForThesis(true);
                                    try {
                                        await applicationService.submitApplication(thesis.thesisId);
                                        showSuccess('Success!');
                                        await refreshAfterAction();
                                    } catch (err: unknown) {
                                        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                                        showError(msg || 'Failed');
                                    } finally {
                                        setApplyingForThesis(false);
                                    }
                                }}
                                loading={applyingForThesis} className="p-button-sm p-button-orange w-full font-bold uppercase py-3" style={{ backgroundColor: '#f26f21', borderColor: '#f26f21' }}
                            />
                        )}
                    </div>
                )}
            </div>
          </div>
        </main>
      </div>

      <UpdateThesisModal visible={uploadModalVisible} thesis={thesis} onHide={() => { setUploadModalVisible(false); void resumePolling(); }} onSuccess={refreshAfterAction} />
      <ReviewSubmissionModal visible={reviewModalVisible} thesisId={id || ""} onHide={() => { setReviewModalVisible(false); void resumePolling(); }} onSuccess={refreshAfterAction} />
      <HodDecisionModal visible={hodDecisionVisible} thesisId={id || ""} onHide={() => { setHodDecisionVisible(false); void resumePolling(); }} onSuccess={refreshAfterAction} />
      <CommentModal visible={commentModalVisible} onHide={() => { setCommentModalVisible(false); void resumePolling(); }} onSubmit={handleAddComment} />
    </div>
  );
};

export default ThesisDetailPage;
