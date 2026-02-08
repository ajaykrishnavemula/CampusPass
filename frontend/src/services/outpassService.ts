import { api } from './api';
import {
  ApiResponse,
  Outpass,
  CreateOutpassFormData,
  DashboardStats,
  PaginationResult,
} from '../types';

export const outpassService = {
  // Student endpoints
  async createOutpass(data: CreateOutpassFormData): Promise<Outpass> {
    const response = await api.post<ApiResponse<{ outpass: Outpass }>>(
      '/student/outpasses',
      data
    );
    return response.data.data!.outpass;
  },

  async getMyOutpasses(params?: {
    status?: string;
    purpose?: string;
    search?: string;
    dateRange?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginationResult<Outpass>> {
    const response = await api.get<ApiResponse<{ outpasses: Outpass[]; pagination: any }>>(
      '/student/outpasses',
      { params }
    );
    const responseData = response.data.data!;
    return {
      data: responseData.outpasses,
      pagination: responseData.pagination
    };
  },

  async getOutpassById(id: string): Promise<Outpass> {
    const response = await api.get<ApiResponse<{ outpass: Outpass }>>(
      `/student/outpasses/${id}`
    );
    return response.data.data!.outpass;
  },

  async cancelOutpass(id: string): Promise<Outpass> {
    const response = await api.patch<ApiResponse<{ outpass: Outpass }>>(
      `/student/outpasses/${id}/cancel`
    );
    return response.data.data!.outpass;
  },

  async downloadOutpassPDF(id: string): Promise<Blob> {
    const response = await api.get(`/student/outpasses/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async getStudentDashboard(): Promise<DashboardStats> {
    const response = await api.get<ApiResponse<{ stats: DashboardStats }>>(
      '/student/dashboard'
    );
    return response.data.data!.stats;
  },

  async getLatestOutpass(): Promise<Outpass | null> {
    const response = await api.get<ApiResponse<{ outpass: Outpass | null }>>(
      '/student/latest-outpass'
    );
    return response.data.data!.outpass;
  },

  async getAnalytics(): Promise<{
    approved: number;
    pending: number;
    rejected: number;
    overdue: number;
  }> {
    const response = await api.get<ApiResponse<{
      analytics: {
        approved: number;
        pending: number;
        rejected: number;
        overdue: number;
      }
    }>>('/student/analytics');
    
    // Handle response safely
    const analytics = response.data?.data?.analytics;
    if (!analytics) {
      console.error('Invalid analytics response:', response.data);
      return { approved: 0, pending: 0, rejected: 0, overdue: 0 };
    }
    
    return analytics;
  },

  // Security endpoints
  async checkOut(outpassId: string, qrCodeData: string): Promise<Outpass> {
    const response = await api.post<ApiResponse<{ outpass: Outpass }>>(
      '/security/check-out',
      { outpassId, qrCodeData }
    );
    return response.data.data!.outpass;
  },

  async checkIn(outpassId: string): Promise<Outpass> {
    const response = await api.post<ApiResponse<{ outpass: Outpass }>>(
      '/security/check-in',
      { outpassId }
    );
    return response.data.data!.outpass;
  },

  async verifyQRCode(
    outpassId: string,
    qrCodeData: string
  ): Promise<{ valid: boolean; outpass: Outpass | null }> {
    const response = await api.post<
      ApiResponse<{ valid: boolean; outpass: Outpass | null }>
    >('/security/verify-qr', { outpassId, qrCodeData });
    return response.data.data!;
  },

  async getActiveOutpasses(): Promise<Outpass[]> {
    const response = await api.get<ApiResponse<{ outpasses: Outpass[] }>>(
      '/security/active-passes'
    );
    return response.data.data!.outpasses;
  },

  async getSecurityDashboard(): Promise<{
    stats: { active: number; overdue: number };
    recentCheckouts: Outpass[];
  }> {
    const response = await api.get<
      ApiResponse<{
        stats: { active: number; overdue: number };
        recentCheckouts: Outpass[];
      }>
    >('/security/dashboard');
    return response.data.data!;
  },

  async getSecurityOverdue(): Promise<Outpass[]> {
    const response = await api.get<ApiResponse<{ outpasses: Outpass[] }>>(
      '/security/overdue'
    );
    return response.data.data!.outpasses;
  },
};

// 
