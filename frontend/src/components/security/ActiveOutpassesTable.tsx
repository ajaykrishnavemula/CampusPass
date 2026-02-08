import React from 'react';

interface Student {
  _id: string;
  name: string;
  rollNumber: string;
  hostel?: string;
}

interface ActiveOutpass {
  _id: string;
  student: Student;
  destination: string;
  fromDate: string;
  toDate: string;
  checkOutTime: string;
  isOverdue: boolean;
  minutesOverdue?: number;
}

interface ActiveOutpassesTableProps {
  outpasses: ActiveOutpass[];
  loading?: boolean;
  onRefresh?: () => void;
  selectedFilter?: string | null;
  onClearFilter?: () => void;
}

const ActiveOutpassesTable: React.FC<ActiveOutpassesTableProps> = ({
  outpasses,
  loading = false,
  onRefresh,
  selectedFilter = null,
  onClearFilter,
}) => {
  const getStatusIndicator = (outpass: ActiveOutpass) => {
    if (outpass.isOverdue) {
      return {
        label: 'Overdue',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        dotColor: 'bg-red-500',
      };
    }

    // Calculate time until overdue
    const toDate = new Date(outpass.toDate);
    const now = new Date();
    const hoursUntilOverdue = (toDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilOverdue <= 2) {
      return {
        label: 'Near Overdue',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        dotColor: 'bg-yellow-500',
      };
    }

    return {
      label: 'Normal',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      dotColor: 'bg-green-500',
    };
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const formatDuration = (checkOutTime: string) => {
    const checkOut = new Date(checkOutTime);
    const now = new Date();
    const diffMs = now.getTime() - checkOut.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const getFilterTitle = () => {
    const count = outpasses?.length || 0;
    
    if (!selectedFilter) {
      return `Currently Checked Out (${count})`;
    }
    
    switch (selectedFilter) {
      case 'active':
        return `Currently Checked Out (${count})`;
      case 'overdue':
        return `Overdue Check-ins (${count})`;
      case 'checkedin':
        return 'Checked-in Today';
      case 'invalid':
        return 'Invalid Scans Today';
      default:
        return `Currently Checked Out (${count})`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {getFilterTitle()}
          </h2>
          <div className="flex items-center space-x-2">
            {selectedFilter && onClearFilter && (
              <button
                onClick={onClearFilter}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                aria-label="Clear filter"
              >
                ✕ Close
              </button>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                aria-label="Refresh active outpasses"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {selectedFilter === 'checkedin' || selectedFilter === 'invalid' ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              View detailed history
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Go to the History page to view {selectedFilter === 'checkedin' ? 'check-in' : 'invalid scan'} records
            </p>
            <div className="mt-6">
              <a
                href="/security/history"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View History
              </a>
            </div>
          </div>
        ) : !outpasses || outpasses.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {selectedFilter === 'overdue' ? 'No overdue check-ins' : 'No active outpasses'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedFilter === 'overdue'
                ? 'All students have checked in on time.'
                : 'All students are currently checked in.'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Checked Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Return
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {outpasses?.map((outpass) => {
                const status = getStatusIndicator(outpass);
                return (
                  <tr key={outpass._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {outpass.student.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {outpass.student.rollNumber}
                          </div>
                          {outpass.student.hostel && (
                            <div className="text-xs text-gray-400">
                              {outpass.student.hostel}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{outpass.destination}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDateTime(outpass.checkOutTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDateTime(outpass.toDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDuration(outpass.checkOutTime)}
                      </div>
                      {outpass.isOverdue && outpass.minutesOverdue && (
                        <div className="text-xs text-red-600 font-medium">
                          +{Math.floor(outpass.minutesOverdue / 60)}h{' '}
                          {outpass.minutesOverdue % 60}m overdue
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}
                      >
                        <span
                          className={`w-2 h-2 mr-1.5 rounded-full ${status.dotColor} animate-pulse`}
                        ></span>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ActiveOutpassesTable;

// 