import React from 'react';

interface StatisticTile {
  id: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  ringColor: string;
}

interface SecurityStatisticsTilesProps {
  statistics: {
    activeOutside: number;
    checkedInToday: number;
    invalidScans: number;
    overdue: number;
  };
  selectedFilter: string | null;
  onTileClick: (filter: string) => void;
  loading?: boolean;
}

const SecurityStatisticsTiles: React.FC<SecurityStatisticsTilesProps> = ({
  statistics,
  selectedFilter,
  onTileClick,
  loading = false,
}) => {
  // Provide default values if statistics is undefined
  const stats = statistics || {
    activeOutside: 0,
    checkedInToday: 0,
    invalidScans: 0,
    overdue: 0,
  };

  const tiles: StatisticTile[] = [
    {
      id: 'active',
      label: 'Active Outside',
      value: stats.activeOutside,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      ringColor: 'ring-blue-500',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
    },
    {
      id: 'checkedin',
      label: 'Checked-in Today',
      value: stats.checkedInToday,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      ringColor: 'ring-green-500',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      ),
    },
    {
      id: 'invalid',
      label: 'Invalid Scans',
      value: stats.invalidScans,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      ringColor: 'ring-orange-500',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      id: 'overdue',
      label: 'Overdue',
      value: stats.overdue,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      ringColor: 'ring-red-500',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-200 rounded-md p-3 w-12 h-12"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((tile) => (
        <button
          key={tile.id}
          onClick={() => onTileClick(tile.id)}
          className={`bg-white rounded-lg shadow p-6 text-left transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            selectedFilter === tile.id ? `ring-2 ${tile.ringColor}` : ''
          }`}
          aria-label={`View ${tile.label}: ${tile.value}`}
        >
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${tile.bgColor} rounded-md p-3`}>
              <div className={tile.iconColor}>{tile.icon}</div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{tile.label}</p>
              <p className="text-2xl font-bold text-gray-900">{tile.value}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default SecurityStatisticsTiles;

// 