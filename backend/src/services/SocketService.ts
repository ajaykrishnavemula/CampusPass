import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { SocketEvents } from '../types';
import { logger } from '../utils/logger';

export class SocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, string> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: [
          'http://localhost:5173',
          'http://localhost:5174',
          process.env.FRONTEND_URL || 'http://localhost:5173'
        ],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      const token = socket.handshake.query.token as string;
      logger.info(`Socket connected: ${socket.id} with token: ${token ? 'present' : 'missing'}`);

      // Auto-authenticate from query token if present
      if (token) {
        try {
          // Extract user ID from socket handshake or store it when user connects
          const userId = socket.handshake.query.userId as string;
          if (userId) {
            this.userSockets.set(userId, socket.id);
            logger.info(`User ${userId} auto-authenticated with socket ${socket.id}`);
          }
        } catch (error) {
          logger.error('Socket authentication error:', error);
        }
      }

      socket.on('authenticate', (userId: string) => {
        this.userSockets.set(userId, socket.id);
        logger.info(`User ${userId} manually authenticated with socket ${socket.id}`);
      });

      socket.on('disconnect', () => {
        // Remove user from map
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            logger.info(`User ${userId} disconnected`);
            break;
          }
        }
      });
    });
  }

  emitToUser(userId: string, event: SocketEvents, data: any): void {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      logger.debug(`Emitted ${event} to user ${userId}`);
    }
  }

  emitToAll(event: SocketEvents, data: any): void {
    this.io.emit(event, data);
    logger.debug(`Emitted ${event} to all users`);
  }

  emitToRole(userIds: string[], event: SocketEvents, data: any): void {
    userIds.forEach((userId) => {
      this.emitToUser(userId, event, data);
    });
  }

  getIO(): SocketIOServer {
    return this.io;
  }
}

let socketService: SocketService | null = null;

export const initializeSocketService = (server: HTTPServer): SocketService => {
  if (!socketService) {
    socketService = new SocketService(server);
    logger.info('✅ Socket.io service initialized');
  }
  return socketService;
};

export const getSocketService = (): SocketService => {
  if (!socketService) {
    throw new Error('Socket service not initialized');
  }
  return socketService;
};

// 
