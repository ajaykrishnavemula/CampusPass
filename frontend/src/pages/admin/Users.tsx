import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import adminService, { UserStatistics } from '../../services/adminService';
import { hostelService, Hostel } from '../../services/hostelService';
import { User, UserRole } from '../../types';
import { RefreshCw } from 'lucide-react';

interface UserFilters {
  search: string;
  role: string;
  status: string;
  hostel: string;
}

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  hostel?: string;
  roomNumber?: string;
  password?: string;
}

const ManageUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    status: '',
    hostel: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pendingPermissionChange, setPendingPermissionChange] = useState<boolean | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    role: UserRole.STUDENT,
    hostel: '',
    roomNumber: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchHostels();
    fetchUserStats();
  }, [filters, pagination.page]);

  const fetchHostels = async () => {
    try {
      const hostelsList = await hostelService.getAllHostels();
      setHostels(hostelsList);
    } catch (error) {
      console.error('Error fetching hostels:', error);
    }
  };

  const fetchUserStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      const stats = await adminService.getUserStatistics();
      setUserStats(stats);
      if (isRefresh) {
        toast.success('Statistics refreshed');
      }
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      toast.error('Failed to refresh statistics');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      fetchUserStats(true),
      fetchUsers()
    ]);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.search) params.search = filters.search;
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;
      if (filters.hostel) params.hostel = filters.hostel;

      const response = await adminService.getAllUsers(params);
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, page: 1 });
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await adminService.toggleUserStatus(userId, !currentStatus);
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
      fetchUserStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to toggle user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await adminService.deleteUser(selectedUser._id);
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
      fetchUserStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: UserRole.STUDENT,
      hostel: '',
      roomNumber: '',
      password: '',
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Invalid email format';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(formData.phone)) errors.phone = 'Phone must be 10 digits';
    
    if (!showEditModal && !formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (formData.role === UserRole.STUDENT && !formData.hostel) {
      errors.hostel = 'Hostel is required for students';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await adminService.createUser(formData);
      toast.success('User created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
      fetchUserStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !validateForm()) return;

    try {
      setSubmitting(true);
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };
      
      if (formData.hostel) updateData.hostel = formData.hostel;
      if (formData.roomNumber) updateData.roomNumber = formData.roomNumber;
      if (formData.password) updateData.password = formData.password;

      await adminService.updateUser(selectedUser._id, updateData);
      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
      fetchUserStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      hostel: (user.hostel as any)?._id || user.hostel || '',
      roomNumber: user.roomNumber || '',
      password: '',
    });
    setShowEditModal(true);
  };

  const handleToggleOutpassPermission = async (newValue: boolean) => {
    if (!selectedUser) return;

    try {
      await adminService.toggleOutpassPermission(selectedUser._id, newValue);
      toast.success(`Outpass permission ${newValue ? 'enabled' : 'disabled'} successfully`);
      fetchUsers();
      // Refresh the selected user data
      const updatedUser = users.find(u => u._id === selectedUser._id);
      if (updatedUser) setSelectedUser(updatedUser);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to toggle outpass permission');
    }
  };

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case UserRole.STUDENT: return 'Student';
      case UserRole.ADMIN: return 'Admin';
      case UserRole.WARDEN: return 'Warden';
      case UserRole.SECURITY: return 'Security';
      default: return 'Unknown';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create User
          </button>
        </div>
      </div>

      {/* User Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div
          className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
          onClick={() => handleFilterChange('role', '')}
        >
          <p className="text-sm text-blue-100">Total Users</p>
          <p className="text-3xl font-bold text-white">{userStats?.total || 0}</p>
        </div>
        <div
          className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
          onClick={() => handleFilterChange('status', 'active')}
        >
          <p className="text-sm text-green-100">Active Users</p>
          <p className="text-3xl font-bold text-white">
            {userStats?.active || 0}
          </p>
        </div>
        <div
          className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
          onClick={() => handleFilterChange('role', UserRole.STUDENT.toString())}
        >
          <p className="text-sm text-orange-100">Students</p>
          <p className="text-3xl font-bold text-white">
            {userStats?.byRole?.students || 0}
          </p>
        </div>
        <div
          className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
          onClick={() => handleFilterChange('role', UserRole.WARDEN.toString())}
        >
          <p className="text-sm text-purple-100">Wardens</p>
          <p className="text-3xl font-bold text-white">
            {userStats?.byRole?.wardens || 0}
          </p>
        </div>
        <div
          className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all transform hover:scale-105"
          onClick={() => handleFilterChange('role', UserRole.SECURITY.toString())}
        >
          <p className="text-sm text-indigo-100">Security</p>
          <p className="text-3xl font-bold text-white">
            {userStats?.byRole?.security || 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={filters.hostel}
            onChange={(e) => handleFilterChange('hostel', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Hostels</option>
            {hostels.map((hostel) => (
              <option key={hostel._id} value={hostel.name}>
                {hostel.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' :
                        user.role === UserRole.WARDEN ? 'bg-blue-100 text-blue-800' :
                        user.role === UserRole.SECURITY ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {getRoleName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDetailsModal(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
                  {[...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPagination({ ...pagination, page: i + 1 })}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pagination.page === i + 1
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{selectedUser.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="user@example.com"
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="10-digit phone number"
                />
                {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Minimum 6 characters"
                />
                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: parseInt(e.target.value) as UserRole })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={UserRole.STUDENT}>Student</option>
                  <option value={UserRole.WARDEN}>Warden</option>
                  <option value={UserRole.SECURITY}>Security</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>

              {formData.role === UserRole.STUDENT && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hostel *</label>
                    <select
                      value={formData.hostel}
                      onChange={(e) => setFormData({ ...formData, hostel: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.hostel ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Hostel</option>
                      {hostels.map((hostel) => (
                        <option key={hostel._id} value={hostel.name}>
                          {hostel.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.hostel && <p className="text-red-500 text-xs mt-1">{formErrors.hostel}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                    <input
                      type="text"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., 101"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password (optional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Leave blank to keep current password"
                />
                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  value={getRoleName(formData.role)}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Role cannot be changed after creation</p>
              </div>

              {formData.role === UserRole.STUDENT && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hostel</label>
                    <select
                      value={formData.hostel}
                      onChange={(e) => setFormData({ ...formData, hostel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Hostel</option>
                      {hostels.map((hostel) => (
                        <option key={hostel._id} value={hostel.name}>
                          {hostel.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                    <input
                      type="text"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-gray-800 border-b pb-2">Basic Information</h4>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</label>
                  <p className="text-base font-medium text-gray-900 mt-1">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                  <p className="text-base font-medium text-gray-900 mt-1">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                  <p className="text-base font-medium text-gray-900 mt-1">{selectedUser.phone}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</label>
                  <p className="text-base font-medium text-gray-900 mt-1">{getRoleName(selectedUser.role)}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Student Specific Info */}
              {selectedUser.role === UserRole.STUDENT && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-gray-800 border-b pb-2">Student Information</h4>
                  {selectedUser.rollNumber && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Roll Number</label>
                      <p className="text-base font-medium text-gray-900 mt-1">{selectedUser.rollNumber}</p>
                    </div>
                  )}
                  {selectedUser.department && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</label>
                      <p className="text-base font-medium text-gray-900 mt-1">{selectedUser.department}</p>
                    </div>
                  )}
                  {selectedUser.year && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</label>
                      <p className="text-base font-medium text-gray-900 mt-1">Year {selectedUser.year}</p>
                    </div>
                  )}
                  {selectedUser.hostel && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hostel</label>
                      <p className="text-base font-medium text-gray-900 mt-1">{typeof selectedUser.hostel === 'string' ? selectedUser.hostel : (selectedUser.hostel as any)?.name || 'N/A'}</p>
                    </div>
                  )}
                  {selectedUser.roomNumber && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Room Number</label>
                      <p className="text-base font-medium text-gray-900 mt-1">{selectedUser.roomNumber}</p>
                    </div>
                  )}
                  {selectedUser.parentPhone && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Parent Phone</label>
                      <p className="text-base font-medium text-gray-900 mt-1">{selectedUser.parentPhone}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Security Specific Info */}
              {selectedUser.role === UserRole.SECURITY && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-gray-800 border-b pb-2">Security Information</h4>
                  {selectedUser.assignedGate && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Assigned Gate</label>
                      <p className="text-gray-900">{selectedUser.assignedGate}</p>
                    </div>
                  )}
                  {selectedUser.assignedHostel && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Assigned Hostel</label>
                      <p className="text-gray-900">{selectedUser.assignedHostel}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Warden Specific Info */}
              {selectedUser.role === UserRole.WARDEN && selectedUser.assignedHostels && selectedUser.assignedHostels.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-gray-800 border-b pb-2">Warden Information</h4>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Assigned Hostels</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedUser.assignedHostels.map((hostel, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {hostel}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Restriction Status - Only for Students */}
            {selectedUser.role === UserRole.STUDENT && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 mb-6 border border-gray-200">
                <h4 className="font-semibold text-lg text-gray-800 mb-4">Restriction & Outpass Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Restriction Status</label>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      selectedUser.restrictionStatus === 'restricted' ? 'bg-red-100 text-red-800' :
                      selectedUser.restrictionStatus === 'overridden' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedUser.restrictionStatus === 'restricted' ? '🔒 Restricted' :
                       selectedUser.restrictionStatus === 'overridden' ? '⚠️ Overridden' :
                       '✓ Normal'}
                    </span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Create Outpass Permission</label>
                    <button
                      onClick={() => handleToggleOutpassPermission(!selectedUser.canCreateOutpass)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        selectedUser.canCreateOutpass ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          selectedUser.canCreateOutpass ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <p className="text-xs font-medium text-gray-700 mt-1">
                      {selectedUser.canCreateOutpass ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Overdue Count</label>
                    <p className={`text-2xl font-bold ${selectedUser.overdueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedUser.overdueCount}
                    </p>
                  </div>
                </div>

                {/* Override Information */}
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Admin Override Count</label>
                      <p className="text-xl font-bold text-indigo-600">{selectedUser.overrideCount || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Times admin enabled permission</p>
                    </div>
                    {selectedUser.lastOverrideDate && (
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Last Override</label>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(selectedUser.lastOverrideDate).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Account Timestamps */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-lg text-gray-800 mb-3">Account Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Created At</label>
                  <p className="text-sm font-medium text-gray-900">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Last Updated</label>
                  <p className="text-sm font-medium text-gray-900">{new Date(selectedUser.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setPendingPermissionChange(null);
                    setShowDetailsModal(false);
                    openEditModal(selectedUser);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit User
                </button>
                <button
                  onClick={() => {
                    handleToggleStatus(selectedUser._id, selectedUser.isActive);
                    setPendingPermissionChange(null);
                    setShowDetailsModal(false);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                    selectedUser.isActive
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {selectedUser.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    setPendingPermissionChange(null);
                    setShowDetailsModal(false);
                    setShowDeleteModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete User
                </button>
              </div>
              <button
                onClick={() => {
                  setPendingPermissionChange(null);
                  setShowDetailsModal(false);
                  setSelectedUser(null);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;

// 