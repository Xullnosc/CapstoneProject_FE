import api from './api';
import type { NotificationDTO, PagedResult } from '../types/notification';

// Cache for unread count to prevent excessive API calls
interface CacheEntry {
  value: number;
  timestamp: number;
}

const CACHE_TTL = 10000; // 10 seconds
let unreadCountCache: CacheEntry | null = null;

const notificationService = {
  /**
   * Get paginated notifications for the current user
   */
  getNotifications: async (
    pageIndex: number = 1,
    pageSize: number = 10
  ): Promise<PagedResult<NotificationDTO>> => {
    const response = await api.get<PagedResult<NotificationDTO>>('/notifications', {
      params: { pageIndex, pageSize },
    });
    return response.data;
  },

  /**
   * Get all unread notifications for the current user
   */
  getUnreadNotifications: async (): Promise<NotificationDTO[]> => {
    const response = await api.get<NotificationDTO[]>('/notifications/unread');
    return response.data;
  },

  /**
   * Get unread notification count with caching (10s TTL)
   */
  getUnreadCount: async (forceRefresh: boolean = false): Promise<number> => {
    const now = Date.now();
    
    // Return cached value if still valid and not forcing refresh
    if (!forceRefresh && unreadCountCache && now - unreadCountCache.timestamp < CACHE_TTL) {
      return unreadCountCache.value;
    }

    // Fetch fresh count from API
    const response = await api.get<number>('/notifications/count');
    const count = response.data;

    // Update cache
    unreadCountCache = {
      value: count,
      timestamp: now,
    };

    return count;
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (notificationId: number): Promise<void> => {
    await api.put(`/notifications/${notificationId}/read`);
    // Invalidate cache after marking as read
    unreadCountCache = null;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
    // Invalidate cache after marking all as read
    unreadCountCache = null;
  },

  /**
   * Delete a notification (used as "archive")
   */
  deleteNotification: async (notificationId: number): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
    // Invalidate cache after deletion
    unreadCountCache = null;
  },

  /**
   * Clear the unread count cache manually
   */
  clearCache: (): void => {
    unreadCountCache = null;
  },
};

export default notificationService;
