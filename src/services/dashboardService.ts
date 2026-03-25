import api from './api';

export interface DashboardStats {
  totalUsers: number;
  totalTheses: number;
  totalTeams: number;
  totalSemesters: number;
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }
};
