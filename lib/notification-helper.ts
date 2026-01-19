import connectDB from './mongodb';
import Notification from '@/models/Notification';
import { getNotificationManager } from './notification-browser';

interface CreateNotificationParams {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  recipient: string;
  recipientName?: string;
  relatedTo?: string;
  relatedId?: string;
  priority?: 'low' | 'medium' | 'high';
  actionUrl?: string;
  expiresAt?: Date;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    await connectDB();

    const notification = await (Notification as any).create({
      title: params.title,
      message: params.message,
      type: params.type || 'info',
      recipient: params.recipient,
      recipientName: params.recipientName,
      relatedTo: params.relatedTo,
      relatedId: params.relatedId,
      priority: params.priority || 'medium',
      actionUrl: params.actionUrl,
      expiresAt: params.expiresAt,
    });

    // Backup to Google Sheets
    try {
      const { appendToSheet } = await import('./google-sheets');
      await appendToSheet('Notifications', {
        Title: notification.title,
        Message: notification.message,
        Type: notification.type,
        Recipient: params.recipientName || params.recipient,
        Priority: notification.priority,
        Date: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to backup notification to Google Sheets:', error);
    }

    // Send Discord notification
    try {
      const { sendDiscordNotification } = await import('./discord-webhook');
      const colors: Record<'info' | 'success' | 'warning' | 'error', number> = {
        info: 0x3498db,
        success: 0x2ecc71,
        warning: 0xf39c12,
        error: 0xe74c3c,
      };
      const notificationType = notification.type as 'info' | 'success' | 'warning' | 'error';
      await sendDiscordNotification(
        notification.title,
        notification.message,
        colors[notificationType] || colors.info,
        'notifications'
      );
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

export async function createBulkNotifications(
  recipients: string[],
  params: Omit<CreateNotificationParams, 'recipient'>
) {
  try {
    await connectDB();

    const notifications = recipients.map((recipient) => ({
      title: params.title,
      message: params.message,
      type: params.type || 'info',
      recipient,
      recipientName: params.recipientName,
      relatedTo: params.relatedTo,
      relatedId: params.relatedId,
      priority: params.priority || 'medium',
      actionUrl: params.actionUrl,
      expiresAt: params.expiresAt,
    }));

    const created = await (Notification as any).insertMany(notifications);

    // Send Discord notification for bulk
    try {
      const { sendDiscordNotification } = await import('./discord-webhook');
      await sendDiscordNotification(
        `${params.title} (${recipients.length} recipients)`,
        params.message,
        0x3498db,
        'notifications'
      );
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }

    return created;
  } catch (error) {
    console.error('Failed to create bulk notifications:', error);
    throw error;
  }
}
