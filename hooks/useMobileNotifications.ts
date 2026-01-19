'use client';

import { useEffect, useState } from 'react';
import { requestNotificationPermission, subscribeToPushNotifications } from '@/app/sw-register';

export function useMobileNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('Notification' in window && 'serviceWorker' in navigator);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return false;
    
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermission('granted');
      const subscription = await subscribeToPushNotifications();
      setIsSubscribed(!!subscription);
      return true;
    }
    return false;
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && typeof window !== 'undefined' && 'Notification' in window) {
      new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        ...options,
      });
    }
  };

  return {
    permission,
    isSupported,
    isSubscribed,
    requestPermission,
    showNotification,
  };
}
