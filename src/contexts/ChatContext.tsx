import React, { useEffect, useRef, useState, useCallback, useReducer } from 'react';
import * as signalR from '@microsoft/signalr';
import { chatService } from '../services/chatService';
import { semesterService } from '../services/semesterService';
import { type ChatMessageDto, type ConversationDto, type TeamChatInfoDto } from '../types/studentInteraction';
import { ChatContext } from './chatContextBase';

type ChatState = {
  isConnected: boolean;
  onlineUsers: number[];
  conversations: ConversationDto[];
  teams: TeamChatInfoDto[];
  totalUnreadCount: number;
};

type ChatAction = 
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ONLINE_USERS'; payload: number[] }
  | { type: 'SET_CONVERSATIONS'; payload: ConversationDto[] }
  | { type: 'SET_TEAMS'; payload: TeamChatInfoDto[] }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'MARK_READ_OPTIMISTIC'; payload: { id?: number; teamId?: number } }
  | { type: 'RESET_ALL' };

const initialState: ChatState = {
  isConnected: false,
  onlineUsers: [],
  conversations: [],
  teams: [],
  totalUnreadCount: 0
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONNECTED': return { ...state, isConnected: action.payload };
    case 'SET_ONLINE_USERS': return { ...state, onlineUsers: action.payload };
    case 'SET_CONVERSATIONS': return { ...state, conversations: action.payload };
    case 'SET_TEAMS': return { ...state, teams: action.payload };
    case 'SET_UNREAD_COUNT': return { ...state, totalUnreadCount: action.payload };
    case 'MARK_READ_OPTIMISTIC': {
        const { id, teamId } = action.payload;
        let deductedCount = 0;
        
        let nextTeams = state.teams;
        let nextConvs = state.conversations;

        if (teamId) {
            nextTeams = state.teams.map(t => {
                if (t.teamId === teamId) {
                    deductedCount = t.unreadCount;
                    return { ...t, unreadCount: 0 };
                }
                return t;
            });
        } else if (id) {
            nextConvs = state.conversations.map(c => {
                if (c.conversationId === id) {
                    deductedCount = c.unreadCount;
                    return { ...c, unreadCount: 0 };
                }
                return c;
            });
        }

        return {
            ...state,
            teams: nextTeams,
            conversations: nextConvs,
            totalUnreadCount: Math.max(0, state.totalUnreadCount - deductedCount)
        };
    }
    case 'RESET_ALL': return initialState;
    default: return state;
  }
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const semesterIdRef = useRef<number | null>(null);
  const messageHandlers = useRef<Map<string, (msg: ChatMessageDto) => void>>(new Map());

  // 1. TOKEN SYNCHRONIZER
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token');
      setToken(prev => (prev !== newToken ? newToken : prev));
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // 2. DATA RESET
  useEffect(() => {
    if (!token) {
        if (connectionRef.current) {
            connectionRef.current.stop();
            connectionRef.current = null;
        }
        semesterIdRef.current = null;
        dispatch({ type: 'RESET_ALL' });
    }
  }, [token]);

  const registerMessageHandler = useCallback((id: string, handler: (msg: ChatMessageDto) => void) => {
    messageHandlers.current.set(id, handler);
  }, []);

  const unregisterMessageHandler = useCallback((id: string) => {
    messageHandlers.current.delete(id);
  }, []);

  // TECH LEAD: Stable refreshLists with SemesterID caching to prevent 429
  const refreshLists = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return;

    try {
      let semId = semesterIdRef.current;
      if (semId === null) {
          const semester = await semesterService.getCurrentSemester();
          if (!semester) return;
          semId = semester.semesterId;
          semesterIdRef.current = semId;
      }

      const [convList, teamList, totalUnread] = await Promise.all([
        chatService.getConversations(semId),
        chatService.getTeamList(semId),
        chatService.getTotalUnread()
      ]);

      dispatch({ type: 'SET_CONVERSATIONS', payload: convList.filter(c => c.lastMessage != null) });
      dispatch({ type: 'SET_TEAMS', payload: teamList });
      dispatch({ type: 'SET_UNREAD_COUNT', payload: totalUnread });
    } catch (e) {
      console.error('Failed to refresh chat lists', e);
    }
  }, []);

  // 3. SIGNALR MANAGER
  useEffect(() => {
    if (!token) return;

    if (connectionRef.current) {
        connectionRef.current.stop();
    }

    const baseUrl = import.meta.env.VITE_API_URL.replace(/\/api$/, '');
    const hubUrl = `${baseUrl}/chatHub`;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveMessage', (message: ChatMessageDto) => {
      messageHandlers.current.forEach(handler => handler(message));
      void refreshLists();
    });

    connection.on('UpdateOnlineUsers', (userIds: number[]) => {
      dispatch({ type: 'SET_ONLINE_USERS', payload: userIds });
    });

    connection.on('UpdateUnreadCount', (count: number) => {
      dispatch({ type: 'SET_UNREAD_COUNT', payload: count });
    });

    const startConnection = async () => {
      try {
        await connection.start();
        connectionRef.current = connection;
        dispatch({ type: 'SET_CONNECTED', payload: true });
        void refreshLists();
      } catch (err) {
        console.warn('SignalR Connection Error: ', err);
        dispatch({ type: 'SET_CONNECTED', payload: false });
      }
    };

    void startConnection();

    return () => {
        connection.stop();
        connectionRef.current = null;
        dispatch({ type: 'SET_CONNECTED', payload: false });
    };
  }, [token, refreshLists]);

  const sendDirectMessage = useCallback(async (conversationId: number, content: string) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('SendDirectMessage', conversationId, content);
    }
  }, []);

  const sendTeamMessage = useCallback(async (teamId: number, content: string) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('SendTeamMessage', teamId, content);
    }
  }, []);

  // TECH LEAD: Stable markAsRead using MARK_READ_OPTIMISTIC action
  const markAsRead = useCallback(async (conversationId?: number, teamId?: number) => {
    // 1. Dispatch optimistic update (atomic, no state dependency)
    dispatch({ type: 'MARK_READ_OPTIMISTIC', payload: { id: conversationId, teamId } });

    // 2. Server notify
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
        try {
            await connectionRef.current.invoke('MarkAsRead', conversationId, teamId);
            setTimeout(refreshLists, 300);
        } catch (e) {
            console.error("MarkAsRead failed", e);
            void refreshLists(); 
        }
    }
  }, [refreshLists]);

  const joinConversation = useCallback(async (conversationId: number) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('JoinConversation', conversationId);
    }
  }, []);

  const leaveConversation = useCallback(async (conversationId: number) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('LeaveConversation', conversationId);
    }
  }, []);

  return (
    <ChatContext.Provider value={{ 
      ...state,
      sendDirectMessage, sendTeamMessage, markAsRead, 
      joinConversation, leaveConversation,
      registerMessageHandler, unregisterMessageHandler, refreshLists
    }}>
      {children}
    </ChatContext.Provider>
  );
};
