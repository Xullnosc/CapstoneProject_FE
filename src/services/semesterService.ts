import api from './api';


export interface TeamSimple {
    teamId: number;
    teamCode: string;
    teamName: string;
    status: string;
    memberCount: number;
}

export interface Whitelist {
    whitelistId: number;
    email: string;
    fullName?: string;
    roleName?: string;
}

export interface Semester {
    semesterId: number;
    semesterCode: string;
    semesterName: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    teamCount: number; // Optimized field
    teams: TeamSimple[];
    whitelists: Whitelist[];
}

export const semesterService = {
    getAllSemesters: async (): Promise<Semester[]> => {
        const response = await api.get<Semester[]>('/semester');
        return response.data;
    },

    getSemesterById: async (id: number): Promise<Semester> => {
        const response = await api.get<Semester>(`/semester/${id}`);
        return response.data;
    },

    createSemester: async (data: { semesterCode: string; semesterName: string; startDate: string; endDate: string; isActive: boolean }) => {
        const response = await api.post<Semester>('/semester', data);
        return response.data;
    },

    updateSemester: async (id: number, data: { semesterCode: string; semesterName: string; startDate: string; endDate: string }) => {
        const response = await api.put<Semester>(`/semester/${id}`, data);
        return response.data;
    },

    endSemester: async (id: number) => {
        await api.post(`/semester/${id}/end`);
        // Note: Delete functionality is disabled in backend
    },

    getCurrentSemester: async (): Promise<Semester | undefined> => {
        const response = await api.get<Semester[]>('/semester');
        return response.data.find(s => s.isActive);
    }
};
