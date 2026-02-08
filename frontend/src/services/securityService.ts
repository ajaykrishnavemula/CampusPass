import { api } from './api';

// Types
export interface SecurityStatistics {
  activeOutside: number;
  checkedInToday: number;
  invalidScans: number;
  overdue: number;
}

export interface QRValidationResult {
  valid: boolean;
  state: 'VALID_CHECK_OUT' | 'VALID_CHECK_IN' | 'WARNING_OVERDUE' | 'INVALID';
  outpass?: {
    _id: string;
    student: {
      _id: string;
      name: string;
      rollNumber: string;
      hostel?: string;
    };
    destination: string;
    fromDate: string;
    toDate: string;
    checkOutTime?: string;
    isOverdue?: boolean;
    minutesOverdue?: number;
  };
  reason?: string;
  message: string;
}

export interface ActiveOutpass {
  _id: string;
  student: {
    _id: string;
    name: string;
    rollNumber: string;
    hostel?: string;
  };
  destination: string;
  fromDate: string;
  toDate: string;
  checkOutTime: string;
  isOverdue: boolean;
  minutesOverdue?: number;
}

export interface SecurityHistoryFilters {
  startDate?: string;
  endDate?: string;
  hostel?: string;
  studentName?: string;
  rollNumber?: string;
  action?: 'check_out' | 'check_in' | 'invalid_scan';
  result?: 'success' | 'failed' | 'overdue';
  page?: number;
  limit?: number;
}

export interface SecurityHistoryRecord {
  _id: string;
  outpass?: {
    _id: string;
    destination: string;
  };
  student: {
    _id: string;
    name: string;
    rollNumber: string;
    hostel?: string;
  };
  security: {
    _id: string;
    name: string;
  };
  action: 'check_out' | 'check_in' | 'invalid_scan';
  timestamp: string;
  result: 'success' | 'failed' | 'overdue';
  reason?: string;
  qrCode?: string;
  metadata?: {
    checkOutTime?: string;
    checkInTime?: string;
    minutesOverdue?: number;
    invalidReason?: string;
  };
}

export interface SecurityHistoryResponse {
  logs: SecurityHistoryRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface OutpassFilters {
  status?: string | string[];
  hostel?: string;
  studentName?: string;
  rollNumber?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface Outpass {
  _id: string;
  student: {
    _id: string;
    name: string;
    rollNumber: string;
    phone?: string;
    hostel?: string;
  };
  warden?: {
    _id: string;
    name: string;
  };
  destination: string;
  purpose: string;
  fromDate: string;
  toDate: string;
  status: string;
  checkOutTime?: string;
  checkInTime?: string;
  securityCheckOut?: {
    _id: string;
    name: string;
  };
  securityCheckIn?: {
    _id: string;
    name: string;
  };
  isOverdue?: boolean;
  overdueMinutes?: number;
  createdAt: string;
}

export interface AllOutpassesResponse {
  outpasses: Outpass[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CheckOutResponse {
  success: boolean;
  message: string;
  outpass: ActiveOutpass;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  outpass: {
    _id: string;
    student: {
      _id: string;
      name: string;
      rollNumber: string;
    };
    checkInTime: string;
    isOverdue: boolean;
    minutesOverdue?: number;
  };
}

class SecurityService {
  /**
   * Get dashboard statistics
   * Returns: activeOutside, checkedInToday, invalidScans, overdue
   */
  async getStatistics(): Promise<SecurityStatistics> {
    try {
      const response = await api.get<{ success: boolean; statistics: SecurityStatistics }>('/security/statistics');
      return response.data.statistics;
    } catch (error: any) {
      console.error('Failed to fetch security statistics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch statistics');
    }
  }

  /**
   * Validate QR code
   * Returns validation result with 4 possible states
   */
  async validateQR(qrCode: string): Promise<QRValidationResult> {
    try {
      const response = await api.post<{ success: boolean; data: QRValidationResult }>('/security/validate-qr', { qrCode });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to validate QR code:', error);
      throw error; // Throw error so ScanQR page can handle it properly
    }
  }

  /**
   * Check out a student
   */
  async checkOut(outpassId: string): Promise<CheckOutResponse> {
    try {
      const response = await api.post<CheckOutResponse>('/security/check-out', { outpassId });
      return response.data;
    } catch (error: any) {
      console.error('Failed to check out:', error);
      throw new Error(error.response?.data?.message || 'Failed to check out student');
    }
  }

  /**
   * Check in a student
   */
  async checkIn(outpassId: string): Promise<CheckInResponse> {
    try {
      const response = await api.post<CheckInResponse>('/security/check-in', { outpassId });
      return response.data;
    } catch (error: any) {
      console.error('Failed to check in:', error);
      throw new Error(error.response?.data?.message || 'Failed to check in student');
    }
  }

  /**
   * Get currently checked-out students (active outpasses)
   */
  async getActiveOutpasses(): Promise<ActiveOutpass[]> {
    try {
      const response = await api.get<{ success: boolean; outpasses: ActiveOutpass[] }>('/security/active-outpasses');
      return response.data.outpasses;
    } catch (error: any) {
      console.error('Failed to fetch active outpasses:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch active outpasses');
    }
  }

  /**
   * Get all outpasses with filters and pagination
   * Shows approved (ready to check out) and checked_out (currently outside) by default
   */
  async getAllOutpasses(filters: OutpassFilters = {}): Promise<AllOutpassesResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          params.append('status', filters.status.join(','));
        } else {
          params.append('status', filters.status);
        }
      }
      if (filters.hostel) params.append('hostel', filters.hostel);
      if (filters.studentName) params.append('studentName', filters.studentName);
      if (filters.rollNumber) params.append('rollNumber', filters.rollNumber);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await api.get<{ success: boolean; data: AllOutpassesResponse }>(`/security/outpasses?${params.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch outpasses:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch outpasses');
    }
  }

  /**
   * Get security history with filters and pagination
   */
  async getHistory(filters: SecurityHistoryFilters = {}): Promise<SecurityHistoryResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.hostel) params.append('hostel', filters.hostel);
      if (filters.studentName) params.append('studentName', filters.studentName);
      if (filters.rollNumber) params.append('rollNumber', filters.rollNumber);
      if (filters.action) params.append('action', filters.action);
      if (filters.result) params.append('result', filters.result);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await api.get<{ success: boolean; data: SecurityHistoryResponse }>(`/security/history?${params.toString()}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch security history:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch history');
    }
  }

  /**
   * Export history to CSV
   */
  async exportHistoryCSV(filters: SecurityHistoryFilters = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.hostel) params.append('hostel', filters.hostel);
      if (filters.studentName) params.append('studentName', filters.studentName);
      if (filters.rollNumber) params.append('rollNumber', filters.rollNumber);
      if (filters.action) params.append('action', filters.action);
      if (filters.result) params.append('result', filters.result);

      const response = await api.get(`/security/history/export/csv?${params.toString()}`, {
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to export history:', error);
      throw new Error(error.response?.data?.message || 'Failed to export history');
    }
  }

  /**
   * Retry failed request with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on 4xx errors (client errors)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Validate QR with retry logic
   */
  async validateQRWithRetry(qrCode: string): Promise<QRValidationResult> {
    return this.retryRequest(() => this.validateQR(qrCode));
  }

  /**
   * Check if network is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }
}

export const securityService = new SecurityService();

// 