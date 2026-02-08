import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { connectDatabase } from './config/database';
import { registerRoutes } from './routes';
import { initializeSocketService } from './services';
import { OverdueService } from './services/OverdueService';
import { ReminderService } from './services/ReminderService';
import { logger } from './utils/logger';

const PORT = parseInt(process.env.PORT || '3000');
const HOST = '0.0.0.0';

async function start() {
  try {
    // Create Fastify instance
    const fastify = Fastify({
      logger: false, // Using Winston instead
      trustProxy: true,
    });

    // Register plugins
    await fastify.register(cors, {
      origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        process.env.FRONTEND_URL || 'http://localhost:5173'
      ],
      credentials: true,
    });

    await fastify.register(helmet, {
      contentSecurityPolicy: false,
    });

    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });

    await fastify.register(rateLimit, {
      max: parseInt(process.env.RATE_LIMIT_MAX || '1000'),
      timeWindow: parseInt(process.env.RATE_LIMIT_TIMEWINDOW || '60000'), // 1 minute
    });

    // Connect to database
    await connectDatabase();

    // Register routes
    await registerRoutes(fastify);

    // Start Fastify server first
    await fastify.listen({ port: PORT, host: HOST });

    // Initialize Socket.io AFTER server is listening, using fastify.server
    initializeSocketService(fastify.server);

    logger.info(`🚀 Server running on http://${HOST}:${PORT}`);
    logger.info(`📚 API Documentation: http://${HOST}:${PORT}/api`);
    logger.info(`🔌 Socket.io ready for real-time connections`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

    // Start background services
    OverdueService.startOverdueChecker();
    ReminderService.startReminderChecker();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  OverdueService.stopOverdueChecker();
  ReminderService.stopReminderChecker();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  OverdueService.stopOverdueChecker();
  ReminderService.stopReminderChecker();
  process.exit(0);
});

// Start the server
start();

// 
