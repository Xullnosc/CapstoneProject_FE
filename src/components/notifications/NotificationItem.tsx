import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface NotificationItemProps {
  notification: NotificationDTO;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  isProcessing: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
  onDelete,
  isProcessing,
}) => {
  const navigate = useNavigate();

  // Memoize type configuration to prevent recalculation on each render
  const typeConfig = useMemo(() => notificationTypeConfig[notification.type], [notification.type]);

  // Format timestamp
  const formattedTime = useMemo(() => formatNotificationTimestamp(notification.createdAt), [notification.createdAt]);

  // Get action button configuration based on notification type
  const getActionButton = useMemo(() => {
    if (!notification.relatedEntityId) return null;

    switch (notification.type) {
      case NotificationType.TeamInvitation:
        return {
          label: 'View Team',
          onClick: () => navigate(`/teams/${notification.relatedEntityId}`),
        };
      case NotificationType.ThesisUpdate:
        return {
          label: 'View Thesis',
          onClick: () => navigate('/my-thesis'),
        };
      case NotificationType.MentorChange:
        return {
          label: 'View Details',
          onClick: () => navigate('/mentor-invitations'),
        };
      case NotificationType.ChecklistUpdate:
        return {
          label: 'View Checklist',
          onClick: () => navigate('/my-thesis'),
        };
      case NotificationType.FormSubmission:
        return {
          label: 'View Form',
          onClick: () => navigate('/my-thesis'),
        };
      default:
        return null;
    }
  }, [notification.type, notification.relatedEntityId, navigate]);

  const handleCardClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.notificationId);
    }
    // Navigate to action if available
    if (getActionButton) {
      getActionButton.onClick();
    }
  };

  return (
    <div
      className={`
        group relative flex gap-4 p-5 rounded-2xl border transition-all cursor-pointer
        ${
          notification.isRead
            ? 'bg-gray-50 dark:bg-white/5 opacity-90 border-transparent hover:border-gray-200'
            : 'bg-white dark:bg-white/5 border-orange-100 shadow-sm hover:shadow-md'
        }
        ${isProcessing ? 'pointer-events-none opacity-50' : ''}
      `}
      onClick={handleCardClick}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${typeConfig.bgColor}`}>
          <i className={`pi ${typeConfig.icon} ${typeConfig.color} text-xl`}></i>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-xs font-bold uppercase tracking-wider ${typeConfig.color}`}>
              {notification.type.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            {!notification.isRead && (
              <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(255,106,0,0.45)]"></span>
            )}
          </div>
          <span className="text-xs text-gray-400 shrink-0">{formattedTime}</span>
        </div>
        <h3 className={`text-base leading-tight mb-1 ${notification.isRead ? 'font-medium' : 'font-bold'}`}>
          {notification.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-normal line-clamp-2">
          {notification.message}
        </p>

        {/* Action Buttons */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {getActionButton ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                getActionButton.onClick();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-full transition-colors"
            >
              <i className="pi pi-external-link text-[10px]"></i>
              {getActionButton.label}
            </button>
          ) : (
            <span className="text-xs text-transparent select-none">.</span>
          )}

          <div className="ml-auto flex items-center gap-2">
            {!notification.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.notificationId);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition-colors"
                title="Mark as read"
              >
                <i className="pi pi-check text-[10px]"></i>
                Mark as read
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.notificationId);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full transition-colors"
              title="Archive"
            >
              <i className="pi pi-trash text-[10px]"></i>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders when sibling items update
export default React.memo(
  NotificationItem,
  (prevProps, nextProps) =>
    prevProps.notification.notificationId === nextProps.notification.notificationId &&
    prevProps.notification.isRead === nextProps.notification.isRead &&
    prevProps.isProcessing === nextProps.isProcessing
);
