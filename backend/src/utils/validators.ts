/**
 * Validation utility functions
 */

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/; // Indian phone number format
  return phoneRegex.test(phone);
};

export const validateRollNumber = (rollNumber: string): boolean => {
  // Format: 2 letters + 2-4 digits (e.g., CS2101, ME101)
  const rollNumberRegex = /^[A-Z]{2}\d{2,4}$/i;
  return rollNumberRegex.test(rollNumber);
};

export const validateDate = (date: string): boolean => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

export const validateTime = (time: string): boolean => {
  // Format: HH:MM (24-hour format)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
};

export const validateObjectId = (id: string): boolean => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateFileSize = (size: number, maxSize: number = 5 * 1024 * 1024): boolean => {
  return size <= maxSize; // Default 5MB
};

export const validateFileType = (mimetype: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimetype);
};

export const isValidDateRange = (fromDate: Date, toDate: Date): boolean => {
  return toDate >= fromDate;
};

export const isFutureDate = (date: Date): boolean => {
  return date > new Date();
};

export const isPastDate = (date: Date): boolean => {
  return date < new Date();
};

// 
/**
 * Admin-specific validators
 */

import { UserRole } from '../types';

export const validateUserCreation = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password || !validatePassword(data.password)) {
    errors.push('Password must be at least 6 characters');
  }

  if (!data.role || !Object.values(UserRole).includes(data.role)) {
    errors.push('Valid role is required (STUDENT, WARDEN, SECURITY, ADMIN)');
  }

  // Role-specific validations
  if (data.role === UserRole.STUDENT) {
    if (!data.rollNumber || !validateRollNumber(data.rollNumber)) {
      errors.push('Valid roll number is required for students');
    }
    if (!data.hostel || !validateObjectId(data.hostel)) {
      errors.push('Valid hostel ID is required for students');
    }
  }

  if (data.role === UserRole.WARDEN) {
    if (!data.assignedHostels || !Array.isArray(data.assignedHostels) || data.assignedHostels.length === 0) {
      errors.push('At least one hostel must be assigned to wardens');
    }
    if (data.assignedHostels && !data.assignedHostels.every((id: string) => validateObjectId(id))) {
      errors.push('All assigned hostel IDs must be valid');
    }
  }

  // Optional phone validation
  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Invalid phone number format');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateUserUpdate = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // All fields are optional for update, but if provided must be valid
  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
    errors.push('Name must be a non-empty string');
  }

  if (data.email !== undefined && !validateEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.phone !== undefined && data.phone !== null && !validatePhone(data.phone)) {
    errors.push('Invalid phone number format');
  }

  if (data.role !== undefined && !Object.values(UserRole).includes(data.role)) {
    errors.push('Invalid role');
  }

  if (data.rollNumber !== undefined && !validateRollNumber(data.rollNumber)) {
    errors.push('Invalid roll number format');
  }

  if (data.hostel !== undefined && !validateObjectId(data.hostel)) {
    errors.push('Invalid hostel ID');
  }

  if (data.assignedHostels !== undefined) {
    if (!Array.isArray(data.assignedHostels)) {
      errors.push('Assigned hostels must be an array');
    } else if (!data.assignedHostels.every((id: string) => validateObjectId(id))) {
      errors.push('All assigned hostel IDs must be valid');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateSystemSettings = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // System status
  if (data.systemStatus !== undefined) {
    if (!['ACTIVE', 'INACTIVE', 'MAINTENANCE'].includes(data.systemStatus)) {
      errors.push('System status must be ACTIVE, INACTIVE, or MAINTENANCE');
    }
  }

  // General settings
  if (data.generalSettings) {
    const { siteName, maxOutpassDuration, defaultOutpassDuration } = data.generalSettings;

    if (siteName !== undefined && (typeof siteName !== 'string' || siteName.trim().length === 0)) {
      errors.push('Site name must be a non-empty string');
    }

    if (maxOutpassDuration !== undefined) {
      if (typeof maxOutpassDuration !== 'number' || maxOutpassDuration < 1 || maxOutpassDuration > 168) {
        errors.push('Max outpass duration must be between 1 and 168 hours');
      }
    }

    if (defaultOutpassDuration !== undefined) {
      if (typeof defaultOutpassDuration !== 'number' || defaultOutpassDuration < 1) {
        errors.push('Default outpass duration must be at least 1 hour');
      }
    }

    if (maxOutpassDuration && defaultOutpassDuration && defaultOutpassDuration > maxOutpassDuration) {
      errors.push('Default duration cannot exceed max duration');
    }
  }

  // Policy settings
  if (data.policySettings) {
    const { overdueThreshold, autoRestrictionEnabled, restrictionThreshold } = data.policySettings;

    if (overdueThreshold !== undefined) {
      if (typeof overdueThreshold !== 'number' || overdueThreshold < 1 || overdueThreshold > 10) {
        errors.push('Overdue threshold must be between 1 and 10');
      }
    }

    if (autoRestrictionEnabled !== undefined && typeof autoRestrictionEnabled !== 'boolean') {
      errors.push('Auto restriction enabled must be a boolean');
    }

    if (restrictionThreshold !== undefined) {
      if (typeof restrictionThreshold !== 'number' || restrictionThreshold < 1 || restrictionThreshold > 10) {
        errors.push('Restriction threshold must be between 1 and 10');
      }
    }
  }

  // Feature toggles
  if (data.featureToggles) {
    const { notificationsEnabled, qrCodeEnabled } = data.featureToggles;

    if (notificationsEnabled !== undefined && typeof notificationsEnabled !== 'boolean') {
      errors.push('Notifications enabled must be a boolean');
    }

    // QR code is always enabled, cannot be changed
    if (qrCodeEnabled !== undefined && qrCodeEnabled !== true) {
      errors.push('QR code feature cannot be disabled');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateOverrideAction = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Reason is mandatory
  if (!data.reason || typeof data.reason !== 'string' || data.reason.trim().length < 10) {
    errors.push('Reason is required and must be at least 10 characters');
  }

  if (data.reason && data.reason.length > 500) {
    errors.push('Reason must not exceed 500 characters');
  }

  // Optional: temporary override duration
  if (data.duration !== undefined) {
    if (typeof data.duration !== 'number' || data.duration < 1 || data.duration > 168) {
      errors.push('Duration must be between 1 and 168 hours');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateOutpassOverride = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // New status is required
  if (!data.newStatus || !['APPROVED', 'REJECTED', 'CANCELLED'].includes(data.newStatus)) {
    errors.push('Valid new status is required (APPROVED, REJECTED, or CANCELLED)');
  }

  // Reason is mandatory
  if (!data.reason || typeof data.reason !== 'string' || data.reason.trim().length < 10) {
    errors.push('Reason is required and must be at least 10 characters');
  }

  if (data.reason && data.reason.length > 500) {
    errors.push('Reason must not exceed 500 characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
