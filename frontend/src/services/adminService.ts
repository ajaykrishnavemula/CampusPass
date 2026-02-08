import { api } from './api';
import { User } from '../types';
import { PAGINATION } from '../constants';

export interface SystemStatistics {
  totalUsers: number;
  totalOutpasses: number;
  activeOutpasses: number;
  systemStatus: string;
}

export interface UserStatistics {
  total: number;
  byRole: {
    students: number;
    wardens: number;
    security: number;
    admins: number;
  };
  active: number;
  inactive: number;
  restrictedStudents: number;
}

export interface OutpassStatistics {
  total: number;
  byStatus: {
    pending: number;
    approved: number;
    rejected: number;
    active: number;
    completed: number;
    cancelled: number;
    overdue: number;
  };
}

export interface HostelStatistics {
  hostelId: string;
  hostelName: string;
  totalOutpasses: number;
  totalStudents: number;
  averageOutpassesPerStudent: string;
  byStatus: {
    pending: number;
    approved: number;
    rejected: number;
    checkedOut: number;
    checkedIn: number;
    overdue: number;
  };
}

export interface CriticalAlert {
  type: string;
  count: number;
  details: any[];
}

export interface SystemSettings {
  systemStatus: string;
  generalSettings: {
    siteName: string;
    maxOutpassDuration: number;
    defaultOutpassDuration: number;
    qrCodeExpiry: number;
    overdueCheckInterval: number;
  };
  policySettings: {
    overdueThreshold: number;
    autoRestrictionEnabled: boolean;
    restrictionThreshold: number;
    autoRejectionDays: number | null;
  };
  featureToggles: {
    notificationsEnabled: boolean;
    qrCodeEnabled: boolean;
  };
}

export interface AuditLog {
  _id: string;
  adminId: string;
  actionType: string;
  resourceType: string;
  resourceId?: string;
  beforeState?: any;
  afterState?: any;
  reason?: string;
  metadata?: any;
  createdAt: string;
}

class AdminService {
  // Dashboard Statistics
  async getSystemStatistics(): Promise<SystemStatistics> {
    const response = await api.get('/admin/statistics/system');
    return response.data?.data || response.data;
  }

  async getUserStatistics(): Promise<UserStatistics> {
    const response = await api.get('/admin/statistics/users');
    const data = response.data?.data || response.data;
    
    // Transform backend response to match frontend interface
    return {
      total: data.totalUsers || 0,
      byRole: {
        students: data.students || 0,
        wardens: data.wardens || 0,
        security: data.security || 0,
        admins: data.admins || 0,
      },
      active: data.activeUsers || 0,
      inactive: (data.totalUsers || 0) - (data.activeUsers || 0),
      restrictedStudents: data.restrictedStudents || 0,
    };
  }

  async getOutpassStatistics(): Promise<OutpassStatistics> {
    const response = await api.get('/admin/statistics/outpasses');
    return response.data?.data || response.data;
  }

  async getHostelStatistics(): Promise<HostelStatistics[]> {
    const response = await api.get('/admin/statistics/hostels');
    return response.data?.data || response.data;
  }

  async getCriticalAlerts(): Promise<CriticalAlert[]> {
    const response = await api.get('/admin/alerts/critical');
    return response.data?.data || response.data || [];
  }

  // User Management
  async getAllUsers(filters?: {
    role?: string;
    status?: string;
    hostel?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.hostel) params.append('hostel', filters.hostel);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  }

  async createUser(userData: Partial<User>) {
    const response = await api.post('/admin/users', userData);
    return response.data?.data || response.data;
  }

  async updateUser(userId: string, userData: Partial<User>) {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data?.data || response.data;
  }

  async deleteUser(userId: string) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  }

  async toggleUserStatus(userId: string, isActive: boolean) {
    const response = await api.patch(`/admin/users/${userId}/status`, { isActive });
    return response.data?.data || response.data;
  }

  async overrideRestriction(userId: string, reason: string, duration?: number) {
    const response = await api.post(`/admin/users/${userId}/override`, {
      reason,
      duration,
    });
    return response.data?.data || response.data;
  }

  async unlockUser(userId: string) {
    const response = await api.post(`/admin/users/${userId}/unlock`);
    return response.data?.data || response.data;
  }

  async getUserDetails(userId: string) {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data?.data || response.data;
  }

  async toggleOutpassPermission(userId: string, canCreateOutpass: boolean) {
    const response = await api.patch(`/admin/users/${userId}/outpass-permission`, {
      canCreateOutpass,
    });
    return response.data?.data || response.data;
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings> {
    const response = await api.get('/admin/settings');
    return response.data?.data || response.data;
  }

  async updateSystemSettings(settings: Partial<SystemSettings>) {
    const response = await api.put('/admin/settings', settings);
    return response.data?.data || response.data;
  }

  // Outpass Management
  async getAllOutpasses(filters?: {
    status?: string;
    hostel?: string;
    student?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.hostel) params.append('hostel', filters.hostel);
    if (filters?.student) params.append('student', filters.student);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/admin/outpasses?${params.toString()}`);
    return response.data;
  }

  async getOutpassById(outpassId: string) {
    const response = await api.get(`/admin/outpasses/${outpassId}`);
    return response.data;
  }

  async overrideOutpassStatus(outpassId: string, newStatus: string, reason: string) {
    const response = await api.post(`/admin/outpasses/${outpassId}/override`, {
      newStatus,
      reason,
    });
    return response.data?.data || response.data;
  }

  // Audit Logs
  async getAuditLogs(filters?: {
    adminId?: string;
    actionType?: string;
    resourceType?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.adminId) params.append('adminId', filters.adminId);
    if (filters?.actionType) params.append('actionType', filters.actionType);
    if (filters?.resourceType) params.append('resourceType', filters.resourceType);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/admin/audit-logs?${params.toString()}`);
    return response.data;
  }
}

export default new AdminService();

// 
