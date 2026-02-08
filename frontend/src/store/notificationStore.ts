import { create } from 'zustand';
import { NotificationState, Notification } from '../types';

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  setNotifications: (notifications: Notification[]) => {
    set({ notifications });
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },
}));

// 
