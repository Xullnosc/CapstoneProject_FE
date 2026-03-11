import api from './api';
import type { Whitelist } from './semesterService';

/** model returned by backend after processing an import file */
export interface ImportError {
    /** 1-based row index where error occurred */
    row: number;
    /** column name or index that failed */
    column: string;
    message: string;
}

export interface ImportResult<T> {
    items: T[];
    errors: ImportError[];
}

export interface PreviewRow {
    email: string;
    fullName: string;
    role: 'Student' | 'Lecturer' | 'Mentor';
    studentCode?: string;
}

export const whitelistService = {
    getWhitelistByRole: async (roleId: number): Promise<Whitelist[]> => {
        const response = await api.get<Whitelist[]>(`/whitelist/role/${roleId}`);
        return response.data;
    },

    updateReviewerStatus: async (whitelistId: number, isReviewer: boolean) => {
        await api.put(`/whitelist/update-reviewer-status/${whitelistId}`, isReviewer, {
            headers: { 'Content-Type': 'application/json' }
        });
    },

    addWhitelist: async (whitelist: Partial<Whitelist>): Promise<Whitelist> => {
        const response = await api.post<Whitelist>('/whitelist', whitelist);
        return response.data;
    },

    updateWhitelist: async (id: number, whitelist: Partial<Whitelist>): Promise<void> => {
        await api.put(`/whitelist/${id}`, whitelist);
    },

    deleteWhitelist: async (id: number): Promise<void> => {
        await api.delete(`/whitelist/${id}`);
    },
    /**
     * upload file to server and return whatever the controller responds.
     * there is no dedicated preview endpoint on backend; the same route
     * is used for both preview and final import.  Depending on server
     * implementation this may already perform the import.
     */
    previewImport: async (semesterId: number, file: File): Promise<ImportResult<PreviewRow>> => {
        const form = new FormData();
        form.append('file', file);
        const response = await api.post<ImportResult<PreviewRow>>(
            `/semester/${semesterId}/whitelist/import`,
            form,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
    },

    importWhitelist: async (semesterId: number, file: File): Promise<ImportResult<PreviewRow>> => {
        // uses same endpoint as previewImport; backend is responsible for
        // interpreting the request and performing final import if appropriate.
        const form = new FormData();
        form.append('file', file);
        // signal server to commit (persist) parsed items
        form.append('commit', 'true');
        const response = await api.post<ImportResult<PreviewRow>>(
            `/semester/${semesterId}/whitelist/import`,
            form,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
    },

    getWhitelistsPaginated: async (semesterId: number, params: { page: number; pageSize: number; role?: string; search?: string }) => {
        const response = await api.get(`/semester/${semesterId}/whitelists`, { params });
        return response.data;
    },

    /** Alias for getWhitelistsPaginated as requested */
    getAllWhitelists: async (semesterId: number, params: { page: number; pageSize: number; role?: string; search?: string }) => {
        const response = await api.get(`/semester/${semesterId}/whitelists`, { params });
        return response.data;
    }
};
