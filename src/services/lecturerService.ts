import api from './api';

export interface Lecturer {
    lecturerId: number;
    email: string;
    fullName: string | null;
    avatar: string | null;
    campus: string | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const lecturerService = {
    getAllLecturers: async (): Promise<Lecturer[]> => {
        const response = await api.get<Lecturer[]>('/Lecturer');
        return response.data;
    },

    getLecturerById: async (id: number): Promise<Lecturer> => {
        const response = await api.get<Lecturer>(`/Lecturer/${id}`);
        return response.data;
    },

    createLecturer: async (lecturer: Partial<Lecturer>): Promise<Lecturer> => {
        const response = await api.post<Lecturer>('/Lecturer', lecturer);
        return response.data;
    },

    updateLecturer: async (id: number, lecturer: Partial<Lecturer>): Promise<void> => {
        await api.put(`/Lecturer/${id}`, lecturer);
    },

    toggleStatus: async (id: number, isActive: boolean): Promise<void> => {
        await api.put(`/Lecturer/toggle-status/${id}`, isActive, {
            headers: { 'Content-Type': 'application/json' }
        });
    },

    deleteLecturer: async (id: number): Promise<void> => {
        await api.delete(`/Lecturer/${id}`);
    }
};
