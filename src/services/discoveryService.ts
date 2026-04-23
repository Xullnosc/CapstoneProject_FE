import api from './api';
import { type DiscoveryStudentDto, type DiscoveryTeamDto, type PagedResult, type UserSkillDto, type SkillEntry } from '../types/studentInteraction';

export const discoveryService = {
  getLookingStudents: async (semesterId: number, skill = '', searchQuery = '', page = 1, pageSize = 12): Promise<PagedResult<DiscoveryStudentDto>> => {
    const response = await api.get<PagedResult<DiscoveryStudentDto>>(`/Discovery/students`, {
      params: { semesterId, skill, searchQuery, page, pageSize }
    });
    return response.data;
  },

  getOpenTeams: async (semesterId: number, skill = '', searchQuery = '', page = 1, pageSize = 12): Promise<PagedResult<DiscoveryTeamDto>> => {
    const response = await api.get<PagedResult<DiscoveryTeamDto>>(`/Discovery/teams`, {
      params: { semesterId, skill, searchQuery, page, pageSize }
    });
    return response.data;
  },

  getPopularSkills: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/Discovery/popular-skills');
    return response.data;
  },

  requestJoin: async (teamId: number): Promise<void> => {
    await api.post(`/Discovery/request-join/${teamId}`);
  },

  cancelJoinRequest: async (teamId: number): Promise<void> => {
    await api.post(`/Discovery/cancel-request/${teamId}`);
  },

  getUserSkills: async (userId: number): Promise<UserSkillDto[]> => {
    const response = await api.get<UserSkillDto[]>(`/Discovery/user/${userId}/skills`);
    return response.data;
  },

  getMySkills: async (): Promise<UserSkillDto[]> => {
    const response = await api.get<UserSkillDto[]>('/Discovery/my-skills');
    return response.data;
  },

  updateMySkills: async (skills: SkillEntry[]): Promise<void> => {
    await api.put('/Discovery/my-skills', { skills });
  }
};
