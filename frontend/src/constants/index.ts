/**
 * Application-wide constants
 */

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  ADMIN_LIMIT: 50,
  NOTIFICATION_LIMIT: 20,
  NOTIFICATION_DROPDOWN_LIMIT: 10,
} as const;

// Toast notification durations (in milliseconds)
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 4000,
  LONG: 6000,
} as const;

// User roles
export const USER_ROLES = {
  STUDENT: 0,
  ADMIN: 1,
  WARDEN: 2,
  SECURITY: 3,
} as const;

// Outpass statuses
export const OUTPASS_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CHECKED_OUT: 'checked_out',
  CHECKED_IN: 'checked_in',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  OVERDUE: 'overdue',
} as const;

// Date filter options
export const DATE_FILTERS = {
  ALL: 'all',
  TODAY: 'today',
  LAST_7_DAYS: 'last7days',
  LAST_MONTH: 'lastMonth',
} as const;

// API retry configuration
export const API_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000,
} as const;

// 
