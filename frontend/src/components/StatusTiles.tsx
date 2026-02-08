import React from 'react';

interface Analytics {
  approved: number;
  pending: number;
  rejected: number;
  overdue: number;
}

interface StatusTilesProps {
  analytics: Analytics;
  onTileClick?: (status: string) => void;
}

const StatusTiles: React.FC<StatusTilesProps> = ({ analytics, onTileClick }) => {
  const tiles = [
    {
      status: 'approved',
      label: 'Approved',
      count: analytics.approved,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      hoverBg: 'hover:bg-green-100',
    },
    {
      status: 'pending',
      label: 'Pending',
      count: analytics.pending,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
      hoverBg: 'hover:bg-yellow-100',
    },
    {
      status: 'rejected',
      label: 'Rejected',
      count: analytics.rejected,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      hoverBg: 'hover:bg-red-100',
    },
    {
      status: 'overdue',
      label: 'Overdue',
      count: analytics.overdue,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      hoverBg: 'hover:bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {tiles.map((tile) => (
        <button
          key={tile.status}
          onClick={() => onTileClick?.(tile.status)}
          className={`${tile.bgColor} ${tile.borderColor} ${tile.hoverBg} border-2 rounded-xl p-6 transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`${tile.iconColor} p-3 rounded-full bg-white shadow-sm`}>
              {tile.icon}
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{tile.count}</p>
              <p className="text-sm font-medium text-gray-600 mt-1">{tile.label}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default StatusTiles;

// 