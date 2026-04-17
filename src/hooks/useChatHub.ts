import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { type ChatMessageDto } from '../types/studentInteraction';

interface UseChatHubProps {
  onMessageReceived?: (message: ChatMessageDto) => void;
  token: string | null;
}

export const useChatHub = ({ onMessageReceived, token }: UseChatHubProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const handlerRef = useRef(onMessageReceived);

  // Update handler ref when callback changes
  useEffect(() => {
    handlerRef.current = onMessageReceived;
  }, [onMessageReceived]);

  // 1. SIGNALR MANAGER: Manage connection lifecycle
  useEffect(() => {
    // If no token, we ensure the connection is stopped and state is reset
    if (!token) {
        if (connectionRef.current) {
            connectionRef.current.stop();
            connectionRef.current = null;
        }
        setTimeout(() => setIsConnected(false), 0);
        return;
    }

    // KILL OLD CONNECTION before starting new one
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
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection.on('ReceiveMessage', (message: ChatMessageDto) => {
      handlerRef.current?.(message);
    });

    connection.on('ChatRead', (data: { conversationId?: number, teamId?: number }) => {
      console.log('SignalR: Chat marked as read', data);
    });

    const startConnection = async () => {
      try {
        await connection.start();
        setTimeout(() => setIsConnected(true), 0);
        connectionRef.current = connection;
      } catch (err) {
        console.warn('SignalR Connection Error: ', err);
        setTimeout(() => setIsConnected(false), 0);
      }
    };

    void startConnection();

    return () => {
      connection.stop();
      connectionRef.current = null;
      setTimeout(() => setIsConnected(false), 0);
    };
  }, [token]);

  const sendDirectMessage = useCallback(async (conversationId: number, content: string) => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('SendDirectMessage', conversationId, content);
    }
  }, []);

  const sendTeamMessage = useCallback(async (teamId: number, content: string) => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('SendTeamMessage', teamId, content);
    }
  }, []);

  const markAsRead = useCallback(async (conversationId?: number, teamId?: number) => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('MarkAsRead', conversationId, teamId);
    }
  }, []);

  const joinConversation = useCallback(async (conversationId: number) => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('JoinConversation', conversationId);
    }
  }, []);

  const leaveConversation = useCallback(async (conversationId: number) => {
    if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
      await connectionRef.current.invoke('LeaveConversation', conversationId);
    }
  }, []);

  return {
    isConnected,
    sendDirectMessage,
    sendTeamMessage,
    markAsRead,
    joinConversation,
    leaveConversation
  };
};
