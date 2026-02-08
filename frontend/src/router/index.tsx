import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';

// Layouts (not lazy loaded as they're always needed)
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
import StudentLayout from '../layouts/StudentLayout';

// Auth Pages (not lazy loaded for faster initial load)
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Lazy loaded pages
const StudentDashboard = lazy(() => import('../pages/student/Dashboard'));
const CreateOutpass = lazy(() => import('../pages/student/CreateOutpass'));
const StudentOutpassDetails = lazy(() => import('../pages/student/OutpassDetails'));
const StudentProfile = lazy(() => import('../pages/student/Profile'));

const WardenDashboard = lazy(() => import('../pages/warden/Dashboard'));
const WardenOutpassDetails = lazy(() => import('../pages/warden/OutpassDetails'));
const WardenProfile = lazy(() => import('../pages/warden/Profile'));

const SecurityDashboard = lazy(() => import('../pages/security/Dashboard'));
const ScanQR = lazy(() => import('../pages/security/ScanQR'));
const SecurityHistory = lazy(() => import('../pages/security/History'));
const SecurityProfile = lazy(() => import('../pages/security/Profile'));

const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('../pages/admin/Users'));
const AdminSettings = lazy(() => import('../pages/admin/Settings'));
const AdminProfile = lazy(() => import('../pages/admin/Profile'));
const AdminOutpasses = lazy(() => import('../pages/admin/Outpasses'));
const AdminOutpassDetails = lazy(() => import('../pages/admin/OutpassDetails'));
const AdminHostelStats = lazy(() => import('../pages/admin/HostelStats'));

const NotFound = lazy(() => import('../pages/NotFound'));
const Unauthorized = lazy(() => import('../pages/Unauthorized'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
};

// Public Route Component (redirect if authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case UserRole.STUDENT:
        return <Navigate to="/student/dashboard" replace />;
      case UserRole.WARDEN:
        return <Navigate to="/warden/dashboard" replace />;
      case UserRole.SECURITY:
        return <Navigate to="/security/dashboard" replace />;
      case UserRole.ADMIN:
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
};

export const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <AuthLayout>
              <Register />
            </AuthLayout>
          </PublicRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
            <StudentLayout>
              <StudentDashboard />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/create-outpass"
        element={
          <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
            <StudentLayout>
              <CreateOutpass />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/outpass/:id"
        element={
          <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
            <StudentLayout>
              <StudentOutpassDetails />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
            <StudentLayout>
              <StudentProfile />
            </StudentLayout>
          </ProtectedRoute>
        }
      />

      {/* Warden Routes */}
      <Route
        path="/warden/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.WARDEN]}>
            <MainLayout>
              <WardenDashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/warden/outpass/:id"
        element={
          <ProtectedRoute allowedRoles={[UserRole.WARDEN]}>
            <MainLayout>
              <WardenOutpassDetails />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/warden/profile"
        element={
          <ProtectedRoute allowedRoles={[UserRole.WARDEN]}>
            <MainLayout>
              <WardenProfile />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Security Routes */}
      <Route
        path="/security/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.SECURITY]}>
            <MainLayout>
              <SecurityDashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/security/scan-qr"
        element={
          <ProtectedRoute allowedRoles={[UserRole.SECURITY]}>
            <MainLayout>
              <ScanQR />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/security/history"
        element={
          <ProtectedRoute allowedRoles={[UserRole.SECURITY]}>
            <MainLayout>
              <SecurityHistory />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/security/profile"
        element={
          <ProtectedRoute allowedRoles={[UserRole.SECURITY]}>
            <MainLayout>
              <SecurityProfile />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <MainLayout>
              <AdminDashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <MainLayout>
              <AdminUsers />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <MainLayout>
              <AdminSettings />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <MainLayout>
              <AdminProfile />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/outpasses"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <MainLayout>
              <AdminOutpasses />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/outpasses/:id"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <AdminOutpassDetails />
              </Suspense>
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/hostel-stats"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <AdminHostelStats />
              </Suspense>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Error Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/404" element={<NotFound />} />

      {/* Default Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// 
