import api from './api';

export interface SystemParameter {
  key: string;
  value: string;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export const systemService = {
  getParameters: async (): Promise<SystemParameter[]> => {
    const response = await api.get('/system/params');
    return response.data;
  },

  updateParameter: async (key: string, data: Partial<SystemParameter>): Promise<void> => {
    await api.put(`/system/params/${key}`, { ...data, key });
  }
};
