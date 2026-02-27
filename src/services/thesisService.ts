import api from "./api";
import type { Thesis, GetThesisFilters } from "../types/thesis";

// ─── Propose ────────────────────────────────────────────────────────────────
interface ProposeThesisRequest {
    title: string;
    shortDescription?: string;
    file: File;
}

// ─── Update (upload new version) ────────────────────────────────────────────
interface UpdateThesisFileRequest {
    file: File;
    note?: string;
}

export const thesisService = {
    /** Keep propose as-is (no breaking change) */
    proposeThesis: async (data: ProposeThesisRequest) => {
        const formData = new FormData();
        formData.append('Title', data.title);
        if (data.shortDescription) {
            formData.append('ShortDescription', data.shortDescription);
        }
        formData.append('File', data.file);
        const response = await api.post('/thesis/propose', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    /** GET /thesis - list with optional filters */
    getAllTheses: async (filters?: GetThesisFilters): Promise<Thesis[]> => {
        const params: Record<string, string | number | undefined> = {};
        if (filters?.searchTitle) params.searchTitle = filters.searchTitle;
        if (filters?.status) params.status = filters.status;
        if (filters?.lecturerId) params.lecturerId = filters.lecturerId;
        if (filters?.semesterId) params.semesterId = filters.semesterId;
        const response = await api.get<Thesis[]>('/thesis', { params });
        return response.data;
    },

    /** GET /thesis/my - thesis belonging to the current user */
    getMyTheses: async (filters?: GetThesisFilters): Promise<Thesis[]> => {
        const params: Record<string, string | number | undefined> = {};
        if (filters?.searchTitle) params.searchTitle = filters.searchTitle;
        if (filters?.status) params.status = filters.status;
        const response = await api.get<Thesis[]>('/thesis/my', { params });
        return response.data;
    },

    /** GET /thesis/:id - full detail with version histories */
    getThesisById: async (id: string): Promise<Thesis> => {
        const response = await api.get<Thesis>(`/thesis/${id}`);
        return response.data;
    },

    /** PUT /thesis/:id - upload a new version */
    updateThesisFile: async (id: string, data: UpdateThesisFileRequest) => {
        const formData = new FormData();
        formData.append('File', data.file);
        if (data.note) formData.append('Note', data.note);
        const response = await api.put(`/thesis/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
};
