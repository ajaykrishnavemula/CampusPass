import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { Notification, UserRole } from '../types';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private securityEventHandlers: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  connect(token: string, userId: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      query: {
        token,
        userId
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      console.warn(`Socket connection error (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}):`, error.message);
      
      // Stop trying after max attempts to prevent console spam
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('Max reconnection attempts reached. Real-time features disabled.');
        this.socket?.close();
      }
    });

    this.socket.on('notification', (data: { notification: Notification } | any) => {
      // Safe data extraction with fallback
      const notification = data?.notification || data;
      
      // Validate notification object
      if (!notification || typeof notification !== 'object') {
        console.warn('Invalid notification data received:', data);
        return;
      }
      const userRole = useAuthStore.getState().user?.role;
      
      // Filter notifications for security personnel - only system alerts
      if (userRole === UserRole.SECURITY) {
        // Only show system-level notifications, not student/approval related
        if (notification.type === 'error' || notification.message.toLowerCase().includes('system')) {
          useNotificationStore.getState().addNotification(notification);
          toast.error(notification.message, { duration: 4000 });
        }
        return;
      }
      
      // For other roles, show all notifications
      useNotificationStore.getState().addNotification(notification);
      
      const toastType = notification.type === 'error' ? 'error' :
                       notification.type === 'success' ? 'success' :
                       notification.type === 'warning' ? 'error' : 'success';
      
      toast[toastType](notification.message, {
        duration: 4000,
      });
    });

    // Security-specific events
    this.socket.on('security:statistics-update', (data: any) => {
      this.securityEventHandlers.get('statistics-update')?.(data);
    });

    this.socket.on('security:active-outpasses-update', (data: any) => {
      this.securityEventHandlers.get('active-outpasses-update')?.(data);
    });

    this.socket.on('security:invalid-scan', (data: any) => {
      const userRole = useAuthStore.getState().user?.role;
      if (userRole === UserRole.SECURITY) {
        toast.error(`Invalid QR scan: ${data.reason}`, {
          duration: 5000,
          icon: '⚠️',
        });
      }
      this.securityEventHandlers.get('invalid-scan')?.(data);
    });

    // Warden-specific: New outpass request in their hostel
    this.socket.on('outpass:new', (data: any) => {
      const userRole = useAuthStore.getState().user?.role;
      if (userRole !== UserRole.SECURITY) {
        toast.success(`New outpass request from ${data.studentName || 'a student'}`, {
          duration: 5000,
        });
      }
    });

    this.socket.on('outpass:created', () => {
      const userRole = useAuthStore.getState().user?.role;
      if (userRole !== UserRole.SECURITY) {
        toast.success('New outpass request received');
      }
    });

    this.socket.on('outpass:approved', () => {
      const userRole = useAuthStore.getState().user?.role;
      if (userRole !== UserRole.SECURITY) {
        toast.success('Your outpass has been approved!');
      }
    });

    this.socket.on('outpass:rejected', () => {
      const userRole = useAuthStore.getState().user?.role;
      if (userRole !== UserRole.SECURITY) {
        toast.error('Your outpass has been rejected');
      }
    });

    this.socket.on('outpass:checked_out', () => {
      const userRole = useAuthStore.getState().user?.role;
      if (userRole !== UserRole.SECURITY) {
        toast.success('Successfully checked out');
      }
    });

    this.socket.on('outpass:checked_in', () => {
      const userRole = useAuthStore.getState().user?.role;
      if (userRole !== UserRole.SECURITY) {
        toast.success('Successfully checked in');
      }
    });

    this.socket.on('outpass:cancelled', () => {
      const userRole = useAuthStore.getState().user?.role;
      if (userRole !== UserRole.SECURITY) {
        toast('Outpass request has been cancelled', {
          icon: 'ℹ️',
        });
      }
    });

    this.socket.on('outpass:overdue', () => {
      const userRole = useAuthStore.getState().user?.role;
      if (userRole !== UserRole.SECURITY) {
        toast.error('Your outpass is overdue! Please return immediately.');
      }
    });
  }

  // Register handler for security events
  onSecurityEvent(event: 'statistics-update' | 'active-outpasses-update' | 'invalid-scan', handler: (data: any) => void) {
    this.securityEventHandlers.set(event, handler);
  }

  // Unregister handler for security events
  offSecurityEvent(event: 'statistics-update' | 'active-outpasses-update' | 'invalid-scan') {
    this.securityEventHandlers.delete(event);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();

// 
