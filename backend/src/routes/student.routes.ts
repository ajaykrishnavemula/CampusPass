import { FastifyInstance } from 'fastify';
import { StudentController } from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types';

export async function studentRoutes(fastify: FastifyInstance) {
  // All routes require authentication and student role
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', authorize(UserRole.STUDENT));

  // Dashboard
  fastify.get('/dashboard', StudentController.getDashboard);
  fastify.get('/latest-outpass', StudentController.getLatestOutpass);
  fastify.get('/analytics', StudentController.getAnalytics);

  // Outpass management
  fastify.post('/outpasses', StudentController.createOutpass);
  fastify.get('/outpasses', StudentController.getMyOutpasses);
  fastify.get('/outpasses/:id', StudentController.getOutpassById);
  fastify.get('/outpasses/:id/download', StudentController.downloadOutpassPDF);
  fastify.patch('/outpasses/:id/cancel', StudentController.cancelOutpass);
}

// 
