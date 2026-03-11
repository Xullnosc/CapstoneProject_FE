import { useState, useEffect, useCallback, useRef } from 'react';
import notificationService from '../services/notificationService';
import type { NotificationDTO, FilterType, PagedResult } from '../types/notification';
import Swal from '../utils/swal';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  const pageSize = 10;
  const debounceTimerRef = useRef<number | null>(null);

  const sortByLatest = useCallback((items: NotificationDTO[]): NotificationDTO[] => {
    return [...items].sort((a, b) => {
      const aTs = new Date(a.createdAt ?? a.updatedAt ?? 0).getTime();
      const bTs = new Date(b.createdAt ?? b.updatedAt ?? 0).getTime();
      return bTs - aTs;
    });
  }, []);

  /**
   * Fetch notifications with current filter and page settings
   */
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      let result: PagedResult<NotificationDTO>;

      if (filter === 'unread') {
        // For unread filter, get all unread and manually paginate
        const unreadNotifications = sortByLatest(await notificationService.getUnreadNotifications());
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        
        result = {
          items: unreadNotifications.slice(startIndex, endIndex),
          pageIndex: currentPage,
          pageSize: pageSize,
          totalCount: unreadNotifications.length,
          totalPages: Math.ceil(unreadNotifications.length / pageSize) || 1,
        };
      } else if (filter === 'archived') {
        // Archived notifications are deleted, so show empty list
        result = {
          items: [],
          pageIndex: 1,
          pageSize: pageSize,
          totalCount: 0,
          totalPages: 1,
        };
      } else {
        // Default: get all notifications with pagination
        result = await notificationService.getNotifications(currentPage, pageSize);
        result = {
          ...result,
          items: sortByLatest(result.items),
        };
      }

      setNotifications(result.items);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load notifications. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filter, sortByLatest]);

  /**
   * Debounced filter change to prevent rapid API calls
   */
  const debouncedFetchNotifications = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchNotifications();
    }, 300); // 300ms debounce
  }, [fetchNotifications]);

  /**
   * Load notifications on mount and when dependencies change
   */
  useEffect(() => {
    debouncedFetchNotifications();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [debouncedFetchNotifications]);

  /**
   * Mark a single notification as read
   */
  const markAsRead = useCallback(
    async (notificationId: number) => {
      // Optimistic update: mark as read immediately in UI
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );

      setProcessingIds((prev) => new Set(prev).add(notificationId));

      try {
        await notificationService.markAsRead(notificationId);
        // Refresh to ensure consistency
        await fetchNotifications();
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
        // Revert optimistic update on error
        setNotifications((prev) =>
          prev.map((n) => (n.notificationId === notificationId ? { ...n, isRead: false, readAt: undefined } : n))
        );
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to mark notification as read.',
        });
      } finally {
        setProcessingIds((prev) => {
          const updated = new Set(prev);
          updated.delete(notificationId);
          return updated;
        });
      }
    },
    [fetchNotifications]
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    
    if (unreadCount === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Unread Notifications',
        text: 'All notifications are already marked as read.',
      });
      return;
    }

    try {
      await notificationService.markAllAsRead();
      await fetchNotifications();
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `Marked ${unreadCount} notification${unreadCount > 1 ? 's' : ''} as read.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to mark all notifications as read.',
      });
    }
  }, [notifications, fetchNotifications]);

  /**
   * Delete a notification (archive)
   */
  const deleteNotification = useCallback(
    async (notificationId: number) => {
      const result = await Swal.fire({
        title: 'Archive Notification?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, archive it',
        cancelButtonText: 'Cancel',
      });

      if (!result.isConfirmed) {
        return;
      }

      // Optimistic update: remove from list immediately
      setNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
      setProcessingIds((prev) => new Set(prev).add(notificationId));

      try {
        await notificationService.deleteNotification(notificationId);
        // Refresh to update pagination
        await fetchNotifications();
        Swal.fire({
          icon: 'success',
          title: 'Archived',
          text: 'Notification has been archived.',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error('Failed to delete notification:', error);
        // Refresh to restore the notification on error
        await fetchNotifications();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to archive notification.',
        });
      } finally {
        setProcessingIds((prev) => {
          const updated = new Set(prev);
          updated.delete(notificationId);
          return updated;
        });
      }
    },
    [fetchNotifications]
  );

  /**
   * Change filter type
   */
  const changeFilter = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when changing filters
  }, []);

  /**
   * Change page
   */
  const changePage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return {
    notifications,
    isLoading,
    currentPage,
    totalPages,
    totalCount,
    filter,
    processingIds,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    changeFilter,
    changePage,
    refetch: fetchNotifications,
  };
};
