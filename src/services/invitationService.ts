import api from './api';
import type { TeamInvitation } from '../types/team';

export const invitationService = {
    getMyInvitations: async (): Promise<TeamInvitation[]> => {
        const response = await api.get<TeamInvitation[]>('/invitation/my-invitations');
        return response.data;
    },

    acceptInvitation: async (id: number): Promise<void> => {
        await api.post(`/invitation/${id}/accept`);
    },

    declineInvitation: async (id: number): Promise<void> => {
        await api.post(`/invitation/${id}/decline`);
    },

    sendInvitation: async (teamId: number, studentCodeOrEmail: string): Promise<TeamInvitation> => {
        const response = await api.post<{ message: string, data: TeamInvitation }>('/invitation/send', {
            teamId,
            studentCodeOrEmail
        });
        return response.data.data;
    },

    cancelInvitation: async (id: number): Promise<void> => {
        await api.post(`/invitation/${id}/cancel`);
    }
};
