import api from './api';

export interface Lecturer {
    lecturerId: number;
    email: string;
    fullName: string | null;
    avatar: string | null;
    campus: string | null;
    campusId: number;
    isActive: boolean;
    isHod: boolean;
    isReviewer: boolean;
    campusNavigation?: {
        campusId: number;
        campusCode: string;
        campusName: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageIndex: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export const lecturerService = {
    getAllLecturers: async (page: number = 1, pageSize: number = 10, search?: string): Promise<PagedResult<Lecturer>> => {
        const response = await api.get<PagedResult<Lecturer>>('/lecturer', {
            params: { page, pageSize, search }
        });
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
    
    toggleReviewerStatus: async (id: number, isReviewer: boolean): Promise<void> => {
        await api.put(`/Lecturer/toggle-reviewer/${id}`, isReviewer, {
            headers: { 'Content-Type': 'application/json' }
        });
    },

    deleteLecturer: async (id: number): Promise<void> => {
        await api.delete(`/Lecturer/${id}`);
    }
};
