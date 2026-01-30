import api from './api';

interface UserInfo {
    userId: number;
    fullName: string;
    studentCode: string;
    email: string;
    avatar: string;
    hasTeam: boolean;
    pendingInvitationId?: number | null;
}

export const userService = {
    searchStudents: async (term: string, teamId?: number): Promise<UserInfo[]> => {
        const url = teamId
            ? `/users/search?term=${term}&teamId=${teamId}`
            : `/users/search?term=${term}`;
        const response = await api.get<UserInfo[]>(url);
        return response.data;
    }
};
