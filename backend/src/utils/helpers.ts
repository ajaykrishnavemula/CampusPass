import { UserRole } from '../types';

/**
 * Helper utility functions
 */

export const getRoleName = (role: UserRole): string => {
  const roleNames = {
    [UserRole.STUDENT]: 'Student',
    [UserRole.ADMIN]: 'Admin',
    [UserRole.WARDEN]: 'Warden',
    [UserRole.SECURITY]: 'Security',
  };
  return roleNames[role] || 'Unknown';
};

export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (date: Date): string => {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const calculateDuration = (fromDate: Date, toDate: Date): string => {
  const diff = toDate.getTime() - fromDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours > 1 ? 's' : ''}`;
};

export const generateOutpassNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `OP-${timestamp}-${random}`;
};


// 