import api from './api';

export interface MentorInvitationDTO {
    invitationId: number;
    teamId: number;
    teamName: string;
    teamCode: string;
    mentorId: number;
    mentorEmail: string;
    mentorName: string;
    invitedById: number;
    invitedByName: string;
    invitedByEmail: string;
    type: string;
    status: string;
    thesisTitle?: string;
    thesisId?: string;
    thesisStatus?: string;
    createdAt?: string;
    respondedAt?: string;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageIndex: number;
    pageSize: number;
}

export const mentorInvitationService = {
    sendInvitation: async (teamId: number, mentorEmail: string): Promise<MentorInvitationDTO> => {
        const response = await api.post<MentorInvitationDTO>('/mentor-invitation/send', {
            teamId,
            mentorEmail
        });
        return response.data;
    },

    getTeamMentorInvitations: async (teamId: number, pageIndex: number = 1, pageSize: number = 10): Promise<PagedResult<MentorInvitationDTO>> => {
        const response = await api.get<PagedResult<MentorInvitationDTO>>(`/mentor-invitation/team/${teamId}?pageIndex=${pageIndex}&pageSize=${pageSize}`);
        return response.data;
    },

    cancelInvitation: async (id: number): Promise<void> => {
        await api.post(`/mentor-invitation/${id}/cancel`);
    },

    // Lecturer-side
    getMyMentorInvitations: async (pageIndex: number = 1, pageSize: number = 20): Promise<PagedResult<MentorInvitationDTO>> => {
        const response = await api.get<PagedResult<MentorInvitationDTO>>(
            `/mentor-invitation/my-invitations?pageIndex=${pageIndex}&pageSize=${pageSize}`
        );
        return response.data;
    },

    acceptInvitation: async (id: number): Promise<void> => {
        await api.post(`/mentor-invitation/${id}/accept`);
    },

    declineInvitation: (id: number) => api.post(`/mentor-invitation/${id}/decline`),
    getActiveTeamCount: () => api.get<{ count: number }>('/mentor-invitation/active-team-count').then(res => res.data)
};
