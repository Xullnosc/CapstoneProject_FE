import api from './api';

export interface ReviewPeriod {
    semesterId: number;
    reviewRound: number;
    startDate: string;
    endDate: string;
}

export interface ReviewCouncil {
    councilId: number;
    semesterId: number;
    councilName: string;
    status: string;
    createdBy: number;
    members: any[];
    teams: any[];
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
    updateSchedule: async (payload: any) => {
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
    submitAssessment: async (results: any[]) => {
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
    }
};
