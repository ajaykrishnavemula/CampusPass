import React from 'react';

interface WarningBannerProps {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  icon?: React.ReactNode;
}

const WarningBanner: React.FC<WarningBannerProps> = ({ type, title, message, icon }) => {
  const getStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 border-2 border-red-200',
          icon: 'text-red-600',
          title: 'text-red-800',
          message: 'text-red-700',
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-2 border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-800',
          message: 'text-yellow-700',
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-2 border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-800',
          message: 'text-blue-700',
        };
    }
  };

  const styles = getStyles();

  const defaultIcon = (
    <svg
      className={`h-6 w-6 ${styles.icon}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );

  return (
    <div className={`rounded-xl shadow-md p-5 ${styles.container} animate-fadeIn`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">{icon || defaultIcon}</div>
        <div className="ml-4 flex-1">
          <h3 className={`text-base font-semibold ${styles.title} mb-2`}>{title}</h3>
          <p className={`text-sm ${styles.message} leading-relaxed`}>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default WarningBanner;

// 