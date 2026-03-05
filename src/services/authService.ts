import api from './api';

export interface LoginResponse {
    token: string;
    userInfo: {
        fullName: string;
        email: string;
        avatar: string;
        roleId: number;
        roleName: string;
        studentCode: string;
        campus: string;
        isReviewer?: boolean;
    };
}

export const authService = {
    login: async (idToken: string, campus: string) => {
        const response = await api.post<LoginResponse>('/Auth/login', {
            idToken,
            campus
        });
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getUser: () => {
        const userStr = localStorage.getItem('user');
        if (userStr) return JSON.parse(userStr);
        return null;
    }
};
