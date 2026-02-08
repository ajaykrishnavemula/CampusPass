import React from 'react';
import { BarChart3, PieChart } from 'lucide-react';

interface StatusBreakdown {
  pending: number;
  approved: number;
  rejected: number;
  checked_out: number;
  checked_in: number;
  expired: number;
}

interface DailyOutpass {
  date: string;
  count: number;
}

interface AnalyticsData {
  statusBreakdown: StatusBreakdown;
  dailyOutpasses: DailyOutpass[];
}

interface WardenAnalyticsChartProps {
  analytics: AnalyticsData;
}

const WardenAnalyticsChart: React.FC<WardenAnalyticsChartProps> = ({ analytics }) => {
  const { statusBreakdown, dailyOutpasses } = analytics;

  // Calculate total for percentage
  const total = Object.values(statusBreakdown).reduce((sum, val) => sum + val, 0);

  // Status colors
  const statusColors: Record<keyof StatusBreakdown, string> = {
    pending: '#F59E0B',
    approved: '#10B981',
    rejected: '#EF4444',
    checked_out: '#3B82F6',
    checked_in: '#6B7280',
    expired: '#9CA3AF',
  };

  const statusLabels: Record<keyof StatusBreakdown, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    checked_out: 'Checked Out',
    checked_in: 'Checked In',
    expired: 'Expired',
  };

  // Find max count for bar chart scaling
  const maxCount = Math.max(...dailyOutpasses.map(d => d.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Status Breakdown - Donut Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <PieChart className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Status Breakdown</h3>
        </div>

        {total === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p className="text-sm">No data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Donut Chart Visualization */}
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {Object.entries(statusBreakdown).map(([status, count], index) => {
                    if (count === 0) return null;
                    
                    const percentage = (count / total) * 100;
                    const previousPercentages = Object.entries(statusBreakdown)
                      .slice(0, index)
                      .reduce((sum, [, c]) => sum + (c / total) * 100, 0);
                    
                    const circumference = 2 * Math.PI * 40;
                    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                    const strokeDashoffset = -((previousPercentages / 100) * circumference);

                    return (
                      <circle
                        key={status}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={statusColors[status as keyof StatusBreakdown]}
                        strokeWidth="12"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-300"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{total}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(statusBreakdown).map(([status, count]) => {
                if (count === 0) return null;
                const percentage = ((count / total) * 100).toFixed(1);
                
                return (
                  <div key={status} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: statusColors[status as keyof StatusBreakdown] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {statusLabels[status as keyof StatusBreakdown]}
                      </p>
                      <p className="text-xs text-gray-500">
                        {count} ({percentage}%)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Daily Outpasses - Bar Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Daily Outpasses (Last 7 Days)</h3>
        </div>

        {dailyOutpasses.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p className="text-sm">No data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bar Chart */}
            <div className="h-64 flex items-end justify-between space-x-2">
              {dailyOutpasses.map((day, index) => {
                const heightPercentage = (day.count / maxCount) * 100;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                    <div className="w-full flex flex-col items-center">
                      <span className="text-xs font-semibold text-gray-900 mb-1">
                        {day.count}
                      </span>
                      <div
                        className="w-full bg-indigo-600 rounded-t-lg transition-all duration-300 hover:bg-indigo-700"
                        style={{ height: `${Math.max(heightPercentage, 5)}%` }}
                        title={`${day.date}: ${day.count} outpasses`}
                      />
                    </div>
                    <span className="text-xs text-gray-600 text-center">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {dailyOutpasses.reduce((sum, d) => sum + d.count, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Average</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {(dailyOutpasses.reduce((sum, d) => sum + d.count, 0) / dailyOutpasses.length).toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Peak</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {maxCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WardenAnalyticsChart;

// 