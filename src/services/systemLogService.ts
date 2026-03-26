import api from './api';

export interface SystemErrorLog {
  id: number;
  level: string;
  message: string;
  stackTrace?: string;
  timestamp: string;
}

export interface GetSystemLogResponse {
  data: SystemErrorLog[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export const systemLogService = {
  getLogs: async (
    pageNumber: number = 1,
    pageSize: number = 10,
    level?: string
  ): Promise<GetSystemLogResponse> => {
    const params = new URLSearchParams();
    params.append('pageNumber', pageNumber.toString());
    params.append('pageSize', pageSize.toString());
    if (level && level !== 'All') {
      params.append('level', level);
    }
    
    const response = await api.get<GetSystemLogResponse>('/system/error-logs', { params });
    return response.data;
  }
};
