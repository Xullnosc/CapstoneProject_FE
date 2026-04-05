import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { thesisService } from "../services/thesisService";
import { authService } from "../services/authService";
import { teamService } from "../services/teamService";
import type {
  Thesis,
  ThesisReviewStatus,
  ReviewTimelineEvent,
} from "../types/thesis";
import type { Team } from "../types/team";

const DEFAULT_INTERVAL_MS = 30000;
const ACTIVE_REVIEW_INTERVAL_MS = 15000;
const MAX_BACKOFF_MS = 60000;

const createFingerprint = (
  thesis: Thesis,
  reviewStatus: ThesisReviewStatus | null,
  timeline: ReviewTimelineEvent[],
) => {
  const reviewStamp =
    reviewStatus?.reviewers
      ?.map(
        (review) =>
          `${review.userId ?? "na"}:${review.decision ?? "na"}:${review.reviewedAt ?? "na"}`,
      )
      .join("|") ?? "none";
  const historyStamp = thesis.histories?.[0]?.createdAt ?? "none";
  const statusStamp =
    reviewStatus?.overallStatus ?? reviewStatus?.thesisStatus ?? "none";
  const hodStamp = reviewStatus?.hodDecision?.decidedAt ?? "none";
  const timelineStamp = Array.isArray(timeline)
    ? timeline
        .map((item) => `${item.eventId}:${item.createdAt}:${item.comments.length}`)
        .join("|")
    : "";

  return [
    thesis.status,
    thesis.updateDate,
    thesis.upDate,
    reviewStamp,
    historyStamp,
    statusStamp,
    hodStamp,
    timelineStamp,
  ].join("::");
};

export const useThesisCommentary = (
  id: string | undefined,
  isStudent: boolean,
) => {
  const [thesis, setThesis] = useState<Thesis | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ThesisReviewStatus | null>(
    null,
  );
  const [reviewTimeline, setReviewTimeline] = useState<ReviewTimelineEvent[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);

  const inFlightRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const backoffRef = useRef(DEFAULT_INTERVAL_MS);
  const fingerprintRef = useRef<string>("");
  const pausedRef = useRef(false);

  const clearScheduledPoll = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const fetchPayload = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!id || inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const [thesisData, reviewStatusData, timelineData] = await Promise.all([
          thesisService.getThesisById(id),
          thesisService.getThesisReviewStatus(id),
          thesisService.getReviewTimeline(id),
        ]);

        if (isStudent) {
          const teamData = await teamService.getMyTeam();
          const currentUser = authService.getUser();
          const member = teamData?.members.find(
            (item) => item.studentCode === currentUser?.studentCode,
          );
          setIsLeader(member?.role === "Leader");
          setTeam(teamData);
        }

        const nextFingerprint = createFingerprint(
          thesisData,
          reviewStatusData,
          timelineData,
        );
        if (nextFingerprint !== fingerprintRef.current) {
          fingerprintRef.current = nextFingerprint;
          setThesis(thesisData);
          setReviewStatus(reviewStatusData);
          setReviewTimeline(Array.isArray(timelineData) ? timelineData : []);
        }
        backoffRef.current = DEFAULT_INTERVAL_MS;
      } catch (err) {
        console.error("Failed to fetch thesis commentary payload", err);
        setError("Could not load thesis details. Please try again.");
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
      } finally {
        inFlightRef.current = false;
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [id, isStudent],
  );

  const getNextDelay = useCallback(() => {
    const status = thesis?.status;
    const baseDelay =
      status === "Reviewing" || status === "HOD Reviewing"
        ? ACTIVE_REVIEW_INTERVAL_MS
        : DEFAULT_INTERVAL_MS;
    const effectiveDelay = Math.max(baseDelay, backoffRef.current);
    const jitter = Math.round(Math.random() * 2000);
    return effectiveDelay + jitter;
  }, [thesis?.status]);

  const scheduleNextPoll = useCallback(() => {
    clearScheduledPoll();
    if (pausedRef.current || document.hidden) {
      return;
    }

    timeoutRef.current = window.setTimeout(async () => {
      await fetchPayload({ silent: true });
      scheduleNextPoll();
    }, getNextDelay());
  }, [clearScheduledPoll, fetchPayload, getNextDelay]);

  useEffect(() => {
    fetchPayload().finally(() => {
      scheduleNextPoll();
    });

    return () => {
      clearScheduledPoll();
    };
  }, [clearScheduledPoll, fetchPayload, scheduleNextPoll]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearScheduledPoll();
        return;
      }

      fetchPayload({ silent: true }).finally(() => {
        scheduleNextPoll();
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearScheduledPoll, fetchPayload, scheduleNextPoll]);

  const pausePolling = useCallback(() => {
    pausedRef.current = true;
    clearScheduledPoll();
  }, [clearScheduledPoll]);

  const resumePolling = useCallback(async () => {
    pausedRef.current = false;
    await fetchPayload({ silent: true });
    scheduleNextPoll();
  }, [fetchPayload, scheduleNextPoll]);

  return useMemo(
    () => ({
      thesis,
      reviewStatus,
      reviewTimeline,
      loading,
      error,
      isLeader,
      team,
      refetch: fetchPayload,
      pausePolling,
      resumePolling,
    }),
    [
      error,
      fetchPayload,
      isLeader,
      loading,
      pausePolling,
      resumePolling,
      reviewStatus,
      reviewTimeline,
      thesis,
      team,
    ],
  );
};
