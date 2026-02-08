import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { Outpass, User } from '../../types';
import { format } from 'date-fns';

interface WardenOutpassTableProps {
  outpasses: Outpass[];
  loading: boolean;
  onApprove: (outpassId: string) => void;
  onReject: (outpassId: string) => void;
}

const WardenOutpassTable: React.FC<WardenOutpassTableProps> = ({
  outpasses,
  loading,
  onApprove,
  onReject,
}) => {
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      checked_out: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Checked Out' },
      checked_in: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Checked In' },
      expired: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Expired' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Cancelled' },
    };

    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getPurposeBadge = (purpose: string) => {
    const badges: Record<string, { icon: string; color: string }> = {
      home: { icon: '🏠', color: 'text-blue-600' },
      medical: { icon: '🏥', color: 'text-red-600' },
      personal: { icon: '👤', color: 'text-purple-600' },
      emergency: { icon: '🚨', color: 'text-red-600' },
      other: { icon: '📋', color: 'text-gray-600' },
    };

    const badge = badges[purpose] || badges.other;
    return (
      <span className={`text-sm ${badge.color} font-medium`}>
        {badge.icon} {purpose.charAt(0).toUpperCase() + purpose.slice(1)}
      </span>
    );
  };

  const getStudentBadges = (student: User) => {
    const badges = [];
    
    if (student.overdueCount > 0) {
      badges.push(
        <span key="overdue" className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3" />
          <span>{student.overdueCount} Overdue</span>
        </span>
      );
    }

    if (!student.canCreateOutpass) {
      badges.push(
        <span key="restricted" className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
          ⛔ Restricted
        </span>
      );
    }

    return badges;
  };

  const isOverdue = (outpass: Outpass) => {
    if (outpass.status !== 'checked_out') return false;
    const returnTime = new Date(`${outpass.toDate}T${outpass.toTime || '23:59'}`);
    return new Date() > returnTime;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading outpasses...</span>
        </div>
      </div>
    );
  }

  if (outpasses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Outpasses Found</h3>
          <p className="text-gray-600">
            No outpass requests match your current filters. Try adjusting your search criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-gray-300 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y-2 divide-gray-300">
          <thead className="bg-gradient-to-r from-indigo-50 to-blue-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b-2 border-gray-300">
                Student
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b-2 border-gray-300">
                Purpose
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b-2 border-gray-300">
                Destination
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b-2 border-gray-300">
                Date & Time
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b-2 border-gray-300">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider border-b-2 border-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y-2 divide-gray-200">
            {outpasses.map((outpass) => {
              const student = outpass.student as User;
              const isPending = outpass.status === 'pending';
              const isOutpassOverdue = isOverdue(outpass);

              return (
                <tr
                  key={outpass._id}
                  className={`hover:bg-indigo-50 transition-colors border-b border-gray-200 ${
                    isOutpassOverdue ? 'bg-red-50' : ''
                  } ${isPending ? 'bg-amber-50' : ''}`}
                >
                  {/* Student Info */}
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    <div className="flex flex-col">
                      <div className="text-sm font-semibold text-gray-900">{student.name}</div>
                      <div className="text-xs font-medium text-gray-600">{student.rollNumber}</div>
                      <div className="flex items-center space-x-1 mt-1">
                        {getStudentBadges(student)}
                      </div>
                    </div>
                  </td>

                  {/* Purpose */}
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    {getPurposeBadge(outpass.purpose)}
                  </td>

                  {/* Destination */}
                  <td className="px-6 py-4 border-r border-gray-200">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {outpass.destination}
                    </div>
                  </td>

                  {/* Date & Time */}
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    <div className="text-sm font-semibold text-gray-900">
                      {format(new Date(outpass.fromDate), 'dd MMM yyyy')}
                    </div>
                    <div className="text-xs font-medium text-gray-600">
                      {outpass.fromTime} - {outpass.toTime}
                    </div>
                    {isOutpassOverdue && (
                      <div className="text-xs text-red-600 font-semibold mt-1 flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>OVERDUE</span>
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                    {getStatusBadge(outpass.status)}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/warden/outpass/${outpass._id}`}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {isPending && (
                        <>
                          <button
                            onClick={() => onApprove(outpass._id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onReject(outpass._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WardenOutpassTable;

// 