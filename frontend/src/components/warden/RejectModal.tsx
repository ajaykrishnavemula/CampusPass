import React, { useState } from 'react';
import { X, XCircle, AlertCircle } from 'lucide-react';
import { Outpass, User } from '../../types';
import { format } from 'date-fns';

interface RejectModalProps {
  outpass: Outpass | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}

const RejectModal: React.FC<RejectModalProps> = ({
  outpass,
  isOpen,
  onClose,
  onConfirm,
  loading,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  if (!isOpen || !outpass) return null;

  const student = outpass.student as User;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate reason (minimum 10 characters)
    if (reason.trim().length < 10) {
      setError('Rejection reason must be at least 10 characters long');
      return;
    }

    setError('');
    onConfirm(reason.trim());
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(e.target.value);
    if (error && e.target.value.trim().length >= 10) {
      setError('');
    }
  };

  const commonReasons = [
    'Insufficient information provided',
    'Invalid or incomplete emergency contact details',
    'Overlapping with academic schedule',
    'Previous overdue returns not cleared',
    'Destination not clearly specified',
    'Purpose does not justify outpass requirement',
  ];

  const handleQuickSelect = (selectedReason: string) => {
    setReason(selectedReason);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Reject Outpass Request</h3>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Student Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">{student.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Roll Number</p>
                    <p className="text-sm font-medium text-gray-900">{student.rollNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-sm font-medium text-gray-900">{student.department}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Room Number</p>
                    <p className="text-sm font-medium text-gray-900">{student.roomNumber}</p>
                  </div>
                </div>
              </div>

              {/* Outpass Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Outpass Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Purpose</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{outpass.purpose}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Destination</p>
                    <p className="text-sm font-medium text-gray-900">{outpass.destination}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">From</p>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(outpass.fromDate), 'dd MMM yyyy')} at {outpass.fromTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">To</p>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(outpass.toDate), 'dd MMM yyyy')} at {outpass.toTime}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Select Reasons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Select Common Reasons
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {commonReasons.map((commonReason, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleQuickSelect(commonReason)}
                      disabled={loading}
                      className="text-left px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {commonReason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rejection Reason (Required) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={reason}
                    onChange={handleReasonChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    rows={4}
                    disabled={loading}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      error ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {!isFocused && !reason && (
                    <div className="absolute top-2 left-3 text-gray-400 text-sm pointer-events-none">
                      Provide a clear and detailed reason for rejection (minimum 10 characters)...
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    This reason will be visible to the student.
                  </p>
                  <p className={`text-xs ${reason.length >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
                    {reason.length}/10 characters
                  </p>
                </div>
                {error && (
                  <div className="flex items-center space-x-1 mt-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-xs">{error}</p>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Important</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        Please ensure your rejection reason is clear and constructive. The student will be notified
                        immediately and may resubmit with corrections.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || reason.trim().length < 10}
                className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Reject Outpass</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RejectModal;

// 