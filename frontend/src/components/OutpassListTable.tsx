import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Outpass } from '../types';
import { getStatusColor, formatDate } from '../utils/outpassHelpers';

interface OutpassListTableProps {
  outpasses: Outpass[];
  loading: boolean;
  onDownloadPDF?: (id: string) => void;
}

const OutpassListTable: React.FC<OutpassListTableProps> = ({ outpasses, loading, onDownloadPDF }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (outpasses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
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
          <h3 className="mt-4 text-lg font-medium text-gray-900">No outpasses found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your filters or create a new outpass.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Destination
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purpose
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                From Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                To Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {outpasses.map((outpass) => {
              const statusClasses = getStatusColor(outpass.status);
              const canDownloadPDF = ['approved', 'checked_out', 'checked_in'].includes(outpass.status);

              return (
                <tr key={outpass._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{outpass.destination}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 capitalize">{outpass.purpose}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(outpass.fromDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(outpass.toDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses}`}>
                      {outpass.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => navigate(`/student/outpass/${outpass._id}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                    {canDownloadPDF && onDownloadPDF && (
                      <button
                        onClick={() => onDownloadPDF(outpass._id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        PDF
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {outpasses.map((outpass) => {
          const statusClasses = getStatusColor(outpass.status);
          const canDownloadPDF = ['approved', 'checked_out', 'checked_in'].includes(outpass.status);

          return (
            <div key={outpass._id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">{outpass.destination}</h3>
                  <p className="text-sm text-gray-600 capitalize mt-1">{outpass.purpose}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusClasses}`}>
                  {outpass.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">From:</span>
                  <span className="text-gray-900 font-medium">{formatDate(outpass.fromDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">To:</span>
                  <span className="text-gray-900 font-medium">{formatDate(outpass.toDate)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/student/outpass/${outpass._id}`)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  View Details
                </button>
                {canDownloadPDF && onDownloadPDF && (
                  <button
                    onClick={() => onDownloadPDF(outpass._id)}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    PDF
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OutpassListTable;

// 