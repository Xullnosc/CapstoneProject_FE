import api from "./api";
import type { Application } from "../types/application";

export interface ApplicationsByThesisResponse {
    items: ApplicationWithMembers[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ApplicationWithMembers {
    id: number;
    thesisId: string;
    teamId: number;
    teamName: string;
    teamCode: string;
    leaderName: string;
    status: string;
    createdAt: string;
    members: { studentId: number; fullName: string; studentCode: string }[];
}

export const applicationService = {
    /** POST /thesis-applications - Submit a new application */
    submitApplication: async (thesisId: string): Promise<Application> => {
        const response = await api.post<{ data: Application }>('/thesis-applications', { thesisId });
        return response.data.data;
    },

    /** PUT /thesis-applications/:id/cancel - Cancel a pending application */
    cancelApplication: async (id: number): Promise<void> => {
        await api.put(`/thesis-applications/${id}/cancel`);
    },

    /** GET /thesis-applications?teamId=... - Get applications by team */
    getMyApplications: async (teamId?: number): Promise<Application[]> => {
        const params: Record<string, number> = {};
        if (teamId) params.teamId = teamId;
        const response = await api.get<Application[]>('/thesis-applications', { params });
        return response.data;
    },

    /** GET /thesis-applications/by-thesis - Lecturer gets applications for their thesis */
    getApplicationsByThesis: async (
        thesisId: string,
        params?: { status?: string; search?: string; page?: number; limit?: number }
    ): Promise<ApplicationsByThesisResponse> => {
        const response = await api.get<ApplicationsByThesisResponse>('/thesis-applications/by-thesis', {
            params: { thesisId, ...params },
        });
        return response.data;
    },

    /** PUT /thesis-applications/:id/approve - Lecturer approves */
    approveApplication: async (id: number): Promise<void> => {
        await api.put(`/thesis-applications/${id}/approve`);
    },

    /** PUT /thesis-applications/:id/reject - Lecturer rejects */
    rejectApplication: async (id: number): Promise<void> => {
        await api.put(`/thesis-applications/${id}/reject`);
    },
};
