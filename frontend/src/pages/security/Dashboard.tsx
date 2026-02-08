import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { securityService, SecurityStatistics, ActiveOutpass, Outpass } from '../../services/securityService';
import SecurityStatisticsTiles from '../../components/security/SecurityStatisticsTiles';
import ActiveOutpassesTable from '../../components/security/ActiveOutpassesTable';
import AllOutpassesTable from '../../components/security/AllOutpassesTable';

const SecurityDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [statistics, setStatistics] = useState<SecurityStatistics>({
    activeOutside: 0,
    checkedInToday: 0,
    invalidScans: 0,
    overdue: 0,
  });
  const [activeOutpasses, setActiveOutpasses] = useState<ActiveOutpass[]>([]);
  const [allOutpasses, setAllOutpasses] = useState<Outpass[]>([]);
  const [allOutpassesPagination, setAllOutpassesPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [allOutpassesLoading, setAllOutpassesLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchAllOutpasses();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true); // Silent refresh
      fetchAllOutpasses(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAllOutpasses();
  }, [currentPage, selectedStatusFilter]);

  const fetchDashboardData = async (silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      // Fetch statistics and active outpasses in parallel
      const [stats, outpasses] = await Promise.all([
        securityService.getStatistics(),
        securityService.getActiveOutpasses(),
      ]);

      setStatistics(stats);
      setActiveOutpasses(outpasses);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      if (!silent) {
        setError(err.message || 'Failed to load dashboard data');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const fetchAllOutpasses = async (silent: boolean = false) => {
    try {
      if (!silent) {
        setAllOutpassesLoading(true);
      }

      const filters: any = {
        page: currentPage,
        limit: 20,
      };

      if (selectedStatusFilter) {
        filters.status = selectedStatusFilter;
      }

      const result = await securityService.getAllOutpasses(filters);
      setAllOutpasses(result.outpasses);
      setAllOutpassesPagination(result.pagination);
    } catch (err: any) {
      console.error('Failed to fetch all outpasses:', err);
    } finally {
      if (!silent) {
        setAllOutpassesLoading(false);
      }
    }
  };

  const handleTileClick = (filter: string) => {
    if (selectedFilter === filter) {
      setSelectedFilter(null);
    } else {
      setSelectedFilter(filter);
    }
  };

  const getFilteredOutpasses = (): ActiveOutpass[] => {
    if (!selectedFilter) return activeOutpasses;

    switch (selectedFilter) {
      case 'active':
        return activeOutpasses;
      case 'overdue':
        return activeOutpasses.filter((pass) => pass.isOverdue);
      case 'checkedin':
        // This filter doesn't apply to active outpasses
        return [];
      case 'invalid':
        // This filter doesn't apply to active outpasses
        return [];
      default:
        return activeOutpasses;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg
            className="h-6 w-6 text-red-600 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={() => fetchDashboardData()}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Vibrant Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
              <p className="text-indigo-100 mt-1 flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white mr-2">
                  Security
                </span>
                Gate Pass Monitoring & Control
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchDashboardData()}
            className="inline-flex items-center px-5 py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
            aria-label="Refresh dashboard"
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Tiles */}
      <SecurityStatisticsTiles
        statistics={statistics}
        selectedFilter={selectedFilter}
        onTileClick={handleTileClick}
      />

      {/* Active Outpasses Table */}
      <ActiveOutpassesTable
        outpasses={selectedFilter ? getFilteredOutpasses() : activeOutpasses}
        onRefresh={() => fetchDashboardData()}
        selectedFilter={selectedFilter}
        onClearFilter={() => setSelectedFilter(null)}
      />

      {/* All Outpasses Table */}
      <AllOutpassesTable
        outpasses={allOutpasses}
        loading={allOutpassesLoading}
        onRefresh={() => fetchAllOutpasses()}
        pagination={allOutpassesPagination}
        onPageChange={(page) => setCurrentPage(page)}
        onStatusFilter={(status) => {
          setSelectedStatusFilter(status);
          setCurrentPage(1); // Reset to first page when filter changes
        }}
        selectedStatus={selectedStatusFilter}
      />
    </div>
  );
};

export default SecurityDashboard;

// 
