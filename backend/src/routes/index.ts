import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes';
import { adminRoutes } from './admin.routes';
import { studentRoutes } from './student.routes';
import { wardenRoutes } from './warden.routes';
import { securityRoutes } from './security.routes';
import { notificationRoutes } from './notification.routes';
import { hostelRoutes } from './hostel.routes';

export async function registerRoutes(fastify: FastifyInstance) {
  // API prefix
  fastify.register(
    async (instance) => {
      // Auth routes
      instance.register(authRoutes, { prefix: '/auth' });

      // Admin routes
      instance.register(adminRoutes, { prefix: '/admin' });

      // Student routes
      instance.register(studentRoutes, { prefix: '/student' });

      // Warden routes
      instance.register(wardenRoutes, { prefix: '/warden' });

      // Security routes
      instance.register(securityRoutes, { prefix: '/security' });

      // Notification routes
      instance.register(notificationRoutes, { prefix: '/notifications' });

      // Hostel routes
      instance.register(hostelRoutes, { prefix: '/api' });
    },
    { prefix: '/api' }
  );

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}

// 
