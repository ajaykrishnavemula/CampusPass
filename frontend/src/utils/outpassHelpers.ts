/**
 * Utility functions for outpass-related operations
 */

/**
 * Get Tailwind CSS classes for outpass status badge
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'checked_out':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'checked_in':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'expired':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'cancelled':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Format date to Indian locale with medium date and short time
 */
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

/**
 * Calculate overdue duration in human-readable format
 */
export const getOverdueDuration = (toDate: string): string => {
  const now = new Date();
  const returnDate = new Date(toDate);
  const diffMs = now.getTime() - returnDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} overdue`;
  } else {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} overdue`;
  }
};

/**
 * Get severity color based on overdue duration
 */
export const getSeverityColor = (toDate: string): string => {
  const now = new Date();
  const returnDate = new Date(toDate);
  const diffHours = Math.floor((now.getTime() - returnDate.getTime()) / (1000 * 60 * 60));

  if (diffHours >= 48) return 'bg-red-100 border-red-300 text-red-800'; // 2+ days
  if (diffHours >= 24) return 'bg-orange-100 border-orange-300 text-orange-800'; // 1+ day
  return 'bg-yellow-100 border-yellow-300 text-yellow-800'; // < 1 day
};

/**
 * Format status text for display
 */
export const formatStatus = (status: string): string => {
  return status
    .replace('_', ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// 
