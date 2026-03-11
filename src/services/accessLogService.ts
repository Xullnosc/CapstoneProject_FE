import api from './api';

export interface AccessLogDTO {
    id: string;
    userId: string;
    userEmail: string;
    ipAddress?: string;
    action: string;
    isSuccess: boolean;
    description?: string;
    createdAt: string;
    fullName?: string;
    roleName?: string;
}

export interface PaginatedAccessLogs {
    data: AccessLogDTO[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export const accessLogService = {
    getPaginatedLogs: async (page: number = 1, pageSize: number = 10): Promise<PaginatedAccessLogs> => {
        const response = await api.get(`/admin/access-logs?page=${page}&pageSize=${pageSize}`);
        return response.data;
    },
};
