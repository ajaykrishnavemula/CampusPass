import React, { useEffect, useState } from 'react';
import { hostelService, Hostel } from '../../services/hostelService';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { RefreshCw, Building2 } from 'lucide-react';

const COLORS = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  checked_out: '#3b82f6',
  checked_in: '#8b5cf6',
  overdue: '#f97316',
};

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  checked_out: 'Checked Out',
  checked_in: 'Checked In',
  overdue: 'Overdue',
};

const HostelStats: React.FC = () => {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedHostelId) {
      fetchHostelStatistics(selectedHostelId);
    }
  }, [selectedHostelId]);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch all hostels
      const hostelsList = await hostelService.getAllHostels();
      setHostels(hostelsList);

      // Select first hostel by default
      if (hostelsList.length > 0 && !selectedHostelId) {
        setSelectedHostelId(hostelsList[0]._id);
      } else if (selectedHostelId) {
        // Refresh current hostel statistics
        await fetchHostelStatistics(selectedHostelId);
      }

      if (isRefresh) {
        toast.success('Statistics refreshed');
      }
    } catch (error: any) {
      console.error('Failed to fetch hostels:', error);
      
      // Handle rate limit error specifically
      if (error.response?.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to load hostel data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchHostelStatistics = async (hostelId: string) => {
    try {
      // Fetch hostel-specific outpass statistics
      const response = await adminService.getHostelStatistics();
      const hostelStat = response.find((stat: any) => stat.hostelId === hostelId);
      
      if (hostelStat) {
        setStatistics(hostelStat);
      } else {
        setStatistics(null);
      }
    } catch (error: any) {
      console.error('Failed to fetch hostel statistics:', error);
      toast.error('Failed to load statistics');
    }
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleHostelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedHostelId(e.target.value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Prepare pie chart data
  const pieChartData = statistics
    ? Object.entries(statistics.byStatus)
        .filter(([_, value]) => (value as number) > 0)
        .map(([key, value]) => ({
          name: STATUS_LABELS[key as keyof typeof STATUS_LABELS] || key,
          value: value as number,
          color: COLORS[key as keyof typeof COLORS] || '#gray',
        }))
    : [];

  const selectedHostel = hostels.find(h => h._id === selectedHostelId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hostel Statistics</h1>
          <p className="text-gray-600">Analyze outpass patterns across different hostels</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Refresh statistics"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {hostels.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Building2 className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Hostels Available</h2>
          <p className="text-yellow-600">Please add hostels to view statistics.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hostel Selector */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Select Hostel
            </label>
            <select
              value={selectedHostelId}
              onChange={handleHostelChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            >
              {hostels.map((hostel) => (
                <option key={hostel._id} value={hostel._id}>
                  {hostel.name} ({hostel.type.charAt(0).toUpperCase() + hostel.type.slice(1)})
                </option>
              ))}
            </select>
          </div>

          {/* Statistics Display */}
          {selectedHostel && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedHostel.name} - Outpass Statistics
              </h2>

              {statistics && pieChartData.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Summary Cards */}
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                      <p className="text-blue-100 text-sm mb-1">Total Outpasses</p>
                      <p className="text-4xl font-bold">{statistics.totalOutpasses}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                      <p className="text-green-100 text-sm mb-1">Total Students</p>
                      <p className="text-4xl font-bold">{statistics.totalStudents}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                      <p className="text-purple-100 text-sm mb-1">Average Per Student</p>
                      <p className="text-4xl font-bold">{statistics.averageOutpassesPerStudent}</p>
                    </div>
                  </div>

                  {/* Pie Chart */}
                  <div className="flex flex-col items-center justify-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No outpass data available for this hostel</p>
                  <p className="text-gray-400 text-sm mt-2">Students need to create outpasses first</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HostelStats;

// 
