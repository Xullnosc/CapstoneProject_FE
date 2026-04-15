import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { chatService } from '../services/chatService';
import { semesterService } from '../services/semesterService';
import { type ChatMessageDto, type ConversationDto, type TeamChatInfoDto } from '../types/studentInteraction';
import { jwtUtils } from '../utils/jwtUtils';
import { ChatContext } from './chatContextBase';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [teams, setTeams] = useState<TeamChatInfoDto[]>([]);
  const userId = jwtUtils.getUserId();
  
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const isConnecting = useRef(false);
  const messageHandlers = useRef<Map<string, (msg: ChatMessageDto) => void>>(new Map());

  const registerMessageHandler = useCallback((id: string, handler: (msg: ChatMessageDto) => void) => {
    messageHandlers.current.set(id, handler);
  }, []);

  const unregisterMessageHandler = useCallback((id: string) => {
    messageHandlers.current.delete(id);
  }, []);

  // Helper to safely compare dates from any format
  const safeGetTime = (dateStr?: string) => {
    if (!dateStr) return 0;
    const time = Date.parse(dateStr);
    if (isNaN(time)) {
        // Fallback for non-ISO formats if needed (like DD/MM/YYYY)
        const parts = dateStr.match(/(\d+)/g);
        if (parts && parts.length >= 3) {
            // Try to construct a date object manually if common standard fails
            return new Date(dateStr).getTime() || 0;
        }
        return 0;
    }
    return time;
  };

  const refreshLists = useCallback(async () => {
    try {
      const semester = await semesterService.getCurrentSemester();
      if (!semester) return;

      const [convList, teamList] = await Promise.all([
        chatService.getConversations(semester.semesterId),
        chatService.getTeamList(semester.semesterId)
      ]);

      // Sort by recency with safe parsing
      convList.sort((a, b) => safeGetTime(b.lastMessageAt) - safeGetTime(a.lastMessageAt));
      teamList.sort((a, b) => safeGetTime(b.lastMessageAt) - safeGetTime(a.lastMessageAt));

      setConversations(convList);
      setTeams(teamList);
    } catch (e) {
      console.error('Failed to refresh chat lists', e);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
        setIsConnected(false);
        setConversations([]);
        setTeams([]);
        if (connectionRef.current) {
            connectionRef.current.stop();
            connectionRef.current = null;
        }
        return;
    }

    if (connectionRef.current || isConnecting.current) return;

    const token = localStorage.getItem('token');
    if (!token) return;

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
      // 1. Notify listeners (ChatPage UI)
      messageHandlers.current.forEach(handler => handler(message));
      
      // 2. Local Recency Sorting
      if (message.teamId) {
          setTeams(prev => {
              const target = prev.find(t => t.teamId === message.teamId);
              const others = prev.filter(t => t.teamId !== message.teamId);
              if (target) {
                  return [{ ...target, lastMessage: message.content, lastMessageAt: message.createdAt, unreadCount: target.unreadCount + 1 }, ...others];
              }
              // If not in list, refresh for full data
              setTimeout(refreshLists, 500);
              return prev;
          });
      } else {
          setConversations(prev => {
              const target = prev.find(c => c.conversationId === message.conversationId);
              const others = prev.filter(c => c.conversationId !== message.conversationId);
              if (target) {
                  return [{ ...target, lastMessage: message.content, lastMessageAt: message.createdAt, unreadCount: target.unreadCount + 1 }, ...others];
              }
              setTimeout(refreshLists, 500);
              return prev;
          });
      }

      window.dispatchEvent(new CustomEvent('refreshUnreadCount'));
    });

    connection.on('UpdateOnlineUsers', (userIds: number[]) => {
      setOnlineUsers(userIds);
    });

    const startConnection = async () => {
      if (isConnecting.current) return;
      isConnecting.current = true;
      try {
        await connection.start();
        connectionRef.current = connection;
        setIsConnected(true);
        void refreshLists();
      } catch (err: unknown) {
        const maybeErr = err as { name?: string };
        if (maybeErr?.name !== 'AbortError') console.warn('SignalR Start Warning: ', err);
        setIsConnected(false);
      } finally {
        isConnecting.current = false;
      }
    };

    void startConnection();

    return () => {
        if (connectionRef.current) {
            connectionRef.current.stop();
            connectionRef.current = null;
        }
    };
  }, [refreshLists, userId]);

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

  const markAsRead = useCallback(async (conversationId?: number, teamId?: number) => {
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
        await connectionRef.current.invoke('MarkAsRead', conversationId, teamId);
        if (teamId) {
            setTeams(prev => prev.map(t => t.teamId === teamId ? { ...t, unreadCount: 0 } : t));
        } else if (conversationId) {
            setConversations(prev => prev.map(c => c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c));
        }
    }
  }, []);

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
      isConnected, onlineUsers, conversations, teams,
      sendDirectMessage, sendTeamMessage, markAsRead, 
      joinConversation, leaveConversation,
      registerMessageHandler, unregisterMessageHandler, refreshLists
    }}>
      {children}
    </ChatContext.Provider>
  );
};
