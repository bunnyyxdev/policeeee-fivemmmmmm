'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import Button from './Button';
import Alert from './Alert';

interface NotificationCenterProps {
  userId?: string;
  token?: string;
}

export default function NotificationCenter({ userId, token }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    browserPermission,
    isSupported,
    markAsRead,
    markAllAsRead,
    requestPermission,
  } = useNotifications({ userId, token, autoFetch: true });

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-smooth hover-scale button-press"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col animate-slide-in-top transition-smooth">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                การแจ้งเตือน {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="อ่านทั้งหมด"
                  >
                    <CheckCheck className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Browser Permission Request */}
            {isSupported && browserPermission !== 'granted' && (
              <div className="p-4 border-b border-gray-200">
                <Alert
                  type="info"
                  message="เปิดการแจ้งเตือนผ่าน Browser เพื่อรับการแจ้งเตือนแบบ real-time"
                />
                <Button
                  variant="primary"
                  onClick={requestPermission}
                  className="mt-2 w-full"
                >
                  เปิดการแจ้งเตือน
                </Button>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">กำลังโหลด...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">ไม่มีการแจ้งเตือน</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {/* Unread Notifications */}
                  {unreadNotifications.length > 0 && (
                    <>
                      {unreadNotifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
                            getNotificationColor(notification.type)
                          }`}
                          onClick={() => {
                            markAsRead(notification._id);
                            if (notification.actionUrl) {
                              window.open(notification.actionUrl, '_blank');
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span>{getNotificationIcon(notification.type)}</span>
                                <h4 className="text-sm font-semibold text-gray-900">
                                  {notification.title}
                                </h4>
                                {notification.priority === 'high' && (
                                  <span className="px-2 py-0.5 text-xs font-medium text-red-800 bg-red-100 rounded">
                                    สำคัญ
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notification.createdAt).toLocaleString('th-TH')}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification._id);
                              }}
                              className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Read Notifications */}
                  {readNotifications.length > 0 && unreadNotifications.length > 0 && (
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                      อ่านแล้ว
                    </div>
                  )}

                  {readNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors opacity-60"
                      onClick={() => {
                        if (notification.actionUrl) {
                          window.open(notification.actionUrl, '_blank');
                        }
                      }}
                    >
                      <div className="flex items-start space-x-2">
                        <span>{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleString('th-TH')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
