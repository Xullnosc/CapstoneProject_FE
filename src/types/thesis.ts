export type ThesisStatus =
    | 'Published'
    | 'Updated'
    | 'Need Update'
    | 'Reviewing'
    | 'Rejected'
    | 'Registered';

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
}

