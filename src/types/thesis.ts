export type ThesisStatus =
    | 'Published'
    | 'Updated'
    | 'Need Update'
    | 'Reviewing'
    | 'HOD Reviewing'
    | 'On Mentor Inviting'
    | 'Rejected'
    | 'Registered'
    | 'Cancelled';

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
    thesisId: string;           // BE returns "thesisId" (not "id")
    title: string;
    shortDescription: string | null;
    fileUrl: string | null;
    status: ThesisStatus;
    userId: number;
    ownerName: string | null;   // BE returns "ownerName" (not "uploaderName")
    ownerEmail: string | null;
    upDate: string | null;      // BE: "upDate"
    updateDate: string | null;  // BE: "updateDate"
    isLocked: boolean;
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
    decision: string | null;
    note: string | null;
    reviewedAt: string | null;
}

export interface HodDecision {
    hodId: number;
    email: string | null;
    fullName: string | null;
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

