import api from "./api";
import type { AxiosError } from 'axios';
import { type ChatMessageDto, type ConversationDto, type TeamChatInfoDto } from "../types/studentInteraction";

interface NumberCacheEntry {
  value: number;
  timestamp: number;
}

const UNREAD_CACHE_TTL = 10000;
let totalUnreadCache: NumberCacheEntry | null = null;
let totalUnreadInFlight: Promise<number> | null = null;
let totalUnreadCooldownUntil = 0;
const CHAT_HISTORY_COOLDOWN_MS = 5000;
const chatHistoryInFlight = new Map<string, Promise<ChatMessageDto[]>>();
const chatHistoryCache = new Map<string, { value: ChatMessageDto[]; timestamp: number }>();
const chatHistoryCooldownUntil = new Map<string, number>();
const CHAT_HISTORY_CACHE_TTL = 3000;

export const chatService = {
  getConversations: async (semesterId: number) => {
    const response = await api.get<ConversationDto[]>("/Chat/conversations", {
      params: { semesterId }
    });
    return response.data;
  },

  getOrCreateConversation: async (otherUserId: number, semesterId: number) => {
    const response = await api.get<ConversationDto>("/Chat/get-or-create", {
      params: { otherUserId, semesterId }
    });
    return response.data;
  },

  getTeamList: async (semesterId: number) => {
    const response = await api.get<TeamChatInfoDto[]>("/Chat/teams", {
      params: { semesterId }
    });
    return response.data;
  },

  getChatHistory: async (conversationId?: number, teamId?: number, page: number = 1, pageSize: number = 50) => {
    const url = teamId ? `/Chat/team-history/${teamId}` : `/Chat/history/${conversationId}`;
    const key = `${teamId ? 'team' : 'conversation'}:${teamId ?? conversationId}:${page}:${pageSize}`;
    const now = Date.now();

    const cached = chatHistoryCache.get(key);
    if (cached && now - cached.timestamp < CHAT_HISTORY_CACHE_TTL) {
      return cached.value;
    }

    const cooldownUntil = chatHistoryCooldownUntil.get(key) ?? 0;
    if (now < cooldownUntil) {
      return cached?.value ?? [];
    }

    const inFlight = chatHistoryInFlight.get(key);
    if (inFlight) {
      return inFlight;
    }

    const requestPromise = (async () => {
      try {
        const response = await api.get<ChatMessageDto[]>(url, {
          params: { page, pageSize }
        });
        chatHistoryCache.set(key, {
          value: response.data,
          timestamp: Date.now()
        });
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 429) {
          chatHistoryCooldownUntil.set(key, Date.now() + CHAT_HISTORY_COOLDOWN_MS);
          return cached?.value ?? [];
        }
        throw error;
      } finally {
        chatHistoryInFlight.delete(key);
      }
    })();

    chatHistoryInFlight.set(key, requestPromise);
    return requestPromise;
  },

  markRead: async (conversationId?: number, teamId?: number) => {
    const response = await api.post("/Chat/read", null, {
      params: { conversationId, teamId }
    });
    return response.data;
  },

  getTotalUnread: async () => {
    const now = Date.now();

    if (totalUnreadCache && now - totalUnreadCache.timestamp < UNREAD_CACHE_TTL) {
      return totalUnreadCache.value;
    }

    if (now < totalUnreadCooldownUntil) {
      return totalUnreadCache?.value ?? 0;
    }

    if (totalUnreadInFlight) {
      return totalUnreadInFlight;
    }

    totalUnreadInFlight = (async () => {
      try {
        const response = await api.get<{ unreadCount: number }>("/Chat/unread-count");
        const unreadCount = Number(response.data?.unreadCount ?? 0);
        totalUnreadCache = {
          value: unreadCount,
          timestamp: Date.now()
        };
        return unreadCount;
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 429) {
          totalUnreadCooldownUntil = Date.now() + 30000; // 30s cooldown
          return totalUnreadCache?.value ?? 0;
        }
        throw error;
      } finally {
        totalUnreadInFlight = null;
      }
    })();

    return totalUnreadInFlight;
  }
};
