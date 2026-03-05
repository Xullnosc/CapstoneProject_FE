import api from './api';
import type { Whitelist } from './semesterService';

export const whitelistService = {
    getWhitelistByRole: async (roleId: number): Promise<Whitelist[]> => {
        const response = await api.get<Whitelist[]>(`/whitelist/role/${roleId}`);
        return response.data;
    },

    updateReviewerStatus: async (whitelistId: number, isReviewer: boolean) => {
        await api.put(`/whitelist/update-reviewer-status/${whitelistId}`, isReviewer, {
            headers: { 'Content-Type': 'application/json' }
        });
    },

    addWhitelist: async (whitelist: Partial<Whitelist>): Promise<Whitelist> => {
        const response = await api.post<Whitelist>('/whitelist', whitelist);
        return response.data;
    },

    updateWhitelist: async (id: number, whitelist: Partial<Whitelist>): Promise<void> => {
        await api.put(`/whitelist/${id}`, whitelist);
    },

    deleteWhitelist: async (id: number): Promise<void> => {
        await api.delete(`/whitelist/${id}`);
    }
};
