import toast from 'react-hot-toast';
import { TOAST_DURATION } from '../constants';

/**
 * Centralized error handling utility
 */

interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
  };
  message?: string;
}

/**
 * Handle API errors with consistent toast notifications and logging
 */
export const handleApiError = (error: ApiError, context?: string): void => {
  const message = 
    error.response?.data?.message || 
    error.response?.data?.error || 
    error.message || 
    'An unexpected error occurred';

  // Log error with context
  if (context) {
    console.error(`[${context}]`, error);
  } else {
    console.error('API Error:', error);
  }

  // Show user-friendly toast
  toast.error(message, {
    duration: TOAST_DURATION.MEDIUM,
  });
};

/**
 * Handle success messages
 */
export const handleSuccess = (message: string): void => {
  toast.success(message, {
    duration: TOAST_DURATION.SHORT,
  });
};

/**
 * Handle info messages
 */
export const handleInfo = (message: string): void => {
  toast(message, {
    duration: TOAST_DURATION.SHORT,
    icon: 'ℹ️',
  });
};

/**
 * Handle warning messages
 */
export const handleWarning = (message: string): void => {
  toast(message, {
    duration: TOAST_DURATION.MEDIUM,
    icon: '⚠️',
  });
};

// 
