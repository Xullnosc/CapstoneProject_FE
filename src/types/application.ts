export type ApplicationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface Application {
    id: number;
    thesisId: string;
    thesisTitle: string | null;
    thesisOwnerName: string | null;
    teamId: number;
    teamName: string | null;
    status: ApplicationStatus;
    createdAt: string | null;
}
