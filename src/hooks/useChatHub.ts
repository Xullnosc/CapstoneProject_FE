import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { type ChatMessageDto } from '../types/studentInteraction';

interface UseChatHubProps {
  onMessageReceived?: (message: ChatMessageDto) => void;
  semesterId: number;
}

export const useChatHub = ({ onMessageReceived }: Omit<UseChatHubProps, 'semesterId'>) => {
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const handlerRef = useRef(onMessageReceived);

  // Update handler ref when callback changes, without triggering useEffect
  useEffect(() => {
    handlerRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Build connection URL (Remove /api if present to point to hub at root)
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
      console.log('SignalR: Received message', message);
      handlerRef.current?.(message);
    });

    const startConnection = async () => {
      try {
        await connection.start();
        console.log('SignalR Connected to ChatHub');
        setIsConnected(true);
        connectionRef.current = connection;
      } catch (err) {
        console.error('SignalR Connection Error: ', err);
        setIsConnected(false);
      }
    };

    startConnection();

    return () => {
      console.log('SignalR: Stopping connection');
      connection.stop();
      connectionRef.current = null;
    };
  }, []); // Connection starts ONLY ONCE

  const sendDirectMessage = useCallback(async (conversationId: number, content: string) => {
    if (connectionRef.current && isConnected) {
      await connectionRef.current.invoke('SendDirectMessage', conversationId, content);
    }
  }, [isConnected]);

  const sendTeamMessage = useCallback(async (teamId: number, content: string) => {
    if (connectionRef.current && isConnected) {
      await connectionRef.current.invoke('SendTeamMessage', teamId, content);
    }
  }, [isConnected]);

  const markAsRead = useCallback(async (conversationId?: number, teamId?: number) => {
    if (connectionRef.current && isConnected) {
      await connectionRef.current.invoke('MarkAsRead', conversationId, teamId);
    }
  }, [isConnected]);

  const joinConversation = useCallback(async (conversationId: number) => {
    if (connectionRef.current && isConnected) {
      await connectionRef.current.invoke('JoinConversation', conversationId);
    }
  }, [isConnected]);

  const leaveConversation = useCallback(async (conversationId: number) => {
    if (connectionRef.current && isConnected) {
      await connectionRef.current.invoke('LeaveConversation', conversationId);
    }
  }, [isConnected]);

  return {
    isConnected,
    sendDirectMessage,
    sendTeamMessage,
    markAsRead,
    joinConversation,
    leaveConversation
  };
};
