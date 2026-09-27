import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import ReportComplaintPage from './pages/student/ReportComplaintPage';
import MyComplaintsPage from './pages/student/MyComplaintsPage';
import ComplaintDetailsPage from './pages/student/ComplaintDetailsPage';
import StaffDashboard from './pages/staff/StaffDashboard';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './routes/ProtectedRoute';

// Admin Portal Components
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminComplaintsPage from './pages/admin/AdminComplaintsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminStaffPage from './pages/admin/AdminStaffPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminLocationsPage from './pages/admin/AdminLocationsPage';

// Staff Portal Components
import StaffLayout from './layouts/StaffLayout';
import StaffComplaintsPage from './pages/staff/StaffComplaintsPage';
import StaffComplaintDetailPage from './pages/staff/StaffComplaintDetailPage';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isStaffRoute = location.pathname.startsWith('/staff');
  const isDedicatedWorkspace = isAdminRoute || isStaffRoute;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Hide public navbar on Admin & Staff Portal pages for dedicated workspace layout */}
      {!isDedicatedWorkspace && <Navbar />}

      <main className="flex-1 flex flex-col">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Student Portal */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/report" element={<ReportComplaintPage />} />
            <Route path="/student/complaints" element={<MyComplaintsPage />} />
            <Route path="/student/complaints/:id" element={<ComplaintDetailsPage />} />
          </Route>

          {/* Protected Maintenance Staff Portal */}
          <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
            <Route element={<StaffLayout />}>
              <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route path="/staff/complaints" element={<StaffComplaintsPage />} />
              <Route path="/staff/complaints/:id" element={<StaffComplaintDetailPage />} />
            </Route>
          </Route>

          {/* Protected Administration Portal */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/staff" element={<AdminStaffPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/admin/locations" element={<AdminLocationsPage />} />
            </Route>
          </Route>

          {/* Catch-all 404 Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Hide public footer on Admin & Staff Portal pages */}
      {!isDedicatedWorkspace && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
