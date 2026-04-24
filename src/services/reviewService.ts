import api from './api';

export interface ReviewPeriod {
    semesterId: number;
    reviewRound: number;
    startDate: string;
    endDate: string;
}

export interface ReviewMember {
    lecturerId: number;
    fullName: string;
    email: string;
    role: string;
}

export interface ReviewTeam {
    teamId: number;
    teamCode: string;
    thesisTitle?: string;
    mentorName?: string;
}

export interface ReviewCouncil {
    councilId: number;
    semesterId: number;
    councilName: string;
    status: string;
    createdBy: number;
    members: ReviewMember[];
    teams: { teamId: number; team: ReviewTeam }[];
}

export interface ReviewSchedule {
    scheduleId: number;
    councilId: number;
    reviewRound: number;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    meetLink: string;
    setByLecturerId: number;
}

export interface ReviewSubmission {
    submissionId: number;
    councilId: number;
    teamId: number;
    reviewRound: number;
    fileUrl: string;
    fileName: string;
    submittedAt: string;
    submittedBy: number;
}

export const reviewService = {
    // Review Periods
    getPeriods: async (semesterId: number) => {
        const response = await api.get(`/review-periods/semesters/${semesterId}`);
        return response.data;
    },
    updatePeriod: async (period: ReviewPeriod) => {
        const response = await api.post(`/review-periods`, period);
        return response.data;
    },

    // Review Councils
    getCouncils: async (semesterId: number) => {
        const response = await api.get(`/review-councils/semesters/${semesterId}`);
        return response.data;
    },
    getCouncilById: async (id: number) => {
        const response = await api.get(`/review-councils/${id}`);
        return response.data;
    },
    createCouncil: async (payload: { semesterId: number; councilName: string; createdBy: number }) => {
        const response = await api.post(`/review-councils`, payload);
        return response.data;
    },
    updateCouncil: async (id: number, payload: { councilName: string; status: string }) => {
        const response = await api.put(`/review-councils/${id}`, payload);
        return response.data;
    },
    deleteCouncil: async (id: number) => {
        const response = await api.delete(`/review-councils/${id}`);
        return response.data;
    },
    autoGenerateCouncils: async (semesterId: number, reviewersPerCouncil = 2) => {
        const response = await api.post(`/review-councils/auto-generate`, {
            semesterId,
            reviewersPerCouncil
        });
        return response.data;
    },
    addMemberToCouncil: async (id: number, lecturerId: number, role: string) => {
        const response = await api.post(`/review-councils/${id}/members`, { lecturerId, role });
        return response.data;
    },
    removeMemberFromCouncil: async (id: number, lecturerId: number) => {
        const response = await api.delete(`/review-councils/${id}/members/${lecturerId}`);
        return response.data;
    },
    addTeamToCouncil: async (id: number, teamId: number) => {
        const response = await api.post(`/review-councils/${id}/teams`, { teamId });
        return response.data;
    },
    removeTeamFromCouncil: async (id: number, teamId: number) => {
        const response = await api.delete(`/review-councils/${id}/teams/${teamId}`);
        return response.data;
    },

    // Review Schedules
    getSchedules: async (councilId: number) => {
        const response = await api.get(`/review-schedules/councils/${councilId}`);
        return response.data;
    },
    updateSchedule: async (payload: Partial<ReviewSchedule>) => {
        const response = await api.post(`/review-schedules`, payload);
        return response.data;
    },

    // Review Assessments
    getQuestions: async (councilId: number, round: number) => {
        const response = await api.get(`/review-assessments/councils/${councilId}/rounds/${round}/questions`);
        return response.data;
    },
    getResults: async (councilId: number, round: number, teamId: number) => {
        const response = await api.get(`/review-assessments/councils/${councilId}/rounds/${round}/teams/${teamId}/results`);
        return response.data;
    },
    submitAssessment: async (results: unknown[]) => {
        const response = await api.post(`/review-assessments/submit`, results);
        return response.data;
    },
    evaluateTeam: async (councilId: number, teamId: number) => {
        const response = await api.post(`/review-assessments/councils/${councilId}/teams/${teamId}/evaluate`);
        return response.data;
    },
    overrideStatus: async (councilId: number, teamId: number, payload: { round: number; status: string; comment: string }) => {
        const response = await api.post(`/review-assessments/councils/${councilId}/teams/${teamId}/override`, payload);
        return response.data;
    },

    // Submissions
    uploadSubmission: async (payload: { councilId: number; teamId: number; round: number; file: File }) => {
        const formData = new FormData();
        formData.append('CouncilId', payload.councilId.toString());
        formData.append('TeamId', payload.teamId.toString());
        formData.append('ReviewRound', payload.round.toString());
        formData.append('File', payload.file);

        const response = await api.post(`/review-submissions`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    getSubmissions: async (councilId: number, round: number, teamId: number): Promise<ReviewSubmission[]> => {
        const response = await api.get(`/review-submissions/councils/${councilId}/rounds/${round}/teams/${teamId}`);
        return response.data;
    }
};
