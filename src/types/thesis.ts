export type ThesisStatus =
    | 'Published'
    | 'Updated'
    | 'Need Update'
    | 'Reviewing'
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
    histories: ThesisHistory[] | null; // BE: "histories" (not "thesisHistories")

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
