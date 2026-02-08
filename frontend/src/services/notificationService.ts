import { api } from './api';
import { ApiResponse, Notification } from '../types';

export const notificationService = {
  async getNotifications(limit: number = 50): Promise<Notification[]> {
    const response = await api.get<ApiResponse<{ notifications: Notification[] }>>(
      `/notifications?limit=${limit}`
    );
    return response.data.data!.notifications;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<ApiResponse<{ count: number }>>(
      '/notifications/unread-count'
    );
    return response.data.data!.count;
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },
};

// 
