import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { socketService } from '../services/socketService';
import { notificationService } from '../services/notificationService';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAsRead } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-dropdown') && !target.closest('.notification-button')) {
        setShowNotifications(false);
      }
      if (!target.closest('.profile-dropdown') && !target.closest('.profile-button')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (user && token) {
      socketService.connect(token, user._id);
      
      // Fetch initial notifications
      fetchNotifications();
      
      // Poll for new notifications every 30 seconds
      const pollInterval = setInterval(fetchNotifications, 30000);
      
      return () => {
        socketService.disconnect();
        clearInterval(pollInterval);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications(20); // Limit to 20 recent notifications
      useNotificationStore.getState().setNotifications(data);
      
      const unreadCount = await notificationService.getUnreadCount();
      useNotificationStore.getState().setUnreadCount(unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    socketService.disconnect();
    window.location.href = '/login'; // Use window.location to force full page reload
  };

  const getRoleBasedLinks = () => {
    switch (user?.role) {
      case 0: // Student
        return [
          { path: '/student/dashboard', label: 'Dashboard', icon: '📊' },
          { path: '/student/profile', label: 'Profile', icon: '👤' },
        ];
      case 1: // Admin
        return [
          { path: '/admin/users', label: 'Manage Users', icon: '👥' },
          { path: '/admin/hostel-stats', label: 'Hostel Statistics', icon: '🏢' },
          { path: '/admin/settings', label: 'System Settings', icon: '⚙️' },
        ];
      case 2: // Warden
        return [];
      case 3: // Security
        return [];
      default:
        return [];
    }
  };

  const links = getRoleBasedLinks();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <Link
                to={
                  user?.role === 0 ? '/student/dashboard' :
                  user?.role === 1 ? '/admin/dashboard' :
                  user?.role === 2 ? '/warden/dashboard' :
                  '/security/dashboard'
                }
                className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900">Campus Pass</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-4 items-center">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-1">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              
              {/* Prominent Scan QR Button for Security */}
              {user?.role === 3 && (
                <Link
                  to="/security/scan-qr"
                  className="ml-4 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  <span>Scan QR</span>
                </Link>
              )}
            </nav>

            {/* Right side - Notifications and User */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative notification-dropdown">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }}
                  className="notification-button relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-200">
                    <div className="p-4 bg-indigo-600 text-white font-semibold flex justify-between items-center">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-white text-indigo-600 px-2 py-1 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <svg
                            className="w-12 h-12 mx-auto mb-3 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                          </svg>
                          <p>No notifications</p>
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification._id}
                            onClick={async () => {
                              try {
                                await notificationService.markAsRead(notification._id);
                                markAsRead(notification._id);
                              } catch (error) {
                                console.error('Failed to mark notification as read:', error);
                              }
                            }}
                            className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                              !notification.isRead ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start">
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }}
                  className="profile-button flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">
                      {user?.role === 0 && 'Student'}
                      {user?.role === 1 && 'Admin'}
                      {user?.role === 2 && 'Warden'}
                      {user?.role === 3 && 'Security'}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold text-lg">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Profile Menu Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {user?.role === 0 && user?.rollNumber}
                        {user?.role === 1 && 'Administrator'}
                        {user?.role === 2 && user?.hostel}
                        {user?.role === 3 && 'Security Personnel'}
                      </p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          const profilePath =
                            user?.role === 0 ? '/student/profile' :
                            user?.role === 1 ? '/admin/profile' :
                            user?.role === 2 ? '/warden/profile' :
                            '/security/profile';
                          window.location.href = profilePath;
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                      >
                        <svg
                          className="w-5 h-5 mr-3 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Profile Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                      >
                        <svg
                          className="w-5 h-5 mr-3 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {showMobileMenu ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Prominent Scan QR Button for Security (Mobile) */}
              {user?.role === 3 && (
                <Link
                  to="/security/scan-qr"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-md mb-2 text-center"
                >
                  <span className="mr-2">📷</span>
                  Scan QR Code
                </Link>
              )}
              
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setShowMobileMenu(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === link.path
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            &copy; Campus Pass. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

// 
