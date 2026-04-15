export interface UserSkillDto {
  skillId: number;
  skillTag: string;
  // Backward compatibility: some responses may still return skillName.
  skillName?: string;
  skillLevel: string;
}

export interface SkillEntry {
  skillTag: string;
  skillLevel: string;
}

export interface MySkillsDto {
  userName: string;
  avatar?: string;
  skills: UserSkillDto[];
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

export interface DiscoveryStudentDto {
  userId: number;
  fullName: string;
  studentCode?: string;
  avatar?: string;
  majorName?: string;
  skills: UserSkillDto[];
}

export interface DiscoveryTeamDto {
  teamId: number;
  teamCode: string;
  teamName: string;
  teamAvatar?: string;
  currentMemberCount: number;
  maxMembers: number;
  skills: string[];
  semesterName: string;
  leaderId: number;
  hasPendingJoinRequest?: boolean;
  isUserInTeam?: boolean;
}

export interface ChatMessageDto {
  messageId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  content: string;
  messageType: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  conversationId?: number;
  teamId?: number;
}

export interface ConversationDto {
  conversationId: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface TeamChatInfoDto {
  teamId: number;
  teamName: string;
  teamAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  teamCode?: string;
}
