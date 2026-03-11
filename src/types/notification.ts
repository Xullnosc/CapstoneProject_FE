// Notification types matching backend DTOs

// Use const object instead of enum for erasableSyntaxOnly compatibility
export const NotificationType = {
  TeamInvitation: 'TeamInvitation',
  ThesisUpdate: 'ThesisUpdate',
  MentorChange: 'MentorChange',
  SemesterDeadline: 'SemesterDeadline',
  ChecklistUpdate: 'ChecklistUpdate',
  HODAction: 'HODAction',
  SystemAnnouncement: 'SystemAnnouncement',
  FormSubmission: 'FormSubmission',
} as const;

export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export interface NotificationDTO {
  notificationId: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  isRead: boolean;
  readAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNotificationDTO {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
}

export interface PagedResult<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export type FilterType = 'all' | 'unread' | 'archived';

// Notification type metadata for UI rendering
export interface NotificationTypeConfig {
  icon: string;
  color: string;
  bgColor: string;
}

export const notificationTypeConfig: Record<NotificationType, NotificationTypeConfig> = {
  [NotificationType.TeamInvitation]: {
    icon: 'pi-users',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
  },
  [NotificationType.ThesisUpdate]: {
    icon: 'pi-file-edit',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
  },
  [NotificationType.MentorChange]: {
    icon: 'pi-user',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
  },
  [NotificationType.SemesterDeadline]: {
    icon: 'pi-calendar',
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
  },
  [NotificationType.ChecklistUpdate]: {
    icon: 'pi-check-square',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
  },
  [NotificationType.HODAction]: {
    icon: 'pi-verified',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10',
  },
  [NotificationType.SystemAnnouncement]: {
    icon: 'pi-megaphone',
    color: 'text-gray-600',
    bgColor: 'bg-gray-500/10',
  },
  [NotificationType.FormSubmission]: {
    icon: 'pi-book',
    color: 'text-teal-600',
    bgColor: 'bg-teal-500/10',
  },
};
