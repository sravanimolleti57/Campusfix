import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Wrench,
  LogOut,
  User,
  Shield,
  Briefcase,
  GraduationCap,
  LogIn,
  UserPlus,
  Menu,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';
import NotificationBell from './notifications/NotificationBell';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showToast('Signed out of CampusFix successfully', 'info');
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
            <Shield className="w-3 h-3 text-amber-400" /> Admin
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
            <Briefcase className="w-3 h-3 text-indigo-400" /> Staff
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
            <GraduationCap className="w-3 h-3 text-blue-400" /> Student
          </span>
        );
    }
  };

  const getPortalLink = (role) => {
    if (role === 'admin') return '/admin';
    if (role === 'staff') return '/staff';
    return '/student';
  };

  const isHome = location.pathname === '/';

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              Campus<span className="text-blue-500">Fix</span>
            </span>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              Problem Reporting & Resolution
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
          {isAuthenticated && user?.role === 'student' ? (
            <>
              <Link to="/student" className="hover:text-blue-400 transition-colors">
                Dashboard
              </Link>
              <Link to="/student/report" className="hover:text-blue-400 transition-colors">
                Report Problem
              </Link>
              <Link to="/student/complaints" className="hover:text-blue-400 transition-colors">
                My Complaints
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className="hover:text-blue-400 transition-colors">
                Home
              </Link>
              <a href="/#how-it-works" className="hover:text-blue-400 transition-colors">
                How It Works
              </a>
              <a href="/#categories" className="hover:text-blue-400 transition-colors">
                Problem Categories
              </a>
              <a href="/#lifecycle" className="hover:text-blue-400 transition-colors">
                Complaint Lifecycle
              </a>
              <a href="/#benefits" className="hover:text-blue-400 transition-colors">
                Benefits
              </a>
            </>
          )}
        </nav>

        {/* Right Actions & Account Status */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* In-App Notification Bell */}
              <NotificationBell align="right" />

              <Link
                to={getPortalLink(user.role)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors text-xs"
              >
                {getRoleBadge(user.role)}
                <span className="font-semibold text-slate-200">{user.name}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                title="Sign out of CampusFix"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  location.pathname === '/login'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Student Register</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger & Actions */}
        <div className="flex sm:hidden items-center gap-2">
          {isAuthenticated && user && <NotificationBell align="right" />}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-800/80 bg-slate-950 px-4 pt-3 pb-6 space-y-3 animate-in fade-in duration-200 text-xs">
          <div className="flex flex-col space-y-1">
            {isAuthenticated && user?.role === 'student' ? (
              <>
                <Link
                  to="/student"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-900 font-semibold"
                >
                  Dashboard
                </Link>
                <Link
                  to="/student/report"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-900 font-semibold"
                >
                  Report Problem
                </Link>
                <Link
                  to="/student/complaints"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-900 font-semibold"
                >
                  My Complaints
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-900 font-semibold"
                >
                  Home
                </Link>
                <a
                  href="/#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-900 font-semibold"
                >
                  How It Works
                </a>
                <a
                  href="/#categories"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-900 font-semibold"
                >
                  Problem Categories
                </a>
                <a
                  href="/#lifecycle"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-900 font-semibold"
                >
                  Complaint Lifecycle
                </a>
                <a
                  href="/#benefits"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-900 font-semibold"
                >
                  Benefits
                </a>
              </>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  to={getPortalLink(user.role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-semibold text-white flex items-center justify-between"
                >
                  <span>Go to Dashboard</span>
                  {getRoleBadge(user.role)}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-rose-300 bg-rose-500/10 font-semibold flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout ({user.email})</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-semibold text-slate-200 text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl bg-blue-600 font-bold text-white text-center shadow-lg shadow-blue-600/30"
                >
                  Student Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
