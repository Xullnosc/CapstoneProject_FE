export interface ThesisForm {
    id: number;
    fileUrl: string;
    versionNumber: number;
    uploadedBy: number;
    uploaderName?: string;
    updatedAt: string;
}

export interface ThesisFormHistory {
    id: number;
    thesisFormId: number;
    fileUrl: string;
    versionNumber: number;
    uploadedBy: number;
    uploaderName?: string;
    createdAt: string;
}
