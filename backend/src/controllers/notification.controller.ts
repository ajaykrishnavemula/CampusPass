import { FastifyRequest, FastifyReply } from 'fastify';
import { NotificationService } from '../services';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';

export class NotificationController {
  static async getNotifications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as AuthRequest).user!.id;
      const notifications = await NotificationService.getNotifications(userId);

      return reply.send({
        success: true,
        data: { notifications },
      });
    } catch (error: any) {
      logger.error('Get notifications error:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch notifications',
      });
    }
  }

  static async markAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = (request.params as { id: string });
      const userId = (request as AuthRequest).user!.id;
      
      // Verify ownership before marking as read
      const success = await NotificationService.markAsRead(id, userId);
      
      if (!success) {
        return reply.status(404).send({
          success: false,
          message: 'Notification not found or access denied',
        });
      }

      return reply.send({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error: any) {
      logger.error('Mark as read error:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to mark notification as read',
      });
    }
  }

  static async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as AuthRequest).user!.id;
      await NotificationService.markAllAsRead(userId);

      return reply.send({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error: any) {
      logger.error('Mark all as read error:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to mark all notifications as read',
      });
    }
  }

  static async deleteNotification(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = (request.params as { id: string });
      const userId = (request as AuthRequest).user!.id;
      
      // Verify ownership before deleting
      const success = await NotificationService.deleteNotification(id, userId);
      
      if (!success) {
        return reply.status(404).send({
          success: false,
          message: 'Notification not found or access denied',
        });
      }

      return reply.send({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete notification error:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to delete notification',
      });
    }
  }

  static async getUnreadCount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as AuthRequest).user!.id;
      const count = await NotificationService.getUnreadCount(userId);

      return reply.send({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      logger.error('Get unread count error:', error);
      return reply.status(500).send({
        success: false,
        message: error.message || 'Failed to fetch unread count',
      });
    }
  }
}

// 
