'use client';

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  sound?: string;
  vibrate?: number[];
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  timestamp?: number;
  dir?: 'auto' | 'ltr' | 'rtl';
  lang?: string;
}

// Extended NotificationOptions type that includes browser-supported properties
// not present in TypeScript's built-in NotificationOptions type
interface ExtendedNotificationOptions extends NotificationOptions {
  image?: string;
  timestamp?: number;
  actions?: NotificationAction[];
  vibrate?: number[];
}

export class BrowserNotificationManager {
  private permission: NotificationPermission = 'default';
  private isSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isSupported = 'Notification' in window;
      this.permission = this.isSupported ? Notification.permission : 'denied';
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn('Browser notifications are not supported');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  async showNotification(options: BrowserNotificationOptions): Promise<Notification | null> {
    if (!this.isSupported) {
      console.warn('Browser notifications are not supported');
      return null;
    }

    if (this.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
      }
    }

    try {
      // Build notification options object with all supported properties
      // Note: TypeScript's NotificationOptions type is incomplete, so we use ExtendedNotificationOptions
      const notificationOptions: ExtendedNotificationOptions = {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        data: options.data || {},
        timestamp: options.timestamp || Date.now(),
        dir: options.dir || 'auto',
        lang: options.lang || 'th',
        vibrate: options.vibrate,
        image: options.image,
        actions: options.actions && options.actions.length > 0 ? options.actions : undefined,
      };

      const notification = new Notification(options.title, notificationOptions);

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      // Handle click event
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        const url = options.data && typeof options.data === 'object' && 'url' in options.data 
          ? String(options.data.url) 
          : null;
        if (url) {
          window.open(url, '_blank');
        }
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  }

  getPermission(): NotificationPermission {
    return this.permission;
  }

  isSupportedBrowser(): boolean {
    return this.isSupported;
  }
}

// Singleton instance
let notificationManager: BrowserNotificationManager | null = null;

export function getNotificationManager(): BrowserNotificationManager {
  if (typeof window === 'undefined') {
    throw new Error('BrowserNotificationManager can only be used in browser');
  }

  if (!notificationManager) {
    notificationManager = new BrowserNotificationManager();
  }

  return notificationManager;
}
