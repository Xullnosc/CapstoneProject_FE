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
    histories: ThesisHistory[] | null; // BE: "histories" (not "thesisHistories")
}

export interface GetThesisFilters {
    searchTitle?: string;
    status?: ThesisStatus | '';
    lecturerId?: number;
    semesterId?: number;
    userId?: number;
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

