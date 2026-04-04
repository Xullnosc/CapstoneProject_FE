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
  },

  getPublicConfig: async (): Promise<{ isOpen: boolean; fileSizeLimit: number, captchaSiteKey: string }> => {
    const response = await api.get('/system/public/config');
    return response.data;
  }
};
