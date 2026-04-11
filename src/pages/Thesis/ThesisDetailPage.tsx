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
import ThesisPublicView from "../../components/Thesis/ThesisDetails/ThesisPublicView";
import { authService } from "../../services/authService";
import {
  semesterService,
  type Whitelist,
} from "../../services/semesterService";
import { thesisService } from "../../services/thesisService";
import ForceAssignThesisModal from "../../components/Thesis/ForceAssignThesisModal";
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
    let isoStr = dateStr.replace(" ", "T");
    if (!isoStr.match(/[Z+-]\d{2}(:?\d{2})?$/)) {
      isoStr = isoStr.endsWith("Z") ? isoStr : `${isoStr}Z`;
    }
    const date = new Date(isoStr);
    return date.toLocaleDateString("en-GB", {
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
  
  // Robust UTC parsing: if no timezone offset or 'Z', append 'Z' to treat as UTC.
  // Also ensure ISO 8601 'T' separator instead of space to be safer across browsers.
  let isoStr = dateStr.replace(" ", "T");
  if (!isoStr.match(/[Z+-]\d{2}(:?\d{2})?$/)) {
    isoStr = isoStr.endsWith("Z") ? isoStr : `${isoStr}Z`;
  }
  
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) {
    const backup = new Date(dateStr);
    if (Number.isNaN(backup.getTime())) return "just now";
    return backup.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);

  const timePart = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return `today at ${timePart}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isYesterday) return `yesterday at ${timePart}`;

  if (diffInHours < 24 * 7) {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago at ${timePart}`;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const timelineLabelByType: Record<string, string> = {
  REVIEWER_DECISION: "reviewed the proposal",
  FINAL_DECISION: "made final decision",
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
      actorAvatar: thesis.ownerAvatar,
      actorRole: "AUTHOR",
      label: "promote",
      content: thesis.shortDescription ?? "No description provided.",
      timestamp: thesis.upDate ?? thesis.updateDate ?? new Date().toISOString(),
      timestampLabel: formatRelativeTime(thesis.upDate ?? thesis.updateDate),
    },
  ];

  const reviewEvents = timeline
    .filter((event) => event.eventType !== "REVIEWER_ASSIGNED" && event.eventType !== "REVIEWER_UNASSIGNED")
    .map((event, index) => {
    const mainComment = event.comments.find(
      (comment) => !comment.parentCommentId,
    );
    const isHodFinalDecision =
      event.eventType === "FINAL_DECISION" &&
      event.actorRole?.toUpperCase() === "HOD";
    const isSystemFinalDecision =
      event.eventType === "FINAL_DECISION" &&
      event.actorRole?.toUpperCase() !== "HOD";

    return {
      id: `${thesis.thesisId}-event-${event.eventId}`,
      eventId: event.eventId,
      actorName: isSystemFinalDecision
        ? ""
        : (event.actorName ?? `Participant ${index + 1}`),
      actorEmail: event.actorEmail ?? "",
      actorAvatar: event.actorAvatar,
      label: isHodFinalDecision
        ? "finalized thesis decision"
        : isSystemFinalDecision
          ? "generated final reviewer decision"
          : (timelineLabelByType[event.eventType] ?? "updated thesis review"),
      content:
        mainComment?.body ??
        (event.eventType === "REVIEWER_DECISION"
          ? "Reviewer decision submitted."
          : isHodFinalDecision
            ? "HOD final decision recorded."
            : isSystemFinalDecision
              ? "Final decision generated from two reviewer evaluations."
            : "No additional details."),
      timestamp: event.createdAt,
      timestampLabel: formatRelativeTime(event.createdAt),
      actorRole: event.actorRole,
      eventType: event.eventType,
      round: event.round ?? undefined,
      decision: event.decision ?? undefined,
      replies: event.comments.filter(
        (comment) => comment.parentCommentId || (mainComment && comment.id !== mainComment.id),
      ),
      checklistResults: [],
    };
  });

  return [...baseEvents, ...reviewEvents].sort(
    (left, right) => {
      const timeDiff =
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
      if (timeDiff !== 0) return timeDiff;

      const leftPriority = left.eventType === "FINAL_DECISION" ? 1 : 0;
      const rightPriority = right.eventType === "FINAL_DECISION" ? 1 : 0;
      if (leftPriority !== rightPriority) return rightPriority - leftPriority;

      const leftEventId = left.eventId ?? -1;
      const rightEventId = right.eventId ?? -1;
      return rightEventId - leftEventId;
    },
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
  const [forceAssignVisible, setForceAssignVisible] = useState(false);
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
    team,
    pausePolling,
    resumePolling,
  } = useThesisCommentary(id, isStudent);
  const isOwner = thesis?.userId === user?.userId;
  const showConversations = !isStudent || isOwner;

  // Reset activeTab if showConversations changes (e.g. data finally loads)
  useEffect(() => {
    if (thesis && !showConversations && activeTab === "conversations") {
      setActiveTab("versions");
    }
  }, [thesis, showConversations, activeTab]);

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
      const axiosError = err as { response?: { data?: { Message?: string; message?: string } } };
      const message = axiosError.response?.data?.Message || axiosError.response?.data?.message || "Failed to cancel thesis.";
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

  const handleApplyRequest = useCallback(async () => {
    if (!thesis) return;

    // Check team requirements: 5 members OR isSpecial
    if (isStudent && team) {
        const memberCount = team.members?.length ?? 0;
        if (memberCount < 5 && !team.isSpecial) {
            showError('Nhóm của bạn phải có đủ 5 thành viên hoặc là nhóm đặc biệt (Special Team) mới có thể đăng ký đề tài.');
            return;
        }
    }

    const res = await Swal.fire({ 
        title: 'Apply for this Thesis?', 
        html: `Are you sure you want to sign up for <strong>"${thesis.title}"</strong>?`,
        icon: 'question', 
        showCancelButton: true,
        confirmButtonColor: '#f26f21',
        confirmButtonText: 'Yes, Apply Now'
    });
    if (!res.isConfirmed) return;
    
    setApplyingForThesis(true);
    try {
        await applicationService.submitApplication(thesis.thesisId);
        showSuccess('Application submitted successfully!');
        await refreshAfterAction();
    } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        showError(msg || 'Failed to submit application.');
    } finally {
        setApplyingForThesis(false);
    }
  }, [thesis, showSuccess, refreshAfterAction, showError, isStudent, team]);

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

  const conversationEvents = useMemo(() => {
    if (!thesis) return [];
    return buildConversationEvents(thesis, reviewTimeline);
  }, [thesis, reviewTimeline]);

  const isMentor = useMemo(() => {
    if (!thesis || !user) return false;
    const userEmail = user?.email?.toLowerCase();
    return (userEmail && (userEmail === thesis.mentorEmail1?.toLowerCase() || userEmail === thesis.mentorEmail2?.toLowerCase())) ||
           (user?.userId && (user.userId === thesis.mentorId1 || user.userId === thesis.mentorId2)) ||
           (user?.userId && (user.userId === thesis.teamMentorId1 || user.userId === thesis.teamMentorId2));
  }, [thesis, user]);

  const canReplyToTimeline = Boolean(thesis?.status !== "Cancelled" && (isHOD || isReviewer || (isLecturer && isOwner) || isMentor));
  const canComment = Boolean(thesis?.status !== "Cancelled" && (isHOD || isReviewer || (isLecturer && isOwner) || isMentor));

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
  const reviewers = useMemo(() => reviewStatus?.reviewers ?? [], [reviewStatus?.reviewers]);
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
    if (!thesis || !user) return false;

    // Proposer cannot evaluate their own thesis
    if (thesis.userId === user.userId) return false;

    // Fix: Mentors cannot evaluate topics they mentor
    if (isMentor) return false;

    const isHODDecisionStatus = thesis.status === 'Reviewing' || thesis.status === 'HOD Reviewing' || thesis.status === 'Need Update' || thesis.status === 'Published';
    const isReviewerStatus = thesis.status === 'Reviewing' || thesis.status === 'HOD Reviewing';

    if (thesis.status === 'Cancelled') return false;

    // Allow reviewers to submit again after author uploads a new revision.
    const lastIterationAt = thesis.upDate ?? thesis.updateDate;
    const lastIterationMs = lastIterationAt ? new Date(lastIterationAt).getTime() : 0;

    const hasReviewedInCurrentIteration = (reviewStatus?.reviewers ?? []).some(
      (review) =>
        review.userId === user.userId &&
        !!review.decision &&
        !!review.reviewedAt &&
        new Date(review.reviewedAt).getTime() >= lastIterationMs
    );

    if (isHOD) return isHODDecisionStatus;

    return (
      isReviewer && isReviewerStatus && !hasReviewedInCurrentIteration
    );
  }, [isReviewer, isHOD, reviewStatus?.reviewers, thesis, user, isMentor]);

  const canMakeHodDecision = useMemo(() => {
    if (!isHOD || !reviewStatus || !thesis || !user) return false;

    // HOD cannot finalize if they proposed the thesis or are leading the team
    if (thesis.userId === user.userId || isMentor) return false;

    if (thesis.status === "Cancelled") return false;

    // HOD can finalize only in reviewing/need update statuses
    const isAvailableStatus =
      thesis.status === "Reviewing" ||
      thesis.status === "HOD Reviewing" ||
      thesis.status === "Need Update" ||
      thesis.status === "Published";
    return isAvailableStatus;
  }, [isHOD, reviewStatus, thesis, user, isMentor]);

  const canToggleLock = Boolean(
    thesis &&
    thesis.status === "Published" &&
    thesis.status !== "Cancelled" &&
    Boolean(isLecturer || isHOD) &&
    thesis.userId === user?.userId,
  );

  const canCancel = Boolean(
    thesis &&
    isOwner &&
    (
      thesis.status === "Reviewing" ||
      thesis.status === "Registered" ||
      thesis.status === "On Mentor Inviting" ||
      thesis.status === "Need Update"
    ) && thesis.status !== "Cancelled",
  );

  const canUploadRevision = Boolean(
    isOwner && 
    (isStudent || isLecturer || isHOD) && 
    thesis?.status === "Need Update" &&
    thesis?.status !== "Cancelled"
  );

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
          <PrimeButton onClick={() => navigate(isHOD || isReviewer ? "/thesis" : "/my-thesis")} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold border-0">Return to List</PrimeButton>
        </div>
      </div>
    );
  }

  if (isStudent && !isOwner) {
    return (
        <ThesisPublicView 
            thesis={thesis}
            authorName={thesis.ownerName ?? "Unknown Author"}
            relativeTime={formatRelativeTime(submissionDateStr)}
            isLeader={isLeader}
            team={team}
            applyingForThesis={applyingForThesis}
            existingAppStatus={existingAppStatus}
            onApply={handleApplyRequest}
            onCancelApply={handleCancelRequest}
        />
    );
  }

  return (
    <div className={`p-6 lg:p-10 font-sans bg-[#fafbfc] min-h-screen ${styles.thesisContainer}`}>
      <div className="max-w-[1440px] mx-auto space-y-6">
        <PremiumBreadcrumb items={breadcrumbItems} />
        <CommentaryHeader 
          thesis={thesis} 
          authorName={thesis.ownerName ?? "Unknown Author"} 
          relativeTime={formatRelativeTime(submissionDateStr)} 
        />
        <CommentaryTabs activeTab={activeTab} conversationCount={conversationEvents.length} versionCount={thesis.histories?.length ?? 0} onChange={setActiveTab} showConversations={showConversations} />
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="order-2 lg:order-1 lg:col-span-9 space-y-6 relative">
            {activeTab === "conversations" ? (
              <>
                <ResearchDocumentCard fileUrl={thesis.fileUrl} />
                <ResultTimelineItem canFinalize={canMakeHodDecision} onFinalize={() => { pausePolling(); setHodDecisionVisible(true); }} decision={reviewStatus?.hodDecision?.decision} />
                <ReviewProgressCard reviewedCount={reviewedCount} totalCount={2} latestReviewer={latestReviewer} />
                <CommentaryTimeline events={conversationEvents} emptyMessage="Evaluation in progress..." canReply={canReplyToTimeline} onAddReply={handleAddReply} />
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
                onOpenReview={() => {
                  pausePolling();
                  if (isHOD && canMakeHodDecision) {
                    setHodDecisionVisible(true);
                  } else {
                    setReviewModalVisible(true);
                  }
                }}
                onOpenComment={() => { pausePolling(); setCommentModalVisible(true); }}
                onToggleLock={handleToggleLockClick} onCancel={handleCancelClick} onUploadRevision={() => { pausePolling(); setUploadModalVisible(true); }}
                isHOD={isHOD}
              />
              {thesis.status === 'Published' && isStudent && isLeader && (
                <div className="bg-white rounded-2xl p-6 border shadow-sm">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-5">Registration</h3>
                  {existingAppStatus ? (
                    <PrimeButton
                      label={existingAppStatus.toLowerCase() === 'pending' ? (applyingForThesis ? 'Cancelling...' : 'Cancel Assign') : `Application ${existingAppStatus}`}
                      icon={existingAppStatus.toLowerCase() === 'approved' ? 'pi pi-check' : 'pi pi-times'}
                      onClick={existingAppStatus.toLowerCase() === 'pending' ? handleCancelRequest : undefined}
                      loading={applyingForThesis} disabled={existingAppStatus.toLowerCase() !== 'pending'}
                      className="p-button-sm w-full font-bold uppercase py-3"
                      style={{ backgroundColor: existingAppStatus.toLowerCase() === 'approved' ? '#10b981' : '#ef4444', borderColor: existingAppStatus.toLowerCase() === 'approved' ? '#10b981' : '#ef4444' }}
                    />
                  ) : (
                    <div className="space-y-3">
                      {isStudent && team && (team.members?.length ?? 0) < 5 && !team.isSpecial && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                          <p className="text-[10px] text-rose-600 font-medium leading-relaxed">
                            <i className="pi pi-exclamation-triangle mr-1" />
                            Nhóm cần đủ 5 thành viên hoặc là nhóm đặc biệt để đăng ký.
                          </p>
                        </div>
                      )}
                      <PrimeButton
                        label={applyingForThesis ? 'Submitting...' : 'Apply for this Thesis'} icon="pi pi-send"
                        onClick={handleApplyRequest}
                        loading={applyingForThesis}
                        disabled={(isStudent && team && (team.members?.length ?? 0) < 5 && !team.isSpecial) || applyingForThesis}
                        className="p-button-sm p-button-orange w-full font-bold uppercase py-3"
                        style={{ backgroundColor: '#f26f21', borderColor: '#f26f21' }}
                      />
                    </div>
                  )}
                </div>
              )}
              {isHOD && thesis.status === 'Published' && !thesis.teamId && (
                <div className="bg-white rounded-2xl p-6 border shadow-sm">
                  <h3 className="text-[10px] font-black uppercase text-slate-400 mb-5">HOD Actions</h3>
                  <PrimeButton
                    label="Force Assign to Team"
                    icon="pi pi-link"
                    className="p-button-sm w-full font-bold uppercase py-3"
                    style={{ backgroundColor: '#f26f21', borderColor: '#f26f21' }}
                    onClick={() => setForceAssignVisible(true)}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <UpdateThesisModal visible={uploadModalVisible} thesis={thesis} onHide={() => { setUploadModalVisible(false); void resumePolling(); }} onSuccess={refreshAfterAction} />
      <ReviewSubmissionModal visible={reviewModalVisible} thesisId={id || ""} thesisFileUrl={thesis.fileUrl ?? undefined} onHide={() => { setReviewModalVisible(false); void resumePolling(); }} onSuccess={refreshAfterAction} />
      <HodDecisionModal visible={hodDecisionVisible} thesisId={id || ""} thesisFileUrl={thesis.fileUrl ?? undefined} onHide={() => { setHodDecisionVisible(false); void resumePolling(); }} onSuccess={refreshAfterAction} />
      {thesis.semesterId && (
        <ForceAssignThesisModal
          isOpen={forceAssignVisible}
          onClose={() => { setForceAssignVisible(false); void resumePolling(); }}
          onSuccess={refreshAfterAction}
          thesisId={thesis.thesisId}
          thesisTitle={thesis.title}
          semesterId={thesis.semesterId}
        />
      )}
      <CommentModal visible={commentModalVisible} onHide={() => { setCommentModalVisible(false); void resumePolling(); }} onSubmit={handleAddComment} />
    </div>
  );
};

export default ThesisDetailPage;
