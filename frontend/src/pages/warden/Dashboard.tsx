import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import wardenService from '../../services/wardenService';
import { Outpass } from '../../types';
import toast from 'react-hot-toast';

// Import new components
import HostelContextBanner from '../../components/warden/HostelContextBanner';
import PriorityAlerts from '../../components/warden/PriorityAlerts';
import WardenStatisticsTiles from '../../components/warden/WardenStatisticsTiles';
import WardenFilterBar from '../../components/warden/WardenFilterBar';
import WardenOutpassTable from '../../components/warden/WardenOutpassTable';
import WardenAnalyticsChart from '../../components/warden/WardenAnalyticsChart';
import ApproveModal from '../../components/warden/ApproveModal';
import RejectModal from '../../components/warden/RejectModal';

interface HostelInfo {
  hostel: string;
  studentCount: number;
}

interface Statistics {
  pending: number;
  approvedToday: number;
  rejected: number;
  activeOutside: number;
  overdue: number;
  totalStudents: number;
}

interface Analytics {
  statusBreakdown: {
    pending: number;
    approved: number;
    rejected: number;
    checked_out: number;
    checked_in: number;
    expired: number;
  };
  dailyOutpasses: Array<{
    date: string;
    count: number;
  }>;
}

interface FilterState {
  status: string;
  purpose: string;
  search: string;
  fromDate: Date | null;
  toDate: Date | null;
  showOverdue: boolean;
}

const WardenDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();

  // Data states
  const [hostelInfo, setHostelInfo] = useState<HostelInfo | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    status: searchParams.get('filter') || '',
    purpose: '',
    search: '',
    fromDate: null,
    toDate: null,
    showOverdue: searchParams.get('filter') === 'overdue',
  });

  // Modal states
  const [approveModal, setApproveModal] = useState<{ isOpen: boolean; outpass: Outpass | null }>({
    isOpen: false,
    outpass: null,
  });
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; outpass: Outpass | null }>({
    isOpen: false,
    outpass: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all data on mount
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  // Fetch outpasses when filters change
  useEffect(() => {
    if (user) {
      fetchOutpasses();
    }
  }, [user, filters, pagination.page]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel with individual error handling
      const [hostelRes, statsRes, analyticsRes] = await Promise.all([
        wardenService.getHostelInfo().catch(err => {
          console.error('Hostel info error:', err);
          return { success: false, data: null };
        }),
        wardenService.getStatistics().catch(err => {
          console.error('Statistics error:', err);
          return { success: false, data: null };
        }),
        wardenService.getAnalytics().catch(err => {
          console.error('Analytics error:', err);
          return { success: false, data: null };
        }),
      ]);

      if (hostelRes?.success && hostelRes?.data) setHostelInfo(hostelRes.data);
      if (statsRes?.success && statsRes?.data) setStatistics(statsRes.data);
      if (analyticsRes?.success && analyticsRes?.data) setAnalytics(analyticsRes.data);

      // Fetch outpasses
      await fetchOutpasses();
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error?.response?.data?.message || error?.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOutpasses = async () => {
    try {
      const params: any = {
        page: pagination.page,
        limit: 10,
      };

      if (filters.status) params.status = filters.status;
      if (filters.purpose) params.purpose = filters.purpose;
      if (filters.search) params.search = filters.search;
      if (filters.fromDate) params.fromDate = filters.fromDate.toISOString().split('T')[0];
      if (filters.toDate) params.toDate = filters.toDate.toISOString().split('T')[0];
      if (filters.showOverdue) params.showOverdue = true;

      const response = await wardenService.getOutpassesEnhanced(params);

      if (response?.success && response?.data) {
        setOutpasses(response.data?.outpasses || []);
        setPagination(response.data?.pagination || { page: 1, pages: 1, total: 0 });
      } else {
        console.warn('Invalid outpasses response:', response);
        setOutpasses([]);
        setPagination({ page: 1, pages: 1, total: 0 });
      }
    } catch (error: any) {
      console.error('Failed to fetch outpasses:', error);
      toast.error(error?.response?.data?.message || 'Failed to load outpasses');
      setOutpasses([]);
      setPagination({ page: 1, pages: 1, total: 0 });
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPagination({ ...pagination, page: 1 });
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      purpose: '',
      search: '',
      fromDate: null,
      toDate: null,
      showOverdue: false,
    });
    setSearchParams({});
    setPagination({ ...pagination, page: 1 });
  };

  const handleTileClick = (filter: string) => {
    if (filter === 'all') {
      // Clear all filters to show all outpasses
      setFilters({
        status: '',
        purpose: '',
        search: '',
        fromDate: null,
        toDate: null,
        showOverdue: false,
      });
      setSearchParams({});
    } else {
      setFilters({
        ...filters,
        status: filter,
        showOverdue: filter === 'checked_out',
      });
    }
    setPagination({ ...pagination, page: 1 });
  };

  const handleApprove = (outpassId: string) => {
    const outpass = outpasses.find((o) => o._id === outpassId);
    if (outpass) {
      setApproveModal({ isOpen: true, outpass });
    }
  };

  const handleReject = (outpassId: string) => {
    const outpass = outpasses.find((o) => o._id === outpassId);
    if (outpass) {
      setRejectModal({ isOpen: true, outpass });
    }
  };

  const handleApproveConfirm = async (note?: string) => {
    if (!approveModal.outpass) return;

    try {
      setActionLoading(true);
      const response = await wardenService.approveOutpass(approveModal.outpass._id, note);

      if (response.success) {
        toast.success('Outpass approved successfully');
        setApproveModal({ isOpen: false, outpass: null });
        // Refresh data
        fetchAllData();
      }
    } catch (error: any) {
      console.error('Failed to approve outpass:', error);
      toast.error(error.response?.data?.message || 'Failed to approve outpass');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectModal.outpass) return;

    try {
      setActionLoading(true);
      const response = await wardenService.rejectOutpass(rejectModal.outpass._id, reason);

      if (response.success) {
        toast.success('Outpass rejected successfully');
        setRejectModal({ isOpen: false, outpass: null });
        // Refresh data
        fetchAllData();
      }
    } catch (error: any) {
      console.error('Failed to reject outpass:', error);
      toast.error(error.response?.data?.message || 'Failed to reject outpass');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (loading && !hostelInfo) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !hostelInfo) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchAllData}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Hostel Context Banner */}
      {hostelInfo && (
        <HostelContextBanner hostelName={hostelInfo.hostel} studentCount={hostelInfo.studentCount} />
      )}

      {/* Priority Alerts */}
      {statistics && (
        <PriorityAlerts pendingCount={statistics.pending} overdueCount={statistics.overdue} />
      )}

      {/* Statistics Tiles */}
      {statistics && (
        <WardenStatisticsTiles statistics={statistics} onTileClick={handleTileClick} />
      )}

      {/* Analytics Charts */}
      {analytics && <WardenAnalyticsChart analytics={analytics} />}

      {/* Filter Bar */}
      <WardenFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Outpass Table */}
      <WardenOutpassTable
        outpasses={outpasses}
        loading={loading}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      <ApproveModal
        outpass={approveModal.outpass}
        isOpen={approveModal.isOpen}
        onClose={() => setApproveModal({ isOpen: false, outpass: null })}
        onConfirm={handleApproveConfirm}
        loading={actionLoading}
      />

      {/* Reject Modal */}
      <RejectModal
        outpass={rejectModal.outpass}
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, outpass: null })}
        onConfirm={handleRejectConfirm}
        loading={actionLoading}
      />
    </div>
  );
};

export default WardenDashboard;

// 
