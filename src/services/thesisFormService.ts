import api from './api';
import type { ThesisForm, ThesisFormHistory } from '../types/thesisForm';

export const thesisFormService = {
    getLatestForm: async (): Promise<{ message: string; data: ThesisForm }> => {
        const response = await api.get('/thesis-forms/latest');
        return response.data;
    },

    getFormHistories: async (): Promise<{ message: string; data: ThesisFormHistory[] }> => {
        const response = await api.get('/thesis-forms/histories');
        return response.data;
    },

    uploadForm: async (file: File): Promise<{ message: string; data: ThesisForm }> => {
        const formData = new FormData();
        formData.append('File', file);

        const response = await api.post('/thesis-forms', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};
