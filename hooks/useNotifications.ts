'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getNotificationManager, BrowserNotificationOptions } from '@/lib/notification-browser';
import toast from 'react-hot-toast';
import axios from 'axios';

interface NotificationModel {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  createdAt: string;
}

interface UseNotificationsOptions {
  userId?: string;
  token?: string;
  autoFetch?: boolean;
  interval?: number; // Polling interval in milliseconds
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { userId, token, autoFetch = true, interval = 5000 } = options; // Changed from 30s to 5s for real-time
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  const notificationManager = typeof window !== 'undefined' ? getNotificationManager() : null;

  useEffect(() => {
    if (typeof window !== 'undefined' && notificationManager) {
      setIsSupported(notificationManager.isSupportedBrowser());
      setBrowserPermission(notificationManager.getPermission());
      
      // Request permission on mount
      if (browserPermission === 'default') {
        notificationManager.requestPermission().then((permission) => {
          setBrowserPermission(permission);
        });
      }
    }
  }, []);

  const showBrowserNotification = useCallback(async (options: BrowserNotificationOptions) => {
    if (!notificationManager) return;
    return await notificationManager.showNotification(options);
  }, [notificationManager]);

  const fetchNotifications = useCallback(async () => {
    if (!userId || !token) return;

    try {
      setLoading(true);
      const response = await axios.get('/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit: 50,
          isRead: false,
        },
      });

      const newNotifications = response.data.data || [];
      const newUnreadCount = response.data.unreadCount || 0;

      // Check for new notifications using functional update to avoid dependency on notifications
      setNotifications((prevNotifications) => {
        const currentIds = new Set(prevNotifications.map(n => n._id));
        const trulyNew = newNotifications.filter((n: any) => !currentIds.has(n._id));

        // Show browser notifications for new items
        if (trulyNew.length > 0 && notificationManager && browserPermission === 'granted') {
          // Use setTimeout to avoid blocking state update
          setTimeout(() => {
            trulyNew.forEach(async (notification: any) => {
              if (notificationManager) {
                await notificationManager.showNotification({
                  title: notification.title,
                  body: notification.message,
                  tag: notification._id,
                  data: {
                    notificationId: notification._id,
                    type: notification.type,
                    url: notification.actionUrl,
                  },
                  requireInteraction: notification.priority === 'high',
                  vibrate: notification.priority === 'high' ? [200, 100, 200] : undefined,
                });
              }

              // Show toast notification as well
              const toastOptions: any = {
                duration: notification.priority === 'high' ? 6000 : 4000,
                position: 'top-right',
              };

              switch (notification.type) {
                case 'success':
                  toast.success(notification.message, toastOptions);
                  break;
                case 'warning':
                  toast.error(notification.message, toastOptions);
                  break;
                case 'error':
                  toast.error(notification.message, { ...toastOptions, duration: 8000 });
                  break;
                default:
                  toast(notification.message, toastOptions);
              }
            });
          }, 0);
        }

        return newNotifications;
      });
      
      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, token, notificationManager, browserPermission]);

  // Use ref to store latest fetchNotifications to avoid recreating interval
  const fetchNotificationsRef = useRef(fetchNotifications);
  useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  useEffect(() => {
    if (!autoFetch || !userId || !token) return;

    // Initial fetch
    fetchNotificationsRef.current();

    // Poll for new notifications - use a stable interval
    const pollInterval = setInterval(() => {
      fetchNotificationsRef.current();
    }, interval);

    return () => {
      clearInterval(pollInterval);
    };
  }, [autoFetch, userId, token, interval]);

  const showNotification = useCallback(async (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    options?: Partial<BrowserNotificationOptions>
  ) => {
    // Show browser notification
    if (notificationManager && browserPermission === 'granted') {
      await showBrowserNotification({
        title,
        body: message,
        ...options,
      });
    }

    // Show toast notification
    const toastOptions: any = {
      duration: options?.requireInteraction ? 6000 : 4000,
      position: 'top-right',
    };

    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'warning':
        toast.error(message, toastOptions);
        break;
      case 'error':
        toast.error(message, { ...toastOptions, duration: 8000 });
        break;
      default:
        toast(message, toastOptions);
    }
  }, [notificationManager, browserPermission, showBrowserNotification]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!token) return;

    try {
      await axios.put(
        `/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [token]);

  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    try {
      await axios.put(
        '/api/notifications/read-all',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [token]);

  const requestPermission = useCallback(async () => {
    if (!notificationManager) return 'denied';
    const permission = await notificationManager.requestPermission();
    setBrowserPermission(permission);
    return permission;
  }, [notificationManager]);

  return {
    notifications,
    unreadCount,
    loading,
    browserPermission,
    isSupported,
    showNotification,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    requestPermission,
  };
}
