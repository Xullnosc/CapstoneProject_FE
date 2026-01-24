import axios from 'axios';
import api from './api';
import type { CreateTeamRequest, Team, TeamInvitation } from '../types/team';

export const teamService = {
    getMyTeam: async (): Promise<Team | null> => {
        try {
            const response = await api.get<Team>('/team/my-team');
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    createTeam: async (data: CreateTeamRequest): Promise<Team> => {
        const response = await api.post<Team>('/team', data);
        return response.data;
    },

    getMyInvitations: async (): Promise<TeamInvitation[]> => {
        const response = await api.get<TeamInvitation[]>('/invitation/my-invitations');
        return response.data;
    },

    acceptInvitation: async (invitationId: number): Promise<void> => {
        await api.post(`/invitation/${invitationId}/accept`);
    },

    declineInvitation: async (invitationId: number): Promise<void> => {
        await api.post(`/invitation/${invitationId}/decline`);
    },

    getTeamById: async (teamId: number): Promise<Team | null> => {
        try {
            const response = await api.get<Team>(`/team/${teamId}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) return null;
            throw error;
        }
    },

    kickMember: async (teamId: number, userId: number): Promise<void> => {
        await api.delete(`/team/${teamId}/members/${userId}`);
    },

    disbandTeam: async (teamId: number): Promise<void> => {
        await api.delete(`/team/${teamId}/disband`);
    }
};
