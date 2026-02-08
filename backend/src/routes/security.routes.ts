import { FastifyInstance } from 'fastify';
import { SecurityController } from '../controllers/security.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
  validateQRCode,
  rateLimitScan,
  validateCheckOutRequest,
  validateCheckInRequest,
  validateHistoryQuery,
} from '../middleware/security.middleware';
import { UserRole } from '../types';

export async function securityRoutes(fastify: FastifyInstance) {
  // All routes require authentication and security role
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', authorize(UserRole.SECURITY));

  // Statistics & Dashboard
  fastify.get('/statistics', SecurityController.getStatistics);
  fastify.get('/dashboard', SecurityController.getDashboard); // Legacy endpoint

  // QR Code Validation (with rate limiting and validation)
  fastify.post('/validate-qr', {
    preHandler: [rateLimitScan, validateQRCode],
    handler: SecurityController.validateQR,
  });

  // Check-in/Check-out Operations (with validation)
  fastify.post('/check-out', {
    preHandler: [validateCheckOutRequest],
    handler: SecurityController.checkOut,
  });

  fastify.post('/check-in', {
    preHandler: [validateCheckInRequest],
    handler: SecurityController.checkIn,
  });

  // Active Outpasses
  fastify.get('/active-outpasses', SecurityController.getActiveOutpasses);

  // All Outpasses (with filters)
  fastify.get('/outpasses', SecurityController.getAllOutpasses);

  // History & Audit Log (with query validation)
  fastify.get('/history', {
    preHandler: [validateHistoryQuery],
    handler: SecurityController.getHistory,
  });
}

// 
