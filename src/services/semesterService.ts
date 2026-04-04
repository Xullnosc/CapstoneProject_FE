import api from './api';


export interface TeamSimple {
    teamId: number;
    teamCode: string;
    teamName: string;
    status: string;
    memberCount: number;
    isSpecial?: boolean;
}

export interface Whitelist {
    whitelistId: number;
    email: string;
    fullName?: string;
    roleName?: string;
    roleId?: number;
    semesterId?: number;
    isReviewer?: boolean;
    avatar?: string;
    campus?: string;
    studentCode?: string;
}

export interface Semester {
    semesterId: number;
    semesterCode: string;
    semesterName: string;
    startDate: string;
    endDate: string;
    status: 'Upcoming' | 'Active' | 'Review Thesis' | 'Review Middle Semester' | 'Closed';
    teamCount: number; // Optimized field
    activeTeamCount: number; // Added field
    whitelistCount: number; // Added field
    teams: TeamSimple[];
    whitelists: Whitelist[];
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

export const semesterService = {
    getAllSemesters: async (): Promise<Semester[]> => {
        const response = await api.get<Semester[]>('/semester');
        return response.data;
    },

    getAllSemestersPaginated: async (page: number = 1, pageSize: number = 6): Promise<PagedResult<Semester>> => {
        const response = await api.get<PagedResult<Semester>>('/semester/paginated', {
            params: { page, pageSize }
        });
        return response.data;
    },

    getSemesterById: async (id: number): Promise<Semester> => {
        const response = await api.get<Semester>(`/semester/${id}`);
        return response.data;
    },
    
    getCurrentSemester: async (): Promise<Semester> => {
        const response = await api.get<Semester>('/semester/current');
        return response.data;
    },

    getWhitelistsPaginated: async (semesterId: number, params: {
        page: number;
        pageSize: number;
        role?: string;
        search?: string;
    }): Promise<PagedResult<Whitelist>> => {
        const response = await api.get<PagedResult<Whitelist>>(`/semester/${semesterId}/whitelists`, { params });
        return response.data;
    },

    createSemester: async (data: { semesterCode: string; semesterName: string; startDate: string; endDate: string }) => {
        const response = await api.post<Semester>('/semester', data);
        return response.data;
    },

    updateSemester: async (id: number, data: { semesterCode: string; semesterName: string; startDate: string; endDate: string }) => {
        const response = await api.put<Semester>(`/semester/${id}`, { ...data, semesterId: id });
        return response.data;
    },

    getOrphanedStudents: async (semesterId: number, page: number = 1, pageSize: number = 10): Promise<PagedResult<Whitelist>> => {
        const response = await api.get<PagedResult<Whitelist>>(`/semester/${semesterId}/orphaned-students`, {
            params: { page, pageSize }
        });
        return response.data;
    },

    startSemester: async (id: number) => {
        await api.post(`/semester/${id}/start`);
    },

    lockSubmission: async (id: number) => {
        await api.post(`/semester/${id}/lock-submission`);
    },

    lockAllUpdates: async (id: number) => {
        await api.post(`/semester/${id}/lock-updates`);
    },

    closeSemester: async (id: number) => {
        await api.post(`/semester/${id}/close`);
    },

    // Alias for compatibility
    endSemester: async (id: number) => {
        await api.post(`/semester/${id}/close`);
    }
};
