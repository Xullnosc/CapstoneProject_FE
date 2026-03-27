import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface SystemSetting {
    settingKey: string;
    settingValue: string;
    description?: string;
}

export const systemSettingService = {
    getAll: async (): Promise<SystemSetting[]> => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/SystemSettings`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getByKey: async (key: string): Promise<SystemSetting> => {
        const response = await axios.get(`${API_URL}/SystemSettings/${key}`);
        return response.data;
    },

    update: async (setting: SystemSetting): Promise<void> => {
        const token = localStorage.getItem('token');
        await axios.put(`${API_URL}/SystemSettings`, setting, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    bulkUpdate: async (settings: SystemSetting[]): Promise<void> => {
        const token = localStorage.getItem('token');
        await axios.put(`${API_URL}/SystemSettings/bulk`, settings, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
};
