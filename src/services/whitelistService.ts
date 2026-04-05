import api from './api';
import type { Whitelist, PagedResult } from './semesterService';

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

/** Field-level corrections sent back to the server to resolve import conflicts. */
export interface WhitelistRowOverride {
    rowNumber: number;
    email?: string;
    fullName?: string;
    studentCode?: string;
}

export interface ImportBatch {
    importBatchId: number;
    fileUrl: string;
    originalFileName?: string;
    uploadedBy?: string;
    uploadedAt: string;
    affectedSemesterId?: number;
    version: number;
    notes?: string;
}

export interface ImportWhitelistRow {
    rowNumber?: number;
    email: string;
    semesterCode?: string;
    semesterName?: string;
    semesterId?: number;
    fullName: string;
    roleId?: number;
    role: 'Student' | 'Lecturer' | 'Mentor';
    campus?: string;
    studentCode?: string;
    isMarked?: boolean;
    existingRole?: string;
    markedReason?: string;
}

type RawImportResult<T> = Partial<ImportResult<T>> & {
    Items?: T[];
    Errors?: ImportError[];
};

const normalizeImportRow = (row: Record<string, unknown>): ImportWhitelistRow => ({
    rowNumber: (row.rowNumber as number | undefined) ?? (row.RowNumber as number | undefined),
    email: ((row.email as string | undefined) ?? (row.Email as string | undefined) ?? '').trim(),
    semesterCode: (row.semesterCode as string | undefined) ?? (row.SemesterCode as string | undefined),
    semesterName: (row.semesterName as string | undefined) ?? (row.SemesterName as string | undefined),
    semesterId: (row.semesterId as number | undefined) ?? (row.SemesterId as number | undefined),
    fullName: ((row.fullName as string | undefined) ?? (row.FullName as string | undefined) ?? '').trim(),
    roleId: (row.roleId as number | undefined) ?? (row.RoleId as number | undefined),
    role: ((row.role as 'Student' | 'Lecturer' | 'Mentor' | undefined) ?? (row.Role as 'Student' | 'Lecturer' | 'Mentor' | undefined) ?? 'Student'),
    campus: (row.campus as string | undefined) ?? (row.Campus as string | undefined),
    studentCode: (row.studentCode as string | undefined) ?? (row.StudentCode as string | undefined),
    isMarked: (row.isMarked as boolean | undefined) ?? (row.IsMarked as boolean | undefined),
    existingRole: (row.existingRole as string | undefined) ?? (row.ExistingRole as string | undefined),
    markedReason: (row.markedReason as string | undefined) ?? (row.MarkedReason as string | undefined)
});

const normalizeImportResult = (raw: RawImportResult<Record<string, unknown>>): ImportResult<ImportWhitelistRow> => {
    const items = ((raw.items ?? raw.Items) ?? []).map(normalizeImportRow);
    const errors = (raw.errors ?? raw.Errors) ?? [];
    return { items, errors };
};

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
    previewImport: async (
        semesterId: number,
        file: File,
        params?: { excludedRowNumbers?: number[]; rowOverrides?: WhitelistRowOverride[] }
    ): Promise<ImportResult<ImportWhitelistRow>> => {
        const form = new FormData();
        form.append('file', file);
        (params?.excludedRowNumbers ?? []).forEach((rowNumber) => {
            form.append('excludedRowNumbers', String(rowNumber));
        });
        if (params?.rowOverrides && params.rowOverrides.length > 0) {
            form.append('rowOverridesJson', JSON.stringify(params.rowOverrides));
        }
        const response = await api.post<RawImportResult<Record<string, unknown>>>(
            `/semester/${semesterId}/whitelist/import`,
            form,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return normalizeImportResult(response.data);
    },

    importWhitelist: async (
        semesterId: number,
        file: File,
        excludedRowNumbers?: number[],
        rowOverrides?: WhitelistRowOverride[]
    ): Promise<ImportResult<ImportWhitelistRow>> => {
        // uses same endpoint as previewImport; backend is responsible for
        // interpreting the request and performing final import if appropriate.
        const form = new FormData();
        form.append('file', file);
        // signal server to commit (persist) parsed items
        form.append('commit', 'true');
        (excludedRowNumbers ?? []).forEach((rowNumber) => {
            form.append('excludedRowNumbers', String(rowNumber));
        });
        if (rowOverrides && rowOverrides.length > 0) {
            form.append('rowOverridesJson', JSON.stringify(rowOverrides));
        }
        const response = await api.post<RawImportResult<Record<string, unknown>>>(
            `/semester/${semesterId}/whitelist/import`,
            form,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return normalizeImportResult(response.data);
    },

    getWhitelistsPaginated: async (semesterId: number, params: { page: number; pageSize: number; role?: string; search?: string }): Promise<PagedResult<Whitelist>> => {
        const response = await api.get<PagedResult<Whitelist>>(`/semester/${semesterId}/whitelists`, { params });
        return response.data;
    },

    /** Alias for getWhitelistsPaginated as requested */
    getAllWhitelists: async (semesterId: number, params: { page: number; pageSize: number; role?: string; search?: string }): Promise<PagedResult<Whitelist>> => {
        const response = await api.get<PagedResult<Whitelist>>(`/semester/${semesterId}/whitelists`, { params });
        return response.data;
    },

    getWhitelistBatches: async (semesterId: number): Promise<ImportBatch[]> => {
        const response = await api.get<ImportBatch[]>(`/semester/${semesterId}/whitelist-batches`);
        return response.data;
    }
};
