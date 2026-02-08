import { FastifyRequest } from 'fastify';

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
  OVERDUE = 'overdue',
}

// User Interface
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
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
  lastOverdueDate?: Date;
  // Admin-specific fields for student restriction management
  overrideCount: number;
  lastOverrideDate?: Date;
  lastOverrideBy?: string | IUser;
  restrictionStatus: 'none' | 'restricted' | 'overridden';
  // Security personnel fields
  assignedGate?: string;
  assignedHostel?: string;
  // Warden fields - multiple hostel assignment
  assignedHostels?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Outpass Interface
export interface IOutpass {
  _id: string;
  student: string | IUser;
  reason: string;
  destination: string;
  fromDate: Date;
  toDate: Date;
  fromTime?: string;
  toTime?: string;
  purpose: string;
  emergencyContact: string;
  contactNumber?: string;
  status: OutpassStatus;
  warden?: string | IUser;
  wardenRemarks?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  qrCode?: string;
  qrCodeData?: string;
  qrCodeExpiry?: Date;
  checkOutTime?: Date;
  checkInTime?: Date;
  securityCheckOut?: string | IUser;
  securityCheckIn?: string | IUser;
  isOverdue: boolean;
  reminder1HourSent?: boolean;
  reminder30MinSent?: boolean;
  reminder5MinSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Interface
export interface INotification {
  _id: string;
  user: string | IUser;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  relatedOutpass?: string | IOutpass;
  isRead: boolean;
  createdAt: Date;
}

// Auth Request Interface
export interface AuthRequest extends Omit<FastifyRequest, 'user'> {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// Login Request Body
export interface LoginBody {
  email: string;
  password: string;
}

// Register Request Body
export interface RegisterBody {
  name: string;
  email: string;
  password: string;
  phone: string;
  rollNumber: string;
  department: string;
  year: number;
  hostel: string;
  roomNumber: string;
  parentPhone: string;
}

// Create Outpass Request Body
export interface CreateOutpassBody {
  reason: string;
  destination: string;
  fromDate: string;
  toDate: string;
  purpose: string;
  emergencyContact: string;
}

// Approve/Reject Outpass Body
export interface ApproveOutpassBody {
  remarks?: string;
}

export interface RejectOutpassBody {
  reason: string;
}

// Check-in/Check-out Body
export interface CheckOutBody {
  outpassId: string;
  qrCodeData: string;
}

export interface CheckInBody {
  outpassId: string;
}

// Query Filters
export interface OutpassFilters {
  status?: OutpassStatus;
  purpose?: string;
  search?: string;
  dateRange?: string;
  fromDate?: string;
  toDate?: string;
  student?: string;
  page?: number;
  limit?: number;
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

// JWT Payload
export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
}

// Email Options
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

// Socket Events
export enum SocketEvents {
  NOTIFICATION = 'notification',
  OUTPASS_CREATED = 'outpass:created',
  OUTPASS_APPROVED = 'outpass:approved',
  OUTPASS_REJECTED = 'outpass:rejected',
  OUTPASS_CHECKED_OUT = 'outpass:checked-out',
  OUTPASS_CHECKED_IN = 'outpass:checked-in',
  OUTPASS_OVERDUE = 'outpass:overdue',
  // Security-specific events
  SECURITY_STATISTICS_UPDATE = 'security:statistics-update',
  SECURITY_INVALID_SCAN = 'security:invalid-scan',
  SECURITY_ACTIVE_OUTPASSES_UPDATE = 'security:active-outpasses-update',
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
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

// 
