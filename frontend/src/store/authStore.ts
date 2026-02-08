import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types';
import { authService } from '../services/authService';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        try {
          // Call backend logout endpoint
          await authService.logout();
        } catch (error) {
          // Log error but still clear local state
          console.error('Logout error:', error);
        } finally {
          // Always clear local state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      updateUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

// 
