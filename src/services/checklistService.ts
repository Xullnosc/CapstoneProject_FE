import api from './api';
import type { ChecklistDTO, ChecklistCreateDTO, ChecklistUpdateDTO } from '../types/checklist';

export const checklistService = {
    getAll: async (): Promise<ChecklistDTO[]> => {
        const response = await api.get<ChecklistDTO[]>('/checklist');
        return response.data;
    },

    getById: async (id: number): Promise<ChecklistDTO> => {
        const response = await api.get<ChecklistDTO>(`/checklist/${id}`);
        return response.data;
    },

    create: async (data: ChecklistCreateDTO): Promise<ChecklistDTO> => {
        const response = await api.post<ChecklistDTO>('/checklist', data);
        return response.data;
    },

    update: async (id: number, data: ChecklistUpdateDTO): Promise<void> => {
        await api.put(`/checklist/${id}`, data);
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/checklist/${id}`);
    }
};
