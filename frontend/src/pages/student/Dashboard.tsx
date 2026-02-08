import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { outpassService } from '../../services/outpassService';
import { authService } from '../../services/authService';
import { Outpass } from '../../types';
import WarningBanner from '../../components/WarningBanner';
import LatestOutpassCard from '../../components/LatestOutpassCard';
import StatusTiles from '../../components/StatusTiles';
import FilterBar, { FilterState } from '../../components/FilterBar';
import OutpassListTable from '../../components/OutpassListTable';
import AnalyticsChart from '../../components/AnalyticsChart';

const StudentDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [systemStatus, setSystemStatus] = useState<{ isSystemActive: boolean; maxOutpassDuration: number } | null>(null);
  const [latestOutpass, setLatestOutpass] = useState<Outpass | null>(null);
  const [latestLoading, setLatestLoading] = useState(true);
  const [analytics, setAnalytics] = useState<{ approved: number; pending: number; rejected: number; overdue: number } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [outpassesLoading, setOutpassesLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    purpose: '',
    search: '',
    dateRange: '',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchOutpasses();
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      const [statusData, latestData, analyticsData] = await Promise.all([
        authService.getSystemStatus(),
        outpassService.getLatestOutpass(),
        outpassService.getAnalytics(),
      ]);
      setSystemStatus(statusData);
      setLatestOutpass(latestData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLatestLoading(false);
      setAnalyticsLoading(false);
    }
  };

  const fetchOutpasses = async () => {
    try {
      setOutpassesLoading(true);
      const result = await outpassService.getMyOutpasses({
        status: filters.status || undefined,
        purpose: filters.purpose || undefined,
        search: filters.search || undefined,
        dateRange: filters.dateRange || undefined,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        page: 1,
        limit: 10,
      });
      setOutpasses(result.data);
    } catch (error) {
      console.error('Failed to fetch outpasses:', error);
    } finally {
      setOutpassesLoading(false);
    }
  };

  const handleStatusTileClick = (status: string) => {
    // Update filters to show outpasses with selected status
    setFilters({ ...filters, status });
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleDownloadPDF = async (outpassId: string) => {
    try {
      await outpassService.downloadOutpassPDF(outpassId);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
        <p className="text-gray-600 mt-2 text-base">
          Roll Number: {user?.rollNumber} | Department: {user?.department} | Hostel: {user?.hostel}
        </p>
      </div>

      {/* Warning Banners */}
      {systemStatus && !systemStatus.isSystemActive && (
        <WarningBanner
          type="error"
          title="🚫 System Inactive"
          message="Outpass creation is temporarily disabled by administration. Please check back later or contact admin for more information."
        />
      )}

      {user && user.overdueCount >= 3 && (
        <WarningBanner
          type="error"
          title="⛔ Account Blocked"
          message={`You have ${user.overdueCount} overdue outpass(es). Your account is blocked from creating new outpasses. Please contact the warden to resolve this issue.${
            user.lastOverdueDate ? ` Last overdue: ${new Date(user.lastOverdueDate).toLocaleDateString()}` : ''
          }`}
        />
      )}

      {user && user.overdueCount > 0 && user.overdueCount < 3 && (
        <WarningBanner
          type="warning"
          title="⚠️ Overdue Warning"
          message={`You have ${user.overdueCount} overdue outpass(es). Please return on time to avoid account suspension. ${
            user.overdueCount === 2 ? 'One more overdue will block your account!' : ''
          }${user.lastOverdueDate ? ` Last overdue: ${new Date(user.lastOverdueDate).toLocaleDateString()}` : ''}`}
        />
      )}

      {user && !user.canCreateOutpass && user.overdueCount < 3 && (
        <WarningBanner
          type="info"
          title="ℹ️ Outpass Creation Disabled"
          message="Your outpass creation privilege has been temporarily disabled by administration. Please contact admin for more information."
        />
      )}

      {/* Latest Outpass Card */}
      {latestLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <LatestOutpassCard outpass={latestOutpass} onDownloadPDF={handleDownloadPDF} />
      )}

      {/* Status Tiles */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Outpass Analytics</h2>
        {analyticsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : analytics && (
          <StatusTiles analytics={analytics} onTileClick={handleStatusTileClick} />
        )}
      </div>

      {/* Analytics Chart */}
      {analyticsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : analytics && (
        <AnalyticsChart analytics={analytics} />
      )}

      {/* Filter Bar */}
      <FilterBar onFilterChange={handleFilterChange} />

      {/* Outpass List */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Outpasses</h2>
        <OutpassListTable
          outpasses={outpasses}
          loading={outpassesLoading}
          onDownloadPDF={handleDownloadPDF}
        />
      </div>
    </div>
  );
};

export default StudentDashboard;

// 
