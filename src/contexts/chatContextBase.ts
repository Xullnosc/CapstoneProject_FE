import { createContext } from 'react';
import { type ChatMessageDto, type ConversationDto, type TeamChatInfoDto } from '../types/studentInteraction';

export interface ChatContextType {
  isConnected: boolean;
  onlineUsers: number[];
  conversations: ConversationDto[];
  teams: TeamChatInfoDto[];
  sendDirectMessage: (conversationId: number, content: string) => Promise<void>;
  sendTeamMessage: (teamId: number, content: string) => Promise<void>;
  markAsRead: (conversationId?: number, teamId?: number) => Promise<void>;
  joinConversation: (conversationId: number) => Promise<void>;
  leaveConversation: (conversationId: number) => Promise<void>;
  registerMessageHandler: (id: string, handler: (msg: ChatMessageDto) => void) => void;
  unregisterMessageHandler: (id: string) => void;
  refreshLists: () => Promise<void>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

