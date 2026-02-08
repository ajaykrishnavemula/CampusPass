// User Roles
export enum UserRole {
  STUDENT = 0,
  ADMIN = 1,
  WARDEN = 2,
  SECURITY = 3,
}

// Outpass Status
export enum OutpassStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHECKED_OUT = 'checked_out',
  CHECKED_IN = 'checked_in',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// User Interface
export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  rollNumber?: string;
  department?: string;
  year?: number;
  hostel?: string;
  roomNumber?: string;
  parentPhone?: string;
  profileImage?: string;
  isActive: boolean;
  overdueCount: number;
  adminWarnings: number;
  canCreateOutpass: boolean;
  lastOverdueDate?: string;
  // Restriction and override tracking
  overrideCount: number;
  lastOverrideDate?: string;
  lastOverrideBy?: User | string;
  restrictionStatus: 'none' | 'restricted' | 'overridden';
  // Security and Warden specific fields
  assignedGate?: string;
  assignedHostel?: string;
  assignedHostels?: string[];
  createdAt: string;
  updatedAt: string;
}

// Outpass Interface
export interface Outpass {
  _id: string;
  student: User | string;
  reason: string;
  destination: string;
  fromDate: string;
  toDate: string;
  fromTime?: string;
  toTime?: string;
  purpose: string;
  emergencyContact: string;
  contactNumber?: string;
  parentContact?: string;
  status: OutpassStatus;
  warden?: User | string;
  approvedBy?: User | string;
  wardenRemarks?: string;
  remarks?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  qrCode?: string;
  qrCodeData?: string;
  checkOutTime?: string;
  checkInTime?: string;
  securityCheckOut?: User | string;
  securityCheckIn?: User | string;
  isOverdue: boolean;
  reminder1HourSent?: boolean;
  reminder30MinSent?: boolean;
  reminder5MinSent?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Notification Interface
export interface Notification {
  _id: string;
  user: User | string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  relatedOutpass?: Outpass | string;
  isRead: boolean;
  createdAt: string;
}

// Auth State
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

// Notification State
export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Pagination
export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Dashboard Stats
export interface DashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  checkedOut: number;
  overdue: number;
}

// Form Data Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  rollNumber: string;
  department: string;
  year: number;
  hostel: string;
  roomNumber: string;
  parentPhone: string;
}

export interface CreateOutpassFormData {
  reason: string;
  destination: string;
  fromDate: string;
  toDate: string;
  purpose: string;
  emergencyContact: string;
}

export interface ApproveOutpassFormData {
  remarks?: string;
}

export interface RejectOutpassFormData {
  reason: string;
}

// 
