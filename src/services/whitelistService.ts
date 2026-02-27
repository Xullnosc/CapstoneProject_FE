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
    }
};
