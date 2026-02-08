import { api } from './api';
import { ApiResponse, User, LoginFormData, RegisterFormData } from '../types';

export const authService = {
  async login(data: LoginFormData): Promise<{ user: User; token: string }> {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/login',
      data
    );
    return response.data.data!;
  },

  async register(data: RegisterFormData): Promise<{ user: User; token: string }> {
    const response = await api.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/register',
      data
    );
    return response.data.data!;
  },

  async getProfile(): Promise<User> {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/profile');
    return response.data.data!.user;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<ApiResponse<{ user: User }>>('/auth/profile', data);
    return response.data.data!.user;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getSystemStatus(): Promise<{ isSystemActive: boolean; maxOutpassDuration: number }> {
    const response = await api.get<ApiResponse<{ isSystemActive: boolean; maxOutpassDuration: number }>>('/auth/system-status');
    return response.data.data!;
  },
};

// 
