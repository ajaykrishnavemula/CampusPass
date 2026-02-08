import React from 'react';
import DatePicker from 'react-datepicker';
import { Search, Filter, X, Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

interface FilterState {
  status: string;
  purpose: string;
  search: string;
  fromDate: Date | null;
  toDate: Date | null;
  showOverdue: boolean;
}

interface WardenFilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

const WardenFilterBar: React.FC<WardenFilterBarProps> = ({ filters, onFilterChange, onClearFilters }) => {
  const hasActiveFilters = 
    filters.status !== '' || 
    filters.purpose !== '' || 
    filters.search !== '' || 
    filters.fromDate !== null || 
    filters.toDate !== null ||
    filters.showOverdue;

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'checked_out', label: 'Checked Out' },
    { value: 'checked_in', label: 'Checked In' },
    { value: 'expired', label: 'Expired' },
  ];

  const purposeOptions = [
    { value: '', label: 'All Purposes' },
    { value: 'home', label: 'Home Visit' },
    { value: 'medical', label: 'Medical' },
    { value: 'personal', label: 'Personal Work' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
              Active
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Search Student
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Name or Roll Number"
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Purpose Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Purpose
          </label>
          <select
            value={filters.purpose}
            onChange={(e) => onFilterChange({ ...filters, purpose: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {purposeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Overdue Toggle */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Quick Filter
          </label>
          <label className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={filters.showOverdue}
              onChange={(e) => onFilterChange({ ...filters, showOverdue: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Show Overdue Only</span>
          </label>
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            From Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
            <DatePicker
              selected={filters.fromDate}
              onChange={(date: Date | null) => onFilterChange({ ...filters, fromDate: date })}
              dateFormat="dd/MM/yyyy"
              placeholderText="Select start date"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              isClearable
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            To Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
            <DatePicker
              selected={filters.toDate}
              onChange={(date: Date | null) => onFilterChange({ ...filters, toDate: date })}
              dateFormat="dd/MM/yyyy"
              placeholderText="Select end date"
              minDate={filters.fromDate || undefined}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              isClearable
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WardenFilterBar;

// 