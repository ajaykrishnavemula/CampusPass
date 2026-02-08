import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AdminProfile = () => {
  const { user, updateUser } = useAuthStore();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user]);

  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};

    if (!profileData.name.trim()) errors.name = 'Name is required';
    if (!profileData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(profileData.email)) errors.email = 'Invalid email format';
    if (!profileData.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(profileData.phone)) errors.phone = 'Phone must be 10 digits';

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordData.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) errors.newPassword = 'New password is required';
    else if (passwordData.newPassword.length < 6) errors.newPassword = 'Password must be at least 6 characters';
    if (!passwordData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateProfile()) return;

    try {
      setSavingProfile(true);
      const response = await api.put('/auth/profile', profileData);
      updateUser(response.data.data);
      toast.success('Profile updated successfully');
      setEditingProfile(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    try {
      setChangingPassword(true);
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    }
    setEditingProfile(false);
    setProfileErrors({});
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
          {!editingProfile && (
            <button
              onClick={() => setEditingProfile(true)}
              className="px-4 py-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            {editingProfile ? (
              <>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    profileErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {profileErrors.name && <p className="text-red-500 text-xs mt-1">{profileErrors.name}</p>}
              </>
            ) : (
              <p className="text-gray-900">{user.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {editingProfile ? (
              <>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    profileErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {profileErrors.email && <p className="text-red-500 text-xs mt-1">{profileErrors.email}</p>}
              </>
            ) : (
              <p className="text-gray-900">{user.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            {editingProfile ? (
              <>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    profileErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {profileErrors.phone && <p className="text-red-500 text-xs mt-1">{profileErrors.phone}</p>}
              </>
            ) : (
              <p className="text-gray-900">{user.phone}</p>
            )}
          </div>

          {editingProfile && (
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={handleCancelEdit}
                disabled={savingProfile}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={savingProfile}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account Information (Read-only) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <p className="text-gray-900 font-semibold">Administrator</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
            <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              Active
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
            <p className="text-gray-900">
              {new Date(user.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <p className="text-gray-900 font-mono text-sm">{user._id}</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
            <p className="text-sm text-gray-600 mt-1">Update your password to keep your account secure</p>
          </div>
          {!showPasswordSection && (
            <button
              onClick={() => setShowPasswordSection(true)}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 focus:outline-none"
            >
              🔒 Change Password
            </button>
          )}
        </div>

        {showPasswordSection && (
          <div className="p-6 space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter current password"
            />
            {passwordErrors.currentPassword && (
              <p className="text-red-500 text-xs mt-1">{passwordErrors.currentPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter new password (min 6 characters)"
            />
            {passwordErrors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Confirm new password"
            />
            {passwordErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword}</p>
            )}
          </div>

            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordSection(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                  setPasswordErrors({});
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProfile;

// 