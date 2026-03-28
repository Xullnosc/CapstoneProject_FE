export type ThesisStatus =
  | "Published"
  | "Updated"
  | "Need Update"
  | "Reviewing"
  | "HOD Reviewing"
  | "On Mentor Inviting"
  | "Rejected"
  | "Registered"
  | "Cancelled";

export interface Checklist {
  checklistId: number;
  content: string;
}

export interface ThesisAIReviewChecklistItem {
  checklistId: number;
  checked: boolean;
  reason?: string | null;
}

export interface ThesisAIReviewPreview {
  suggestedDecision: "OK" | "Consider";
  feedback: string;
  checklist: ThesisAIReviewChecklistItem[];
  warnings: string[];
  usedMetadataFallback: boolean;
  provider?: string | null;
  model?: string | null;
  generatedAtUtc: string;
}

// Matches ThesisHistoryDTO from backend
export interface ThesisHistory {
  id: number;
  thesisId: string;
  fileUrl: string | null;
  versionNumber: number;
  note: string | null;
  uploadedBy: number;
  uploaderName: string | null;
  createdAt: string;
}

// Matches ThesisDTO from backend
export interface Thesis {
  thesisId: string; // BE returns "thesisId" (not "id")
  title: string;
  shortDescription: string | null;
  fileUrl: string | null;
  status: ThesisStatus;
  semesterId?: number | null;
  userId: number;
  ownerName: string | null; // BE returns "ownerName" (not "uploaderName")
  ownerEmail: string | null;
  ownerAvatar: string | null;
  upDate: string | null; // BE: "upDate"
  updateDate: string | null; // BE: "updateDate"
  isLocked: boolean;
  mentorEmail1?: string | null;
  mentorEmail2?: string | null;
  histories: ThesisHistory[] | null;

  reviews: ThesisReview[] | null;
}

export interface ThesisReview {
  thesisId: string;
  reviewerId: number | null;
  reviewerName: string | null;
  decision: string; // "Pass" | "Fail" | "Pending"
  comment: string | null;
  fileUrl: string | null;
  reviewedAt: string;
}

export interface GetThesisFilters {
  status?: ThesisStatus;
  searchTitle?: string;
  lecturerId?: number;
  userId?: number;
  semesterId?: number;
  isLocked?: boolean;
  lecturerOnly?: boolean;
}

export interface ReviewerProgress {
  userId: number;
  email: string | null;
  fullName: string | null;
  avatar: string | null;
  decision: string | null;
  note: string | null;
  reviewedAt: string | null;
}

export interface HodDecision {
  hodId: number;
  email: string | null;
  fullName: string | null;
  avatar: string | null;
  decision: string | null;
  note: string | null;
  decidedAt: string | null;
}

export interface ThesisReviewStatus {
  thesisId: string;
  thesisStatus: string | null;
  overallStatus: string | null;
  reviewers: ReviewerProgress[];
  hodDecision: HodDecision | null;
  requiresHodDecision: boolean;
}

export interface ReviewTimelineComment {
  id: number;
  eventId: number;
  parentCommentId: number | null;
  authorUserId: number;
  authorName: string | null;
  authorEmail: string | null;
  authorAvatar: string | null;
  body: string;
  commentType: string;
  visibilityScope: string;
  createdAt: string;
  replies: ReviewTimelineComment[];
}

export interface ReviewTimelineEvent {
  eventId: number;
  thesisId: string;
  eventType: string;
  actorUserId: number;
  actorRole: string;
  actorName: string | null;
  actorEmail: string | null;
  actorAvatar: string | null;
  decision: string | null;
  createdAt: string;
  checklistResults: string[];
  comments: ReviewTimelineComment[];
}

export interface CommentaryEvent {
  id: string;
  actorName: string;
  actorEmail: string;
  actorAvatar?: string | null;
  label: string;
  content: string;
  timestamp: string;
  timestampLabel: string;
  decision?: string;
  fileUrl?: string | null;
  eventId?: number;
  actorRole?: string | null;
  checklistResults?: string[];
  replies?: ReviewTimelineComment[];
}
