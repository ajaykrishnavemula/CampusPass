import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

export async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/register', AuthController.register);
  fastify.post('/login', AuthController.login);
  fastify.get('/system-status', AuthController.getSystemStatus);

  // Protected routes
  fastify.get('/profile', { preHandler: [authenticate] }, AuthController.getProfile);
  fastify.put('/profile', { preHandler: [authenticate] }, AuthController.updateProfile);
  fastify.post('/logout', { preHandler: [authenticate] }, AuthController.logout);
  fastify.post(
    '/change-password',
    { preHandler: [authenticate] },
    AuthController.changePassword
  );
}

// 
