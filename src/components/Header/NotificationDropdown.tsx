import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import notificationService from '../../services/notificationService';
import type { NotificationDTO } from '../../types/notification';
import { NotificationType, notificationTypeConfig } from '../../types/notification';

const formatNotificationTimestamp = (createdAt?: string): string => {
  if (!createdAt) return '';

  // Append 'Z' to ensure the browser treats the timestamp as UTC if missing
  const dateString = createdAt.endsWith('Z') ? createdAt : `${createdAt}Z`;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffInMinutes = Math.floor(diffMs / (1000 * 60));
  const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (diffInMinutes < 1) {
    return 'Just now';
  }
  if (diffInMinutes < 60) {
    return relativeTime.format(-diffInMinutes, 'minute');
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return relativeTime.format(-diffInHours, 'hour');
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return relativeTime.format(-diffInDays, 'day');
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

interface NotificationDropdownProps {
  unreadCount: number;
  onRefreshCount: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ unreadCount, onRefreshCount }) => {
  const op = useRef<OverlayPanel>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);

  // Read role from localStorage to make role-aware navigation decisions
  const userRole = (() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) return JSON.parse(raw)?.role as string | undefined;
    } catch { /* ignore */ }
    return undefined;
  })();
  const isMentor = userRole === 'Lecturer' || userRole === 'HOD';

  useEffect(() => {
    const handleViewportChange = () => {
      op.current?.hide();
    };

    window.addEventListener('scroll', handleViewportChange, true);
    window.addEventListener('resize', handleViewportChange);

    return () => {
      window.removeEventListener('scroll', handleViewportChange, true);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  const fetchRecentNotifications = async () => {
    try {
      setLoading(true);
      const result = await notificationService.getNotifications(1, 5);
      setNotifications(result.items);
    } catch (error) {
      console.error('Failed to fetch notifications for dropdown:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    op.current?.toggle(e);
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      onRefreshCount();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = async (notif: NotificationDTO) => {
    op.current?.hide();
    
    // Mark as read if unread
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif.notificationId);
        // Update local state immediately so the unread dot disappears
        setNotifications(prev =>
          prev.map(n => n.notificationId === notif.notificationId ? { ...n, isRead: true } : n)
        );
        onRefreshCount();
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigation logic
    if (notif.relatedEntityId) {
      switch (notif.type) {
        case NotificationType.TeamInvitation:
          // Students → go to their own team page; others → specific team
          navigate(isMentor ? `/teams/${notif.relatedEntityId}` : '/teams/team');
          break;
        case NotificationType.ThesisUpdate:
        case NotificationType.ChecklistUpdate:
        case NotificationType.FormSubmission:
          navigate('/my-thesis');
          break;
        case NotificationType.MentorChange:
          // Mentors see their invitation page; Students see their team page
          navigate(isMentor ? '/mentor-invitations' : '/teams/team');
          break;
        default:
          navigate('/notifications');
      }
    } else {
      navigate('/notifications');
    }
  };

  const renderNotificationItem = (notif: NotificationDTO) => {
    const config = notificationTypeConfig[notif.type];
    const timeFormatted = formatNotificationTimestamp(notif.createdAt);

    return (
      <div 
        key={notif.notificationId}
        onClick={() => handleNotificationClick(notif)}
        className={`flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer hover:bg-orange-50/50 relative ${!notif.isRead ? 'bg-white' : 'opacity-70'}`}
      >
        <div className={`shrink-0 w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
          <i className={`pi ${config.icon} ${config.color} text-lg`}></i>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
              {notif.type.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <span className="text-[10px] text-gray-400">{timeFormatted}</span>
          </div>
          <h4 className={`text-sm leading-tight truncate ${!notif.isRead ? 'font-bold' : 'font-semibold'} text-gray-800`}>
            {notif.title}
          </h4>
          <p className="text-xs text-gray-500 truncate mt-1">
            {notif.message}
          </p>
        </div>
        {!notif.isRead && (
          <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shadow-[0_0_6px_rgba(255,106,0,0.45)]"></div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      <div 
        onClick={handleToggle}
        className="mr-1 relative cursor-pointer flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:bg-orange-50 text-gray-500 hover:text-orange-600"
      >
        <i className="pi pi-bell text-xl"></i>
        {unreadCount > 0 && (
          <Badge value={unreadCount > 99 ? '99+' : unreadCount} severity="danger" className="absolute -top-1 -right-1 text-[10px] p-0 min-w-[18px] h-[18px] scale-90 border-2 border-white"></Badge>
        )}
      </div>

      <OverlayPanel 
        ref={op} 
        onShow={fetchRecentNotifications}
        appendTo={document.body}
        autoZIndex
        baseZIndex={1200}
        className="notification-overlay w-[320px] sm:w-[360px] rounded-2xl shadow-2xl border-none p-0 overflow-hidden"
      >
        <div className="p-3 bg-white">
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <h3 className="text-base font-bold text-gray-800 tracking-tight">Notifications</h3>
              <p className="text-[10px] text-gray-500 font-medium">{unreadCount > 0 ? `You have ${unreadCount} unread` : 'No unread messages'}</p>
            </div>
            {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 transition-colors py-1 px-2.5 bg-orange-50 rounded-full"
                >
                  Mark all as read
                </button>
            )}
          </div>

          <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto custom-scrollbar pr-1 min-h-[50px]">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-2 bg-gray-100 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length > 0 ? (
              notifications.map(renderNotificationItem)
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-3">
                  <i className="pi pi-bell-slash text-2xl text-orange-300"></i>
                </div>
                <p className="text-sm font-bold text-gray-500">No notifications yet</p>
                <p className="text-xs text-gray-400 text-center mt-1 px-4">When you get updates about your team or project, they'll show up here.</p>
              </div>
            )}
          </div>

          <Divider className="my-3" />

          <button 
            onClick={() => {
              op.current?.hide();
              navigate('/notifications');
            }}
            className="w-full py-2 text-xs font-bold text-orange-600 hover:bg-orange-50 rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            <span>View all notifications</span>
            <i className="pi pi-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
          </button>
        </div>
      </OverlayPanel>

      <style>{`
        .notification-overlay.p-overlaypanel:before, 
        .notification-overlay.p-overlaypanel:after {
          display: none !important;
        }
        .notification-overlay .p-overlaypanel-content {
          padding: 0;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default NotificationDropdown;
