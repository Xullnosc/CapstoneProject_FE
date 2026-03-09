import api from './api';
import axios from 'axios';

export interface CreateOrUpdateHodPayload {
  fullName: string;
  email: string;
  username: string;
  password: string;
}

export interface HodAccount {
  userId: number;
  fullName?: string;
  email?: string;
  username?: string;
  hasCredential: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const adminService = {
  getHodAccounts: async (search?: string) => {
    const res = await api.get<HodAccount[]>('/Admin/hod', { params: search ? { search } : undefined });
    return res.data;
  },

  createOrUpdateHod: async (payload: CreateOrUpdateHodPayload) => {
    try {
      const res = await api.post('/Admin/hod', payload);
      return res.data as { message?: string };
    } catch (err) {
      const fallback = 'Could not create/update HOD account.';
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        throw new Error(data?.message || fallback);
      }
      throw new Error((err as { message?: string })?.message || fallback);
    }
  },
};

