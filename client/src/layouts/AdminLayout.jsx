import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Briefcase,
  Layers,
  MapPin,
  LogOut,
  Bell,
  Menu,
  X,
  Shield,
  User,
  ChevronDown,
  Wrench,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';

import NotificationBell from '../components/notifications/NotificationBell';

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Complaints Triage', path: '/admin/complaints', icon: ClipboardList },
  { name: 'User Management', path: '/admin/users', icon: Users },
  { name: 'Staff & Technicians', path: '/admin/staff', icon: Briefcase },
  { name: 'Problem Categories', path: '/admin/categories', icon: Layers },
  { name: 'Campus Locations', path: '/admin/locations', icon: MapPin },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showToast('Signed out of CampusFix Admin Console', 'info');
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/admin/dashboard' && (location.pathname === '/admin' || location.pathname === '/admin/dashboard')) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            aria-label="Toggle admin sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand Logo */}
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white">
                Campus<span className="text-amber-500">Fix</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Admin Console
              </span>
            </div>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Live In-App Notification Bell */}
          <NotificationBell align="right" />

          {/* Profile Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
              }}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs">
                {user?.name?.[0] || 'A'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-bold text-slate-200 block leading-tight">{user?.name}</span>
                <span className="text-[10px] text-amber-400 block uppercase font-semibold">Administrator</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in duration-150">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                </div>

                <Link
                  to="/"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium"
                >
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                  <span>Public Landing Page</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-rose-300 hover:bg-rose-500/10 transition-colors font-semibold"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Desktop + Mobile Drawer) */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-950/95 border-r border-slate-800 flex flex-col justify-between pt-20 pb-6 px-4 transition-transform duration-200 lg:static lg:pt-6 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="space-y-6">
            <div className="px-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Management Modules
              </span>
            </div>

            <nav className="space-y-1.5 text-xs font-semibold">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all ${
                      active
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Info */}
          <div className="pt-4 border-t border-slate-800/80 px-3 space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Cluster DB: Connected</span>
            </div>
            <p className="text-[10px] text-slate-600">CampusFix Core v1.4.0</p>
          </div>
        </aside>

        {/* Backdrop for mobile drawer */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          ></div>
        )}

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
