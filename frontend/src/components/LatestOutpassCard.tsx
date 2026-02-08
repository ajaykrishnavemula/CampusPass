import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Outpass } from '../types';
import { getStatusColor, formatDate } from '../utils/outpassHelpers';

interface LatestOutpassCardProps {
  outpass: Outpass | null;
  onDownloadPDF?: (id: string) => void;
}

const LatestOutpassCard: React.FC<LatestOutpassCardProps> = ({ outpass, onDownloadPDF }) => {
  const navigate = useNavigate();

  // If no outpass, show CTA card
  if (!outpass) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-lg p-8 border-2 border-indigo-200">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
            <svg
              className="w-10 h-10 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Outpasses Yet</h3>
          <p className="text-gray-600 mb-6">
            You haven't created any outpass requests. Get started by creating your first outpass!
          </p>
          <button
            onClick={() => navigate('/student/create-outpass')}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-md"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Your First Outpass
          </button>
        </div>
      </div>
    );
  }

  const statusClasses = getStatusColor(outpass.status);
  const canDownloadPDF = ['approved', 'checked_out', 'checked_in'].includes(outpass.status);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header with Status Badge */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Latest Outpass</h3>
          <span
            className={`px-4 py-1.5 rounded-full text-sm font-semibold ${statusClasses} border-2 border-white shadow-sm`}
          >
            {outpass.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Destination */}
        <div>
          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Destination
          </label>
          <p className="text-xl font-bold text-gray-900 mt-1">{outpass.destination}</p>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              From
            </label>
            <p className="text-base font-semibold text-gray-900 mt-1">
              {formatDate(outpass.fromDate)}
            </p>
            {outpass.fromTime && (
              <p className="text-sm text-gray-600">{outpass.fromTime}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              To
            </label>
            <p className="text-base font-semibold text-gray-900 mt-1">
              {formatDate(outpass.toDate)}
            </p>
            {outpass.toTime && (
              <p className="text-sm text-gray-600">{outpass.toTime}</p>
            )}
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Purpose
          </label>
          <p className="text-base text-gray-900 mt-1">{outpass.purpose}</p>
        </div>

        {/* Rejection Reason (if rejected) */}
        {outpass.status === 'rejected' && outpass.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <label className="text-sm font-medium text-red-800 uppercase tracking-wide">
              Rejection Reason
            </label>
            <p className="text-sm text-red-700 mt-1">{outpass.rejectionReason}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => navigate(`/student/outpass/${outpass._id}`)}
            className="flex-1 inline-flex items-center justify-center px-5 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View Details
          </button>

          {canDownloadPDF && onDownloadPDF && (
            <button
              onClick={() => onDownloadPDF(outpass._id)}
              className="flex-1 inline-flex items-center justify-center px-5 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-sm"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LatestOutpassCard;

// 