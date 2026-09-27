import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/ui/Loading';

/**
 * Route Guard Component
 * Protects routes requiring authentication and enforces Role-Based Access Control (RBAC)
 * @param {Array<string>} allowedRoles - Optional list of authorized roles (e.g. ['admin'], ['staff'])
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, token, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading message="Verifying credentials & session..." size="lg" className="min-h-[60vh]" />;
  }

  // If not authenticated, redirect to login page with referral location
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role authorization is specified, verify current user's role
  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
