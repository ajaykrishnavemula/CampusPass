import { Notification } from '../models';
import { INotification, SocketEvents } from '../types';
import { getSocketService } from './SocketService';
import { logger } from '../utils/logger';

export class NotificationService {
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error',
    relatedOutpass?: string
  ): Promise<INotification> {
    try {
      const notification = await Notification.create({
        user: userId,
        title,
        message,
        type,
        relatedOutpass,
      });

      // Emit real-time notification via Socket.io
      try {
        const socketService = getSocketService();
        socketService.emitToUser(userId, SocketEvents.NOTIFICATION, {
          notification: notification.toJSON(),
        });
      } catch (error) {
        logger.warn('Socket service not available for notification');
      }

      return notification.toJSON() as unknown as INotification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  static async getNotifications(
    userId: string,
    limit: number = 50
  ): Promise<INotification[]> {
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('relatedOutpass')
      .lean();

    return notifications as unknown as INotification[];
  }

  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true }
    );
    return result !== null;
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  }

  static async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId,
    });
    return result !== null;
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ user: userId, isRead: false });
  }

  // Notification templates
  static async notifyOutpassCreated(
    wardenId: string,
    studentName: string,
    outpassId: string
  ): Promise<void> {
    await this.createNotification(
      wardenId,
      'New Outpass Request',
      `${studentName} has submitted a new outpass request`,
      'info',
      outpassId
    );
  }

  static async notifyOutpassApproved(
    studentId: string,
    outpassId: string
  ): Promise<void> {
    await this.createNotification(
      studentId,
      'Outpass Approved',
      'Your outpass request has been approved',
      'success',
      outpassId
    );
  }

  static async notifyOutpassRejected(
    studentId: string,
    reason: string,
    outpassId: string
  ): Promise<void> {
    await this.createNotification(
      studentId,
      'Outpass Rejected',
      `Your outpass request has been rejected. Reason: ${reason}`,
      'error',
      outpassId
    );
  }

  static async notifyCheckOut(
    studentId: string,
    outpassId: string
  ): Promise<void> {
    await this.createNotification(
      studentId,
      'Checked Out',
      'You have been checked out successfully',
      'info',
      outpassId
    );
  }

  static async notifyCheckIn(
    studentId: string,
    outpassId: string
  ): Promise<void> {
    await this.createNotification(
      studentId,
      'Checked In',
      'You have been checked in successfully',
      'success',
      outpassId
    );
  }

  static async notifyOverdue(
    studentId: string,
    outpassId: string
  ): Promise<void> {
    await this.createNotification(
      studentId,
      'Outpass Overdue',
      'Your outpass has expired. Please return to campus immediately',
      'warning',
      outpassId
    );
  }
}

// 
