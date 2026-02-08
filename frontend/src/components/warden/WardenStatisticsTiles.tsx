import React from 'react';
import { Clock, CheckCircle, XCircle, Users, AlertTriangle, FileText } from 'lucide-react';

interface Statistics {
  pending: number;
  approvedToday: number;
  rejected: number;
  activeOutside: number;
  overdue: number;
  totalStudents: number;
}

interface WardenStatisticsTilesProps {
  statistics: Statistics;
  onTileClick?: (filter: string) => void;
}

const WardenStatisticsTiles: React.FC<WardenStatisticsTilesProps> = ({ statistics, onTileClick }) => {
  const tiles = [
    {
      id: 'pending',
      label: 'Pending Approval',
      value: statistics.pending,
      icon: Clock,
      color: 'amber',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      filter: 'pending',
      priority: 1,
    },
    {
      id: 'overdue',
      label: 'Overdue Returns',
      value: statistics.overdue,
      icon: AlertTriangle,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      filter: 'overdue',
      priority: 2,
    },
    {
      id: 'activeOutside',
      label: 'Currently Outside',
      value: statistics.activeOutside,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      filter: 'checked_out',
      priority: 3,
    },
    {
      id: 'approvedToday',
      label: 'Approved Today',
      value: statistics.approvedToday,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      filter: 'approved',
      priority: 4,
    },
    {
      id: 'rejected',
      label: 'Rejected',
      value: statistics.rejected,
      icon: XCircle,
      color: 'gray',
      bgColor: 'bg-gray-50',
      iconColor: 'text-gray-600',
      borderColor: 'border-gray-200',
      filter: 'rejected',
      priority: 5,
    },
    {
      id: 'totalStudents',
      label: 'Total Students',
      value: statistics.totalStudents,
      icon: FileText,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-200',
      filter: 'all',
      priority: 6,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        const isClickable = tile.filter && onTileClick;
        const isHighPriority = tile.priority <= 2 && tile.value > 0;

        return (
          <div
            key={tile.id}
            onClick={() => isClickable && onTileClick(tile.filter)}
            className={`
              ${tile.bgColor} ${tile.borderColor} 
              border-2 rounded-lg p-5 shadow-sm transition-all
              ${isClickable ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''}
              ${isHighPriority ? 'ring-2 ring-offset-2 ring-' + tile.color + '-400' : ''}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{tile.label}</p>
                <p className={`text-3xl font-bold ${tile.iconColor}`}>
                  {tile.value}
                </p>
                {isHighPriority && (
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    ⚠️ Requires attention
                  </p>
                )}
              </div>
              <div className={`${tile.bgColor} p-3 rounded-lg`}>
                <Icon className={`w-8 h-8 ${tile.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WardenStatisticsTiles;

// 