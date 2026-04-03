import api from './api';

export interface DashboardStats {
  totalUsers: number;
  totalTheses: number;
  totalTeams: number;
  totalSemesters: number;
}

export interface RecentMentorInvitationRow {
  invitationId: number;
  teamId: number;
  teamCode: string;
  teamName: string;
  status: string | null;
  createdAt: string | null;
}

export interface RecentApplicationRow {
  applicationId: number;
  thesisId: string;
  thesisTitle: string;
  teamId: number;
  teamCode: string;
  teamName: string;
  status: string | null;
  createdAt: string | null;
}

export interface ThesisStatusCount {
  status: string;
  count: number;
}

export interface LecturerMentorStats {
  mentoredTeamsInCurrentSemester: number;
  maxMentorTeamsPerSemester: number;
  invitationsPending: number;
  invitationsAccepted: number;
  invitationsDeclined: number;
  invitationsCancelled: number;
  recentInvitations: RecentMentorInvitationRow[];
}

export interface LecturerApplicationStats {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  cancelledCount: number;
  recentPending: RecentApplicationRow[];
}

export interface LecturerOwnThesisStats {
  totalInCurrentSemester: number;
  byStatus: ThesisStatusCount[];
}

export interface ReviewerPendingThesisRow {
  thesisId: string;
  title: string;
  thesisStatus: string | null;
}

export interface LecturerReviewerStats {
  pendingReviewCount: number;
  pendingTheses: ReviewerPendingThesisRow[];
}

export interface LecturerDashboardStats {
  currentSemesterCode: string | null;
  mentor: LecturerMentorStats;
  applications: LecturerApplicationStats;
  ownTheses: LecturerOwnThesisStats;
  reviewer: LecturerReviewerStats | null;
  unreadNotifications: number;
  campusSummary: DashboardStats;
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getLecturerStats: async (): Promise<LecturerDashboardStats> => {
    const response = await api.get('/dashboard/lecturer-stats');
    return response.data;
  }
};
