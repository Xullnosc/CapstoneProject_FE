import axios from 'axios';
import api from './api';
import type { UserInfo } from './userService';

export interface LoginResponse {
    accessToken?: string;
    token: string;
    userInfo: {
        userId: number;
        fullName: string;
        email: string;
        avatar: string;
        roleId: number;
        roleName: string;
        studentCode: string;
        campus: string;
        campusId: number;
        isReviewer?: boolean;
    };
}

export interface RefreshResponse {
    accessToken: string;
}

export const authService = {
    login: async (idToken: string, campus: string) => {
        const response = await api.post<LoginResponse>('/Auth/login', { idToken, campus }, { withCredentials: true });
        const data = response.data;
        const accessToken = data.accessToken ?? data.token;
        return { ...data, accessToken, token: accessToken };
    },

    loginWithCredentials: async (username: string, password: string) => {
        const response = await api.post<LoginResponse>('/Auth/login/credentials', { username, password }, { withCredentials: true });
        const data = response.data;
        const accessToken = data.accessToken ?? data.token;
        return { ...data, accessToken, token: accessToken };
    },

    refreshAccessToken: async (): Promise<string | null> => {
        try {
            // Use a raw request (no interceptors) to avoid refresh-loop on 401.
            const response = await axios.post<RefreshResponse>(
                `${import.meta.env.VITE_API_URL}/Auth/refresh`,
                {},
                { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
            );
            const accessToken = response.data?.accessToken ?? null;
            if (accessToken) localStorage.setItem('token', accessToken);
            return accessToken;
        } catch {
            return null;
        }
    },

    logout: async () => {
        try {
            await api.post('/Auth/logout', {}, { withCredentials: true });
        } catch {
            // ignore
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getUser: () => {
        const userStr = localStorage.getItem('user');
        if (userStr) return JSON.parse(userStr);
        return null;
    },

    setUser: (user: UserInfo) => {
        localStorage.setItem('user', JSON.stringify(user));
    }
};
