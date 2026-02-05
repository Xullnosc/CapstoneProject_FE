import api from './api';
import type { Whitelist } from './semesterService';

export const whitelistService = {
    getWhitelistByRole: async (roleId: number): Promise<Whitelist[]> => {
        const response = await api.get<Whitelist[]>(`/whitelist/role/${roleId}`);
        return response.data;
    }
};
