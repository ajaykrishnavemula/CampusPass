import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import adminService, {
  SystemStatistics,
  UserStatistics,
  OutpassStatistics,
  CriticalAlert
} from '../../services/adminService';

const COLORS = ['#FFA500', '#4CAF50', '#2196F3', '#F44336', '#9C27B0'];

interface Outpass {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    hostel: {
      _id: string;
      name: string;
    };
  };
  purpose: string;
  destination: string;
  fromDate: string;
  toDate: string;
  status: string;
  createdAt: string;
}

interface OutpassFilters {
  hostel: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  search: string;
  purpose: string;
}

const AdminDashboard = () => {
  const [systemStats, setSystemStats] = useState<SystemStatistics | null>(null);
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [outpassStats, setOutpassStats] = useState<OutpassStatistics | null>(null);
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Outpass list state
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [outpassesLoading, setOutpassesLoading] = useState(false);
  const [filters, setFilters] = useState<OutpassFilters>({
    hostel: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    search: '',
    purpose: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchDashboardStats();
    fetchOutpasses();
  }, []);

  useEffect(() => {
    fetchOutpasses();
  }, [filters, pagination.page]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [system, user, outpass, criticalAlerts] = await Promise.all([
        adminService.getSystemStatistics(),
        adminService.getUserStatistics(),
        adminService.getOutpassStatistics(),
        adminService.getCriticalAlerts()
      ]);
      setSystemStats(system);
      setUserStats(user);
      setOutpassStats(outpass);
      setAlerts(criticalAlerts);
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchOutpasses = async () => {
    try {
      setOutpassesLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.hostel) params.hostel = filters.hostel;
      if (filters.status) params.status = filters.status;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.search) params.search = filters.search;
      if (filters.purpose) params.purpose = filters.purpose;

      const response = await adminService.getAllOutpasses(params);
      setOutpasses(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error('Error fetching outpasses:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch outpasses');
    } finally {
      setOutpassesLoading(false);
    }
  };

  const handleTileClick = (status: string) => {
    // Clear all filters and set only the status filter
    // This ensures clicking a tile shows ONLY that status
    // Backend expects lowercase status values
    setFilters({
      hostel: '',
      status: status === 'all' ? '' : status.toLowerCase(),
      dateFrom: '',
      dateTo: '',
      search: '',
      purpose: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  const handleFilterChange = (key: keyof OutpassFilters, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, page: 1 });
  };

  const setQuickDateFilter = (range: string) => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = '';

    switch (range) {
      case 'today':
        dateFrom = today.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'last7days':
        const last7 = new Date(today);
        last7.setDate(today.getDate() - 7);
        dateFrom = last7.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'last30days':
        const last30 = new Date(today);
        last30.setDate(today.getDate() - 30);
        dateFrom = last30.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'thisMonth':
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        dateFrom = firstDay.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'clear':
        dateFrom = '';
        dateTo = '';
        break;
    }

    setFilters({ ...filters, dateFrom, dateTo });
    setPagination({ ...pagination, page: 1 });
  };

  const clearAllFilters = () => {
    setFilters({
      hostel: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      search: '',
      purpose: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-orange-100 text-orange-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Safe access with default values - must be before the null check return
  const byStatus = outpassStats?.byStatus || { pending: 0, approved: 0, active: 0, rejected: 0, overdue: 0 };
  const total = outpassStats?.total || 0;
  
  const pieData = [
    { name: 'Pending', value: byStatus.pending || 0, color: COLORS[0] },
    { name: 'Approved', value: byStatus.approved || 0, color: COLORS[1] },
    { name: 'Checked Out', value: byStatus.active || 0, color: COLORS[2] },
    { name: 'Rejected', value: byStatus.rejected || 0, color: COLORS[3] },
    { name: 'Overdue', value: byStatus.overdue || 0, color: COLORS[4] },
  ];

  if (!outpassStats || !userStats || !systemStats) {
    return (
      <div className="text-center text-red-500 p-8">
        <p className="text-xl font-semibold mb-2">Failed to load dashboard statistics</p>
        <p className="text-sm">Please restart the backend server and refresh the page.</p>
        <p className="text-xs mt-2 text-gray-600">Error: Admin API endpoints may not be registered yet.</p>
      </div>
    );
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    // Don't show label if percentage is 0
    if (percent === 0) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* System Health Banner */}
      {systemStats.systemStatus === 'INACTIVE' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-red-800 font-semibold">System Inactive</h3>
              <p className="text-red-700 text-sm">The system is currently in maintenance mode. Users cannot create new outpasses.</p>
            </div>
          </div>
        </div>
      )}

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <div className="flex-1">
              <h3 className="text-yellow-800 font-semibold mb-2">Critical Alerts</h3>
              {alerts.map((alert, index) => (
                <div key={index} className="text-yellow-700 text-sm mb-1">
                  • {alert.type}: {alert.count} {alert.count === 1 ? 'item' : 'items'}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={() => {
            fetchDashboardStats();
            fetchOutpasses();
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Pie Chart Section - More Vibrant */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 border border-indigo-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="text-3xl mr-3">📊</span>
          Outpass Distribution
        </h2>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
          <div className="w-full lg:w-1/2 bg-white rounded-lg p-4 shadow-md">
            {pieData.filter(item => item.value > 0).length === 0 ? (
              <div className="flex items-center justify-center h-[320px] text-gray-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-lg font-medium">No outpass data available</p>
                  <p className="text-sm mt-1">Create some outpasses to see the distribution</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData.filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={CustomLabel}
                    outerRadius={110}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {pieData.filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="w-full lg:w-1/2 grid grid-cols-2 gap-3">
            {pieData.map((item, index) => (
              <div
                key={index}
                className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div
                  className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 font-medium">{item.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clickable Tiles for Outpasses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div
          onClick={() => handleTileClick('all')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Outpasses</p>
              <p className="text-3xl font-bold mt-1">{total}</p>
            </div>
            <span className="text-4xl opacity-80">📋</span>
          </div>
        </div>

        <div
          onClick={() => handleTileClick('pending')}
          className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Pending</p>
              <p className="text-3xl font-bold mt-1">{byStatus.pending}</p>
            </div>
            <span className="text-4xl opacity-80">⏳</span>
          </div>
        </div>

        <div
          onClick={() => handleTileClick('approved')}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Approved</p>
              <p className="text-3xl font-bold mt-1">{byStatus.approved}</p>
            </div>
            <span className="text-4xl opacity-80">✅</span>
          </div>
        </div>

        <div
          onClick={() => handleTileClick('checked_out')}
          className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Checked Out</p>
              <p className="text-3xl font-bold mt-1">{byStatus.active}</p>
            </div>
            <span className="text-4xl opacity-80">🔄</span>
          </div>
        </div>

        <div
          onClick={() => handleTileClick('rejected')}
          className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Rejected</p>
              <p className="text-3xl font-bold mt-1">{byStatus.rejected}</p>
            </div>
            <span className="text-4xl opacity-80">❌</span>
          </div>
        </div>

        <div
          onClick={() => handleTileClick('overdue')}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Overdue</p>
              <p className="text-3xl font-bold mt-1">{byStatus.overdue}</p>
            </div>
            <span className="text-4xl opacity-80">⚠️</span>
          </div>
        </div>
      </div>

      {/* Outpasses List Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="text-3xl mr-3">📝</span>
          All Outpasses
        </h2>

        {/* Filters */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={clearAllFilters}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear All Filters
            </button>
          </div>

          {/* Quick Date Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQuickDateFilter('today')}
              className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              📅 Today
            </button>
            <button
              onClick={() => setQuickDateFilter('last7days')}
              className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              📊 Last 7 Days
            </button>
            <button
              onClick={() => setQuickDateFilter('last30days')}
              className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              📈 Last 30 Days
            </button>
            <button
              onClick={() => setQuickDateFilter('thisMonth')}
              className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              📆 This Month
            </button>
            <button
              onClick={() => setQuickDateFilter('clear')}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ✕ Clear Dates
            </button>
          </div>

          {/* Main Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="🔍 Search student name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="🏠 Filter by hostel..."
              value={filters.hostel}
              onChange={(e) => handleFilterChange('hostel', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="📝 Filter by purpose..."
              value={filters.purpose}
              onChange={(e) => handleFilterChange('purpose', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status and Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="OVERDUE">Overdue</option>
            </select>
            <input
              type="date"
              placeholder="From Date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="date"
              placeholder="To Date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Active Filters Display */}
          {(filters.search || filters.hostel || filters.purpose || filters.status || filters.dateFrom || filters.dateTo) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600 font-medium">Active Filters:</span>
              {filters.search && (
                <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                  Search: {filters.search}
                </span>
              )}
              {filters.hostel && (
                <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                  Hostel: {filters.hostel}
                </span>
              )}
              {filters.purpose && (
                <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                  Purpose: {filters.purpose}
                </span>
              )}
              {filters.status && (
                <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                  Status: {filters.status}
                </span>
              )}
              {filters.dateFrom && (
                <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                  From: {filters.dateFrom}
                </span>
              )}
              {filters.dateTo && (
                <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                  To: {filters.dateTo}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Outpasses Table */}
        <div className="overflow-x-auto">
          {outpassesLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hostel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {outpasses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>No outpasses found</p>
                    </td>
                  </tr>
                ) : (
                  outpasses.map((outpass) => (
                    <tr key={outpass._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{outpass.student?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{outpass.student?.email || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {outpass.student?.hostel?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{outpass.purpose || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{outpass.destination || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{outpass.fromDate ? formatDate(outpass.fromDate) : 'N/A'}</div>
                        <div className="text-xs">to</div>
                        <div>{outpass.toDate ? formatDate(outpass.toDate) : 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(outpass.status || '')}`}>
                          {outpass.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigate(`/admin/outpasses/${outpass._id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={i}
                        onClick={() => setPagination({ ...pagination, page: pageNum })}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === pageNum
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;

// 
