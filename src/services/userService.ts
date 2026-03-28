import api from './api';

export interface UserInfo {
    userId: number;
    fullName: string;
    studentCode?: string;
    email: string;
    avatar?: string;
    roleName?: string;
    campus?: string;
    hasTeam?: boolean;
    pendingInvitationId?: number | null;
    phoneNumber?: string | null;
    githubLink?: string | null;
    linkedinLink?: string | null;
    facebookLink?: string | null;
    dateOfBirth?: string | null;
    gender?: string | null;
    address?: string | null;
    major?: string | null;
    personalId?: string | null;
    placeOfBirth?: string | null;
    enrollmentYear?: number | null;
}

interface UpdateProfileDTO {
    fullName?: string;
    phoneNumber?: string;
    githubLink?: string;
    linkedinLink?: string;
    facebookLink?: string;
    dateOfBirth?: string | null;
    gender?: string | null;
    address?: string | null;
    major?: string | null;
    personalId?: string | null;
    placeOfBirth?: string | null;
    enrollmentYear?: number | null;
}

export const userService = {
    getProfile: async (): Promise<UserInfo> => {
        const response = await api.get<UserInfo>('/users/profile');
        return response.data;
    },
    searchStudents: async (term: string, teamId?: number): Promise<UserInfo[]> => {
        const url = teamId
            ? `/users/search?term=${term}&teamId=${teamId}`
            : `/users/search?term=${term}`;
        const response = await api.get<UserInfo[]>(url);
        return response.data;
    },
    searchLecturers: async (term: string, teamId?: number): Promise<UserInfo[]> => {
        const url = teamId
            ? `/mentor-invitation/search-mentors?term=${term}&teamId=${teamId}`
            : `/mentor-invitation/search-mentors?term=${term}`;
        const response = await api.get<UserInfo[]>(url);
        return response.data;
    },
    updateProfile: async (profileData: UpdateProfileDTO): Promise<UserInfo> => {
        const response = await api.put<UserInfo>('/users/profile', profileData);
        return response.data;
    },
    updatePassword: async (passwordData: { newPassword: string }): Promise<{ message: string }> => {
        const response = await api.put<{ message: string }>('/users/profile/password', passwordData);
        return response.data;
    }
};
