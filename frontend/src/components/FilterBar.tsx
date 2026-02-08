import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  status: string;
  purpose: string;
  search: string;
  dateRange: string;
  fromDate?: string;
  toDate?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    purpose: '',
    search: '',
    dateRange: '',
  });

  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [customFromDate, setCustomFromDate] = useState<Date | null>(null);
  const [customToDate, setCustomToDate] = useState<Date | null>(null);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    
    // Show/hide custom date range inputs
    if (key === 'dateRange') {
      setShowCustomDateRange(value === 'custom');
      if (value !== 'custom') {
        delete newFilters.fromDate;
        delete newFilters.toDate;
      }
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCustomDateChange = (type: 'from' | 'to', date: Date | null) => {
    if (type === 'from') {
      setCustomFromDate(date);
      const newFilters = {
        ...filters,
        fromDate: date ? date.toISOString().split('T')[0] : undefined
      };
      setFilters(newFilters);
      onFilterChange(newFilters);
    } else {
      setCustomToDate(date);
      const newFilters = {
        ...filters,
        toDate: date ? date.toISOString().split('T')[0] : undefined
      };
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      status: '',
      purpose: '',
      search: '',
      dateRange: '',
    };
    setFilters(resetFilters);
    setShowCustomDateRange(false);
    setCustomFromDate(null);
    setCustomToDate(null);
    onFilterChange(resetFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== undefined);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Filter Outpasses</h2>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Reset All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Destination or reason..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="checked_out">Checked Out</option>
            <option value="checked_in">Checked In</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purpose
          </label>
          <select
            value={filters.purpose}
            onChange={(e) => handleFilterChange('purpose', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Purposes</option>
            <option value="home">Home Visit</option>
            <option value="medical">Medical</option>
            <option value="personal">Personal Work</option>
            <option value="family">Family Emergency</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Time</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last1month">Last Month</option>
            <option value="last3months">Last 3 Months</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Custom Date Range */}
      {showCustomDateRange && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <DatePicker
              selected={customFromDate}
              onChange={(date: Date | null) => handleCustomDateChange('from', date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="Select from date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              maxDate={customToDate || undefined}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <DatePicker
              selected={customToDate}
              onChange={(date: Date | null) => handleCustomDateChange('to', date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="Select to date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              minDate={customFromDate || undefined}
            />
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
          {filters.status && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              Status: {filters.status}
              <button
                onClick={() => handleFilterChange('status', '')}
                className="ml-2 text-indigo-600 hover:text-indigo-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.purpose && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              Purpose: {filters.purpose}
              <button
                onClick={() => handleFilterChange('purpose', '')}
                className="ml-2 text-indigo-600 hover:text-indigo-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              Search: "{filters.search}"
              <button
                onClick={() => handleFilterChange('search', '')}
                className="ml-2 text-indigo-600 hover:text-indigo-800"
              >
                ×
              </button>
            </span>
          )}
          {filters.dateRange && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              Date: {filters.dateRange}
              <button
                onClick={() => handleFilterChange('dateRange', '')}
                className="ml-2 text-indigo-600 hover:text-indigo-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;

// 