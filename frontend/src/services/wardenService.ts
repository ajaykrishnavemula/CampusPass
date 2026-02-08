import { api } from './api';
import { ApiResponse } from '../types';

interface HostelInfo {
  hostel: string;
  studentCount: number;
}

interface Statistics {
  pending: number;
  approvedToday: number;
  rejected: number;
  activeOutside: number;
  overdue: number;
  totalStudents: number;
}

interface StatusBreakdown {
  pending: number;
  approved: number;
  rejected: number;
  checked_out: number;
  checked_in: number;
  expired: number;
}

interface DailyOutpass {
  date: string;
  count: number;
}

interface Analytics {
  statusBreakdown: StatusBreakdown;
  dailyOutpasses: DailyOutpass[];
}

interface OutpassFilters {
  status?: string;
  purpose?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  showOverdue?: boolean;
  page?: number;
  limit?: number;
}

class WardenService {
  /**
   * Get hostel information for the logged-in warden
   */
  async getHostelInfo(): Promise<ApiResponse<HostelInfo>> {
    const response = await api.get('/warden/hostel-info');
    return response.data;
  }

  /**
   * Get statistics for the warden dashboard
   */
  async getStatistics(): Promise<ApiResponse<Statistics>> {
    const response = await api.get('/warden/statistics');
    return response.data;
  }

  /**
   * Get analytics data (status breakdown + daily outpasses)
   */
  async getAnalytics(): Promise<ApiResponse<Analytics>> {
    const response = await api.get('/warden/analytics');
    return response.data;
  }

  /**
   * Get outpasses with advanced filtering
   */
  async getOutpassesEnhanced(filters: OutpassFilters = {}): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.purpose) params.append('purpose', filters.purpose);
    if (filters.search) params.append('search', filters.search);
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    if (filters.showOverdue) params.append('showOverdue', 'true');
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/warden/outpasses-enhanced?${params.toString()}`);
    return response.data;
  }

  /**
   * Get a single outpass by ID
   */
  async getOutpassById(id: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/warden/outpasses/${id}`);
    return response.data;
  }

  /**
   * Approve an outpass with optional note
   */
  async approveOutpass(id: string, note?: string): Promise<ApiResponse<any>> {
    const response = await api.post(`/warden/outpasses/${id}/approve`, { note });
    return response.data;
  }

  /**
   * Reject an outpass with mandatory reason
   */
  async rejectOutpass(id: string, reason: string): Promise<ApiResponse<any>> {
    if (!reason || reason.trim().length < 10) {
      throw new Error('Rejection reason must be at least 10 characters long');
    }
    const response = await api.post(`/warden/outpasses/${id}/reject`, { reason });
    return response.data;
  }
}

export default new WardenService();

// 