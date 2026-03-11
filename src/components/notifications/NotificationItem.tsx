import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NotificationDTO } from '../../types/notification';
import { NotificationType, notificationTypeConfig } from '../../types/notification';

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
  const formattedTime = useMemo(() => {
    if (!notification.createdAt) return '';
    
    const date = new Date(notification.createdAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    }
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    if (diffInHours < 48) {
      return 'Yesterday';
    }
    return `${Math.floor(diffInHours / 24)} days ago`;
  }, [notification.createdAt]);

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
          onClick: () => navigate('/home'),
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
      <div className="flex-1 pr-4 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${typeConfig.color}`}>
            {notification.type.replace(/([A-Z])/g, ' $1').trim()}
          </span>
          <span className="text-xs text-gray-400">{formattedTime}</span>
        </div>
        <h3 className={`text-base leading-tight mb-1 ${notification.isRead ? 'font-medium' : 'font-bold'}`}>
          {notification.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-normal line-clamp-2">
          {notification.message}
        </p>

        {/* Action Buttons */}
        {getActionButton && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                getActionButton.onClick();
              }}
              className="px-4 py-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              {getActionButton.label}
            </button>
          </div>
        )}
      </div>

      {/* Unread Indicator */}
      {!notification.isRead && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(255,106,0,0.5)]"></div>
        </div>
      )}

      {/* Action Menu (Mark Read / Delete) */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.isRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.notificationId);
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Mark as read"
          >
            <i className="pi pi-check text-sm text-gray-500"></i>
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.notificationId);
          }}
          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Archive"
        >
          <i className="pi pi-trash text-sm text-red-500"></i>
        </button>
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
