import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { UserRole } from '../types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: UserRole;
}

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Handle authentication
    socket.on('authenticate', (data: { userId: string; role: UserRole }) => {
      socket.userId = data.userId;
      socket.userRole = data.role;
      
      // Join role-specific room
      const roleRoom = getRoleRoom(data.role);
      socket.join(roleRoom);
      
      // Join user-specific room
      socket.join(`user:${data.userId}`);
      
      logger.info(`User ${data.userId} authenticated with role ${data.role}`);
      socket.emit('authenticated', { success: true });
    });

    // Handle outpass status updates
    socket.on('outpass:status', (data: { outpassId: string; status: string }) => {
      logger.info(`Outpass ${data.outpassId} status changed to ${data.status}`);
      // Broadcast to relevant users
      io.to(`outpass:${data.outpassId}`).emit('outpass:updated', data);
    });

    // Handle new outpass creation
    socket.on('outpass:created', (data: { outpassId: string; studentId: string }) => {
      logger.info(`New outpass created: ${data.outpassId}`);
      // Notify wardens
      io.to(getRoleRoom(UserRole.WARDEN)).emit('outpass:new', data);
    });

    // Handle outpass approval
    socket.on('outpass:approved', (data: { outpassId: string; studentId: string }) => {
      logger.info(`Outpass approved: ${data.outpassId}`);
      // Notify student
      io.to(`user:${data.studentId}`).emit('outpass:approved', data);
      // Notify security
      io.to(getRoleRoom(UserRole.SECURITY)).emit('outpass:approved', data);
    });

    // Handle outpass rejection
    socket.on('outpass:rejected', (data: { outpassId: string; studentId: string; reason: string }) => {
      logger.info(`Outpass rejected: ${data.outpassId}`);
      // Notify student
      io.to(`user:${data.studentId}`).emit('outpass:rejected', data);
    });

    // Handle QR code scan
    socket.on('qr:scanned', (data: { outpassId: string; action: 'checkout' | 'checkin' }) => {
      logger.info(`QR scanned for outpass ${data.outpassId}: ${data.action}`);
      io.to(`outpass:${data.outpassId}`).emit('qr:verified', data);
    });

    // Handle notifications
    socket.on('notification:send', (data: { userId: string; notification: any }) => {
      logger.info(`Sending notification to user ${data.userId}`);
      io.to(`user:${data.userId}`).emit('notification:new', data.notification);
    });

    // Handle typing indicators (for chat if implemented)
    socket.on('typing:start', (data: { room: string }) => {
      socket.to(data.room).emit('typing:user', { userId: socket.userId });
    });

    socket.on('typing:stop', (data: { room: string }) => {
      socket.to(data.room).emit('typing:stop', { userId: socket.userId });
    });

    // Handle join room
    socket.on('room:join', (room: string) => {
      socket.join(room);
      logger.info(`Socket ${socket.id} joined room ${room}`);
    });

    // Handle leave room
    socket.on('room:leave', (room: string) => {
      socket.leave(room);
      logger.info(`Socket ${socket.id} left room ${room}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Broadcast system messages
  const broadcastSystemMessage = (message: string) => {
    io.emit('system:message', { message, timestamp: new Date() });
  };

  // Broadcast to specific role
  const broadcastToRole = (role: UserRole, event: string, data: any) => {
    io.to(getRoleRoom(role)).emit(event, data);
  };

  // Broadcast to specific user
  const broadcastToUser = (userId: string, event: string, data: any) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  return {
    broadcastSystemMessage,
    broadcastToRole,
    broadcastToUser,
  };
};

// Helper function to get role-specific room name
const getRoleRoom = (role: UserRole): string => {
  const roleNames = {
    [UserRole.STUDENT]: 'students',
    [UserRole.ADMIN]: 'admins',
    [UserRole.WARDEN]: 'wardens',
    [UserRole.SECURITY]: 'security',
  };
  return `role:${roleNames[role]}`;
};

// Export socket event emitters for use in services
export const emitOutpassCreated = (io: Server, data: any) => {
  // Notify all wardens (they will filter by hostel on frontend)
  io.to(getRoleRoom(UserRole.WARDEN)).emit('outpass:new', data);
  logger.info(`Emitted outpass:new to wardens for outpass ${data.outpassId}`);
};

// Emit hostel-specific outpass notification
export const emitOutpassCreatedToHostel = (io: Server, hostel: string, data: any) => {
  io.to(`hostel:${hostel}`).emit('outpass:new', data);
  logger.info(`Emitted outpass:new to hostel ${hostel} for outpass ${data.outpassId}`);
};

export const emitOutpassApproved = (io: Server, studentId: string, data: any) => {
  io.to(`user:${studentId}`).emit('outpass:approved', data);
  io.to(getRoleRoom(UserRole.SECURITY)).emit('outpass:approved', data);
};

export const emitOutpassRejected = (io: Server, studentId: string, data: any) => {
  io.to(`user:${studentId}`).emit('outpass:rejected', data);
};

export const emitNotification = (io: Server, userId: string, notification: any) => {
  io.to(`user:${userId}`).emit('notification:new', notification);
};

export const emitQRVerified = (io: Server, outpassId: string, data: any) => {
  io.to(`outpass:${outpassId}`).emit('qr:verified', data);
};

// 