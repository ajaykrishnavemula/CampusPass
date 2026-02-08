import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Lock, 
  Calendar,
  Shield,
  CheckCircle,
  Edit2,
  X,
  Save,
  ArrowLeft
} from 'lucide-react';
const WardenProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    hostel: user?.hostel || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        hostel: user.hostel || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.updateProfile(formData);
      updateUser(response);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        hostel: user.hostel || '',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/warden/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your personal information and settings</p>
          </div>
        </div>

        {/* Profile Information Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <User className="w-5 h-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1 text-gray-500" />
                    Full Name
                  </div>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1 text-gray-500" />
                    Email Address
                  </div>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1 text-gray-500" />
                    Phone Number
                  </div>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                />
              </div>

              {/* Hostel */}
              <div>
                <label htmlFor="hostel" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-1 text-gray-500" />
                    Assigned Hostel
                  </div>
                </label>
                <input
                  type="text"
                  id="hostel"
                  name="hostel"
                  value={formData.hostel}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  placeholder="e.g., Hostel A, Hostel B"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                />
              </div>
            </div>

            {isEditing && (
              <div className="border-t border-gray-200 pt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <Lock className="w-5 h-5 text-indigo-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">Update your password to keep your account secure</p>
            </div>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              >
                <Lock className="w-4 h-4 mr-1" />
                Change Password
              </button>
            )}
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex items-center px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Account Information Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Account Type</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                <Shield className="w-3 h-3 mr-1" />
                Warden
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Assigned Hostel</span>
              <span className="flex items-center text-sm font-medium text-gray-900">
                <Building2 className="w-4 h-4 mr-1 text-gray-500" />
                {user?.hostel || 'Not Assigned'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Member Since</span>
              <span className="flex items-center text-sm font-medium text-gray-900">
                <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-600">Account Status</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
  );
};

export default WardenProfile;

// 
