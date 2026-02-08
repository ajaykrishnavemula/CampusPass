import { FastifyInstance } from 'fastify';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/role.middleware';

export async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require authentication and admin role
  const preHandler = [authenticate, adminOnly];

  // Dashboard Statistics
  fastify.get('/statistics/system', { preHandler }, AdminController.getSystemStatistics);
  fastify.get('/statistics/users', { preHandler }, AdminController.getUserStatistics);
  fastify.get('/statistics/outpasses', { preHandler }, AdminController.getOutpassStatistics);
  fastify.get('/statistics/hostels', { preHandler }, AdminController.getHostelStatistics);
  fastify.get('/alerts/critical', { preHandler }, AdminController.getCriticalAlerts);

  // User Management
  fastify.get('/users', { preHandler }, AdminController.getAllUsers);
  fastify.get('/users/:id', { preHandler }, AdminController.getUserById);
  fastify.post('/users', { preHandler }, AdminController.createUser);
  fastify.put('/users/:id', { preHandler }, AdminController.updateUser);
  fastify.delete('/users/:id', { preHandler }, AdminController.deleteUser);
  fastify.patch('/users/:id/status', { preHandler }, AdminController.toggleUserStatus);
  fastify.post('/users/:id/override', { preHandler }, AdminController.overrideRestriction);
  fastify.post('/users/:id/unlock', { preHandler }, AdminController.unlockUser);
  fastify.patch('/users/:id/outpass-permission', { preHandler }, AdminController.toggleOutpassPermission);

  // System Settings
  fastify.get('/settings', { preHandler }, AdminController.getSystemSettings);
  fastify.put('/settings', { preHandler }, AdminController.updateSystemSettings);

  // Outpass Management
  fastify.get('/outpasses', { preHandler }, AdminController.getAllOutpasses);
  fastify.get('/outpasses/:id', { preHandler }, AdminController.getOutpassById);
  fastify.post('/outpasses/:id/override', { preHandler }, AdminController.overrideOutpassStatus);

  // Audit Logs
  fastify.get('/audit-logs', { preHandler }, AdminController.getAuditLogs);
}

// 