import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  LogOut,
  Bell,
  Menu,
  X,
  User,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HardHat,
  ArrowRight,
} from 'lucide-react';
import NotificationBell from '../components/notifications/NotificationBell';

const staffNavItems = [
  { name: 'Technician Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
  { name: 'My Assigned Work', path: '/staff/complaints', icon: Wrench },
];

const StaffLayout = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    showToast('Signed out of Maintenance Technician Portal', 'info');
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/staff/dashboard' && (location.pathname === '/staff' || location.pathname === '/staff/dashboard')) {
      return true;
    }
    return location.pathname.startsWith(path) && (path !== '/staff/dashboard' || location.pathname === '/staff/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Toggle mobile menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/staff/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  CampusFix
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Staff
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Facilities Maintenance Portal
              </p>
            </div>
          </Link>
        </div>

        {/* Center / Right Header elements */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Active status indicator badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Technician Duty Active</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 font-normal">{user?.department || 'Field Technician'}</span>
          </div>

          {/* Quick link button to assigned tickets */}
          <Link
            to="/staff/complaints"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-200 transition"
          >
            <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
            <span>My Tasks</span>
          </Link>

          {/* Live In-App Notification Bell */}
          <NotificationBell align="right" />

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-700 flex items-center justify-center text-white font-bold text-sm shadow">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'T'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                  {user?.name || 'Technician'}
                </p>
                <p className="text-[10px] text-amber-400 font-mono">
                  {user?.employeeId || 'STAFF'}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-3 border-b border-slate-800">
                  <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{user?.department || 'Facilities Staff'}</span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/staff/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    <LayoutDashboard className="w-4 h-4 text-amber-400" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/staff/complaints"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    <ClipboardList className="w-4 h-4 text-amber-400" />
                    <span>My Assigned Work</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-[#0d1322] border-r border-slate-800/80 p-4 shrink-0">
          <div className="mb-4 px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Logged in Technician
            </span>
            <span className="text-xs font-bold text-amber-400 truncate block mt-0.5">
              {user?.department || 'Maintenance Staff'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono block">
              ID: {user?.employeeId || 'STF-01'}
            </span>
          </div>

          <nav className="space-y-1.5 flex-1">
            {staffNavItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/10 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Help Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/20 border border-amber-500/20 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px]">
              <Wrench className="w-3.5 h-3.5" />
              <span>SLA Workflow</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              1. Accept ticket &rarr; <strong>IN_PROGRESS</strong><br />
              2. Add progress notes<br />
              3. Upload photo proof &rarr; <strong>RESOLVED</strong>
            </p>
          </div>

          {/* Logout Action */}
          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative w-72 bg-[#0d1322] border-r border-slate-800 p-5 flex flex-col h-full z-10 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow">
                    <HardHat className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">CampusFix</h3>
                    <p className="text-[10px] text-amber-400 font-semibold uppercase">Staff Portal</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-4 px-3 py-2 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Logged In:</span>
                <span className="text-xs font-bold text-white block">{user?.name}</span>
                <span className="text-[11px] text-amber-400 font-mono block">
                  {user?.department} • {user?.employeeId}
                </span>
              </div>

              <nav className="space-y-1.5 flex-1">
                {staffNavItems.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                        active
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-amber-400" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
