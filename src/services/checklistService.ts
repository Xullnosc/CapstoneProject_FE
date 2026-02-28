import api from './api';

export interface ChecklistItem {
    checklistId: number;
    content: string;
    displayOrder: number;
    createdAt?: string;
}

export interface ChecklistCreatePayload {
    content: string;
    displayOrder: number;
}

export interface ChecklistUpdatePayload {
    content: string;
    displayOrder: number;
}

export const checklistService = {
    getAll: async (): Promise<ChecklistItem[]> => {
        const response = await api.get<ChecklistItem[]>('/checklist');
        return response.data;
    },

    getById: async (id: number): Promise<ChecklistItem> => {
        const response = await api.get<ChecklistItem>(`/checklist/${id}`);
        return response.data;
    },

    create: async (data: ChecklistCreatePayload): Promise<ChecklistItem> => {
        const response = await api.post<ChecklistItem>('/checklist', data);
        return response.data;
    },

    update: async (id: number, data: ChecklistUpdatePayload): Promise<void> => {
        await api.put(`/checklist/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/checklist/${id}`);
    },
};
