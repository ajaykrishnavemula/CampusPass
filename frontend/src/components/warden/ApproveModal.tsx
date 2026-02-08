import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { Outpass, User } from '../../types';
import { format } from 'date-fns';

interface ApproveModalProps {
  outpass: Outpass | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note?: string) => void;
  loading: boolean;
}

const ApproveModal: React.FC<ApproveModalProps> = ({
  outpass,
  isOpen,
  onClose,
  onConfirm,
  loading,
}) => {
  const [note, setNote] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  if (!isOpen || !outpass) return null;

  const student = outpass.student as User;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(note.trim() || undefined);
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
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Approve Outpass Request</h3>
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
                {outpass.reason && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">Reason</p>
                    <p className="text-sm text-gray-900">{outpass.reason}</p>
                  </div>
                )}
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Note (Optional)
                </label>
                <div className="relative">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    rows={3}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {!isFocused && !note && (
                    <div className="absolute top-2 left-3 text-gray-400 pointer-events-none">
                      Add any special instructions or conditions for the student...
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This note will be visible to the student and security personnel.
                </p>
              </div>

              {/* Warning if student has issues */}
              {(student.overdueCount > 0 || !student.canCreateOutpass) && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">Student Alert</h3>
                      <div className="mt-2 text-sm text-amber-700">
                        <ul className="list-disc list-inside space-y-1">
                          {student.overdueCount > 0 && (
                            <li>Student has {student.overdueCount} overdue return(s)</li>
                          )}
                          {!student.canCreateOutpass && (
                            <li>Student is currently restricted from creating outpasses</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve Outpass</span>
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

export default ApproveModal;

// 