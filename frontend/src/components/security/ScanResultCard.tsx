import React, { useEffect } from 'react';
import { QRValidationResult } from '../../services/securityService';

interface ScanResultCardProps {
  result: QRValidationResult | null;
  onCheckOut?: () => void;
  onCheckIn?: () => void;
  onClose?: () => void;
  loading?: boolean;
}

const ScanResultCard: React.FC<ScanResultCardProps> = ({
  result,
  onCheckOut,
  onCheckIn,
  onClose,
  loading = false,
}) => {
  useEffect(() => {
    // Trigger haptic feedback on mobile devices
    if (result && 'vibrate' in navigator) {
      if (result.valid) {
        // Short vibration for valid scan
        navigator.vibrate(100);
      } else {
        // Double vibration for invalid scan
        navigator.vibrate([100, 50, 100]);
      }
    }
  }, [result]);

  if (!result) return null;

  const getCardStyle = () => {
    switch (result.state) {
      case 'VALID_CHECK_OUT':
        return {
          bg: 'bg-green-50',
          border: 'border-green-500',
          icon: 'text-green-600',
          iconBg: 'bg-green-100',
          title: 'text-green-900',
          message: 'text-green-700',
          button: 'bg-green-600 hover:bg-green-700',
        };
      case 'VALID_CHECK_IN':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          icon: 'text-blue-600',
          iconBg: 'bg-blue-100',
          title: 'text-blue-900',
          message: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700',
        };
      case 'WARNING_OVERDUE':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-500',
          icon: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          title: 'text-yellow-900',
          message: 'text-yellow-700',
          button: 'bg-yellow-600 hover:bg-yellow-700',
        };
      case 'INVALID':
        return {
          bg: 'bg-red-50',
          border: 'border-red-500',
          icon: 'text-red-600',
          iconBg: 'bg-red-100',
          title: 'text-red-900',
          message: 'text-red-700',
          button: 'bg-red-600 hover:bg-red-700',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-500',
          icon: 'text-gray-600',
          iconBg: 'bg-gray-100',
          title: 'text-gray-900',
          message: 'text-gray-700',
          button: 'bg-gray-600 hover:bg-gray-700',
        };
    }
  };

  const getIcon = () => {
    switch (result.state) {
      case 'VALID_CHECK_OUT':
        return (
          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        );
      case 'VALID_CHECK_IN':
        return (
          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
        );
      case 'WARNING_OVERDUE':
        return (
          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case 'INVALID':
        return (
          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (result.state) {
      case 'VALID_CHECK_OUT':
        return 'Check-Out Allowed';
      case 'VALID_CHECK_IN':
        return 'Check-In Allowed';
      case 'WARNING_OVERDUE':
        return 'Overdue Check-In';
      case 'INVALID':
        return 'Invalid QR Code';
      default:
        return 'Scan Result';
    }
  };

  const style = getCardStyle();

  return (
    <div className={`${style.bg} border-4 ${style.border} rounded-2xl p-8 shadow-2xl max-w-md w-full mx-auto`}>
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className={`${style.iconBg} ${style.icon} rounded-full p-4`}>
          {getIcon()}
        </div>
      </div>

      {/* Title */}
      <h2 className={`text-3xl font-bold text-center mb-4 ${style.title}`}>
        {getTitle()}
      </h2>

      {/* Message */}
      <p className={`text-center text-lg mb-6 ${style.message}`}>
        {result.message}
      </p>

      {/* Student Details */}
      {result.outpass && (
        <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Student:</span>
            <span className="text-gray-900">{result.outpass.student.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Roll Number:</span>
            <span className="text-gray-900">{result.outpass.student.rollNumber}</span>
          </div>
          {result.outpass.student.hostel && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Hostel:</span>
              <span className="text-gray-900">{result.outpass.student.hostel}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Destination:</span>
            <span className="text-gray-900">{result.outpass.destination}</span>
          </div>
          {result.outpass.isOverdue && result.outpass.minutesOverdue && (
            <div className="flex justify-between">
              <span className="font-medium text-red-700">Overdue By:</span>
              <span className="text-red-900 font-bold">
                {Math.floor(result.outpass.minutesOverdue / 60)}h {result.outpass.minutesOverdue % 60}m
              </span>
            </div>
          )}
        </div>
      )}

      {/* Reason for Invalid */}
      {result.state === 'INVALID' && result.reason && (
        <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Reason:</span> {result.reason}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {result.state === 'VALID_CHECK_OUT' && onCheckOut && (
          <button
            onClick={onCheckOut}
            disabled={loading}
            className={`w-full ${style.button} text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Check Out
              </>
            )}
          </button>
        )}

        {(result.state === 'VALID_CHECK_IN' || result.state === 'WARNING_OVERDUE') && onCheckIn && (
          <button
            onClick={onCheckIn}
            disabled={loading}
            className={`w-full ${style.button} text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                {result.state === 'WARNING_OVERDUE' ? 'Check In (Overdue)' : 'Check In'}
              </>
            )}
          </button>
        )}

        {/* Scan Another Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Scan Another QR Code
          </button>
        )}
      </div>
    </div>
  );
};

export default ScanResultCard;

// 