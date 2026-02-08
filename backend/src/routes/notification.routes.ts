import { FastifyInstance } from 'fastify';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

export async function notificationRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', NotificationController.getNotifications);
  fastify.get('/unread-count', NotificationController.getUnreadCount);
  fastify.patch('/:id/read', NotificationController.markAsRead);
  fastify.patch('/read-all', NotificationController.markAllAsRead);
  fastify.delete('/:id', NotificationController.deleteNotification);
}

// 
