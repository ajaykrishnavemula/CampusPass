import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';

interface Outpass {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  hostel: {
    _id: string;
    name: string;
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

const GlobalOutpassList = () => {
  const [searchParams] = useSearchParams();
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [loading, setLoading] = useState(true);
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
  const navigate = useNavigate();

  // Read status from URL query parameter on mount
  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl) {
      setFilters(prev => ({ ...prev, status: statusFromUrl }));
    }
  }, []);

  useEffect(() => {
    fetchOutpasses();
  }, [filters, pagination.page]);

  const fetchOutpasses = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
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

  if (loading && outpasses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">All Outpasses</h1>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Outpasses</p>
          <p className="text-2xl font-bold text-blue-600">{pagination.total}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {outpasses.filter(o => o.status === 'PENDING').length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {outpasses.filter(o => o.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Overdue</p>
          <p className="text-2xl font-bold text-red-600">
            {outpasses.filter(o => o.status === 'OVERDUE').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
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
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
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
                        <div className="text-sm font-medium text-gray-900">{outpass.student.name}</div>
                        <div className="text-sm text-gray-500">{outpass.student.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {outpass.hostel.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{outpass.purpose}</div>
                      <div className="text-sm text-gray-500">{outpass.destination}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(outpass.fromDate)}</div>
                      <div className="text-xs">to</div>
                      <div>{formatDate(outpass.toDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(outpass.status)}`}>
                        {outpass.status}
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
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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

export default GlobalOutpassList;

// 