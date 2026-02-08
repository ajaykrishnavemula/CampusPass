import React from 'react';

interface Analytics {
  approved: number;
  pending: number;
  rejected: number;
  overdue: number;
}

interface AnalyticsChartProps {
  analytics: Analytics;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ analytics }) => {
  const total = analytics.approved + analytics.pending + analytics.rejected + analytics.overdue;

  // Calculate percentages
  const getPercentage = (value: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const data = [
    {
      label: 'Approved',
      value: analytics.approved,
      percentage: getPercentage(analytics.approved),
      color: 'bg-green-500',
      lightColor: 'bg-green-100',
      textColor: 'text-green-700',
    },
    {
      label: 'Pending',
      value: analytics.pending,
      percentage: getPercentage(analytics.pending),
      color: 'bg-yellow-500',
      lightColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
    },
    {
      label: 'Rejected',
      value: analytics.rejected,
      percentage: getPercentage(analytics.rejected),
      color: 'bg-red-500',
      lightColor: 'bg-red-100',
      textColor: 'text-red-700',
    },
    {
      label: 'Overdue',
      value: analytics.overdue,
      percentage: getPercentage(analytics.overdue),
      color: 'bg-orange-500',
      lightColor: 'bg-orange-100',
      textColor: 'text-orange-700',
    },
  ];

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Outpass Distribution</h3>
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="mt-4 text-sm text-gray-500">No outpass data available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Outpass Distribution</h3>

      {/* Horizontal Bar Chart */}
      <div className="space-y-4 mb-6">
        {data.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <span className="text-sm font-semibold text-gray-900">
                {item.value} ({item.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`${item.color} h-3 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-gray-200">
        {data.map((item) => (
          <div key={item.label} className={`${item.lightColor} rounded-lg p-4 text-center`}>
            <p className={`text-2xl font-bold ${item.textColor}`}>{item.value}</p>
            <p className="text-xs font-medium text-gray-600 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">Total Outpasses</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{total}</p>
      </div>
    </div>
  );
};

export default AnalyticsChart;

// 