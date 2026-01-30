export interface TeamMember {
    studentId: number;
    studentCode: string;
    fullName: string;
    role: "Leader" | "Member";
    joinedAt: string;
    avatar?: string;
    email?: string;
}

export interface Team {
    teamId: number;
    teamCode: string;
    teamName: string;
    teamAvatar?: string;
    semesterId: number;
    status: string;
    createdAt: string;
    memberCount: number;
    leaderName: string;
    leaderId: number;
    members: TeamMember[];
    topicId?: number;
    topicName?: string;
    description?: string;
}

export interface TeamInvitation {
    invitationId: number;
    teamId: number;
    team: {
        teamId: number;
        teamCode: string;
        teamName: string;
        teamAvatar?: string;
        memberCount: number;
        leaderName: string;
    };
    invitedBy: {
        userId: number;
        name: string;
        email: string;
        avatar: string;
    };
    message?: string;
    status: "Pending" | "Accepted" | "Declined";
    createdAt: string;
}

export interface CreateTeamRequest {
    teamName: string;
    description?: string;
}

export interface UpdateTeamRequest {
    teamName: string;
    description: string;
    avatarFile?: File;
}
