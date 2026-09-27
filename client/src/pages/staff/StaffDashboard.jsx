import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { staffService } from '../../services/api';
import {
  Wrench,
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  MapPin,
  RefreshCw,
  HardHat,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

const priorityColors = {
  Critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

const statusColors = {
  SUBMITTED: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  UNDER_REVIEW: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  ASSIGNED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  VERIFIED: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
  CLOSED: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
  REOPENED: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const StaffDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      totalAssigned: 0,
      pendingAssignments: 0,
      inProgress: 0,
      resolved: 0,
      highPriority: 0,
      priorityCounts: { Low: 0, Medium: 0, High: 0, Critical: 0 },
      categoryBreakdown: [],
    },
    recentTasks: [],
  });
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await staffService.getDashboard();
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load technician dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStartWork = async (complaintId, e) => {
    e.stopPropagation();
    try {
      setActionLoadingId(complaintId);
      const res = await staffService.startWork(complaintId, {
        notes: 'Technician accepted assignment directly from dashboard and commenced work.',
      });
      if (res.data.success) {
        showToast('Assignment accepted! Work status changed to IN_PROGRESS.', 'success');
        fetchDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not start work on complaint', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const { stats, recentTasks } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#0e1628] to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="flex items-center gap-4 sm:gap-5 z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20 shrink-0">
            <HardHat className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Staff Maintenance Hub
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Online
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Welcome back, {user?.name || 'Technician'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Assigned Trade: <span className="text-slate-200 font-semibold">{user?.department}</span> •
              Employee ID: <span className="font-mono text-amber-300 font-semibold">{user?.employeeId || 'STAFF'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/staff/complaints"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-xs font-bold text-white shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 transition"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Open Tasks Queue</span>
          </Link>
        </div>
      </div>

      {/* 5 Primary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Assigned */}
        <div className="stat-card bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Assigned</span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{stats.totalAssigned}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Lifetime assigned tickets</p>
          </div>
        </div>

        {/* Pending Assignments */}
        <div className={`stat-card bg-slate-900/60 border rounded-2xl p-5 shadow-sm transition ${
          stats.pendingAssignments > 0
            ? 'border-amber-500/40 bg-amber-500/5'
            : 'border-slate-800 hover:border-slate-700'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Start</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-amber-400">{stats.pendingAssignments}</h3>
              {stats.pendingAssignments > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                  Action Needed
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting work commencement</p>
          </div>
        </div>

        {/* In-Progress */}
        <div className="stat-card bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">In Progress</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <PlayCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-blue-400">{stats.inProgress}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Actively under repair</p>
          </div>
        </div>

        {/* Resolved */}
        <div className="stat-card bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Resolved Work</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-400">{stats.resolved}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Repairs completed</p>
          </div>
        </div>

        {/* High Priority Alerts */}
        <div className={`stat-card bg-slate-900/60 border rounded-2xl p-5 shadow-sm transition ${
          stats.highPriority > 0
            ? 'border-rose-500/40 bg-rose-500/5'
            : 'border-slate-800 hover:border-slate-700'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">High / Critical</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-rose-400">{stats.highPriority}</h3>
              {stats.highPriority > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300">
                  Urgent
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">High severity campus issues</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Urgent Queue & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Urgent & Active Tasks Queue */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">Active Assigned Tasks</h3>
              </div>
              <Link
                to="/staff/complaints"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
              >
                <span>View Full Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading assigned tasks...</p>
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto" />
                <h4 className="text-sm font-bold text-white">All Caught Up!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  You have no pending or active repair assignments at this moment. New dispatches will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 mt-2">
                {recentTasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/staff/complaints/${task._id}`)}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 px-2 rounded-xl transition cursor-pointer group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {task.complaintId}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[task.status] || 'bg-slate-800 text-slate-300'}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityColors[task.priority] || 'bg-slate-800 text-slate-300'}`}>
                          {task.priority} Priority
                        </span>
                        <span className="text-[11px] text-slate-400">• {task.category}</span>
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition truncate">
                        {task.title}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate max-w-xs">{task.location}</span>
                        </span>
                        <span>•</span>
                        <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {(task.status === 'ASSIGNED' || task.status === 'REOPENED') && (
                        <button
                          onClick={(e) => handleStartWork(task._id, e)}
                          disabled={actionLoadingId === task._id}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/10 transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>{actionLoadingId === task._id ? 'Starting...' : 'Start Work'}</span>
                        </button>
                      )}

                      {task.status === 'IN_PROGRESS' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/staff/complaints/${task._id}`);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/10 transition flex items-center gap-1.5"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      )}

                      <span className="p-1 rounded-lg text-slate-400 group-hover:text-white transition">
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Showing up to 6 most urgent assigned tasks</span>
            <Link to="/staff/complaints" className="text-amber-400 hover:underline">
              View all {stats.totalAssigned} tasks &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column (1 Col): Priority & Category Breakdown */}
        <div className="space-y-6">
          {/* Priority Distribution */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Assigned Priority Breakdown</span>
            </h3>

            <div className="space-y-3">
              {[
                { label: 'Critical Priority', key: 'Critical', color: 'bg-rose-500', count: stats.priorityCounts.Critical },
                { label: 'High Priority', key: 'High', color: 'bg-orange-500', count: stats.priorityCounts.High },
                { label: 'Medium Priority', key: 'Medium', color: 'bg-amber-500', count: stats.priorityCounts.Medium },
                { label: 'Low Priority', key: 'Low', color: 'bg-emerald-500', count: stats.priorityCounts.Low },
              ].map((item) => {
                const pct = stats.totalAssigned > 0 ? Math.round((item.count / stats.totalAssigned) * 100) : 0;
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">{item.label}</span>
                      <span className="font-bold text-white">{item.count} <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trade / Category Breakdown */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Problem Categories</span>
            </h3>

            {stats.categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No categories assigned yet</p>
            ) : (
              <div className="space-y-2">
                {stats.categoryBreakdown.map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs"
                  >
                    <span className="font-medium text-slate-200">{cat.category}</span>
                    <span className="px-2.5 py-1 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {cat.count} ticket{cat.count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
