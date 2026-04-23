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
    isSpecial?: boolean;
    createdAt: string;
    memberCount: number;
    leaderName: string;
    leaderId: number;
    members: TeamMember[];
    mentorId?: number;
    mentorName?: string;
    mentorEmail?: string;
    mentorAvatar?: string;
    mentorId2?: number;
    mentor2Name?: string;
    mentor2Email?: string;
    mentor2Avatar?: string;
    topicId?: string;
    topicName?: string;
    topicStatus?: string;
    topicFileUrl?: string;
    topicDescription?: string;
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
    type?: "Member" | "Mentor" | "JoinRequest";
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
