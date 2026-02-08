import { FastifyInstance } from 'fastify';
import { WardenController } from '../controllers/warden.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types';

export async function wardenRoutes(fastify: FastifyInstance) {
  // All routes require authentication and warden role
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', authorize(UserRole.WARDEN));

  // Dashboard & Info
  fastify.get('/hostel-info', WardenController.getHostelInfo);
  fastify.get('/statistics', WardenController.getStatistics);
  fastify.get('/analytics', WardenController.getAnalytics);

  // Outpass management
  fastify.get('/outpasses-enhanced', WardenController.getOutpassesEnhanced);
  fastify.get('/outpasses/:id', WardenController.getOutpassById);
  fastify.post('/outpasses/:id/approve', WardenController.approveOutpassNew);
  fastify.post('/outpasses/:id/reject', WardenController.rejectOutpassNew);
}

// 
