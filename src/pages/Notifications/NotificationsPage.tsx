import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationFilters from '../../components/notifications/NotificationFilters';
import NotificationItem from '../../components/notifications/NotificationItem';
import Pagination from '../../components/notifications/Pagination';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
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
  } = useNotifications();

  const unreadOnPage = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-white">
      {/* Header Section */}
      <header className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-orange-100 shadow-sm shadow-orange-100/40">
        <div className="px-6 py-5 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-2">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <button onClick={() => navigate('/home')} className="text-gray-500 hover:text-orange-600 transition-colors">
                Home
              </button>
              <i className="pi pi-chevron-right text-xs text-gray-400"></i>
              <span className="font-medium text-orange-600">Notifications</span>
            </nav>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
              <p className="text-sm text-gray-500 mt-1">
                {totalCount} total{totalCount !== 1 ? 's' : ''}{unreadOnPage > 0 ? ` • ${unreadOnPage} unread on this page` : ''}
              </p>
            </div>

            <button
              onClick={markAllAsRead}
              disabled={isLoading || unreadOnPage === 0}
              className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="pi pi-check-square"></i>
              <span>Mark all as read</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="max-w-2xl mx-auto w-full px-6">
          <NotificationFilters activeFilter={filter} onFilterChange={changeFilter} />
        </div>
      </header>

      {/* Notification List */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-3 px-6">
        {isLoading ? (
          // Loading Skeletons
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex gap-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm animate-pulse"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
              <i className="pi pi-bell text-4xl text-orange-400"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500 text-center max-w-sm">
              {filter === 'unread'
                ? 'You have no unread notifications at the moment.'
                : 'You don\'t have any notifications yet.'}
            </p>
          </div>
        ) : (
          // Notification Items
          <>
            <div className="space-y-3 rounded-2xl p-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.notificationId}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                  isProcessing={processingIds.has(notification.notificationId)}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={changePage} />

            {/* Total Count */}
            {totalCount > 0 && (
              <div className="text-center text-sm text-gray-500 pb-4">
                Showing {notifications.length} of {totalCount} notification{totalCount !== 1 ? 's' : ''}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;
