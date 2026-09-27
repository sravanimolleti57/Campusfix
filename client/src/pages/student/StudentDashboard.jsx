import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/api';
import {
  GraduationCap,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ClipboardList,
  Search,
  Building,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import Loading from '../../components/ui/Loading';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import { getStatusBadge, getPriorityBadge, getCategoryIcon } from '../../utils/complaintHelpers';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    underReview: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    verified: 0,
  });
  const [recentComplaints, setRecentComplaints] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await complaintService.getMyComplaints({ limit: 5, sortBy: 'createdAt:desc' });
      if (data.success) {
        setStats(data.stats || {});
        setRecentComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.response?.data?.message || 'Unable to fetch your complaint records. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const pendingCount = (stats.submitted || 0) + (stats.underReview || 0) + (stats.assigned || 0);
  const activeRepairCount = stats.inProgress || 0;
  const resolvedCount = (stats.resolved || 0) + (stats.verified || 0) + (stats.closed || 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* 1. Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[90px] rounded-full pointer-events-none"></div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Student Portal</span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Verified Account
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Welcome back, {user?.name}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Roll No: <span className="font-mono text-slate-200">{user?.studentId || 'N/A'}</span> • Department: <span className="text-slate-200">{user?.department}</span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Link
            to="/student/report"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/25 hover:scale-[1.02] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report a Problem</span>
          </Link>

          <Link
            to="/student/complaints"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition-colors"
          >
            <ClipboardList className="w-4 h-4 text-blue-400" />
            <span>My Complaints</span>
          </Link>
        </div>
      </div>

      {/* 2. Loading / Error States */}
      {loading && <Loading message="Loading your complaint metrics and activity..." size="lg" className="py-12" />}

      {error && !loading && (
        <ErrorMessage
          title="Could not load complaints"
          message={error}
          onRetry={fetchDashboardData}
          variant="card"
        />
      )}

      {!loading && !error && (
        <>
          {/* 3. Stat Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Total Reported */}
            <div className="stat-card bg-slate-900/50 border border-slate-800 p-5 sm:p-6 rounded-2xl space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400 font-semibold leading-tight">Total Reported</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-white tracking-tight">{stats.total || 0}</p>
              <p className="text-[11px] text-slate-500">All submitted tickets</p>
            </div>

            {/* Pending / Under Review */}
            <div className="stat-card bg-slate-900/50 border border-slate-800 p-5 sm:p-6 rounded-2xl space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400 font-semibold leading-tight">Pending Review</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-amber-300 tracking-tight">{pendingCount}</p>
              <p className="text-[11px] text-slate-500">Awaiting triage</p>
            </div>

            {/* In Progress */}
            <div className="stat-card bg-slate-900/50 border border-slate-800 p-5 sm:p-6 rounded-2xl space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400 font-semibold leading-tight">Active Repairs</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-purple-300 tracking-tight">{activeRepairCount}</p>
              <p className="text-[11px] text-slate-500">Technician on-site</p>
            </div>

            {/* Resolved & Verified */}
            <div className="stat-card bg-slate-900/50 border border-slate-800 p-5 sm:p-6 rounded-2xl space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400 font-semibold leading-tight">Resolved</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-emerald-300 tracking-tight">{resolvedCount}</p>
              <p className="text-[11px] text-slate-500">Completed & verified</p>
            </div>
          </div>

          {/* 4. Recent Complaints Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Recent Complaint Submissions</h2>
                <p className="text-xs text-slate-400">Track resolution progress on your most recent requests</p>
              </div>

              {recentComplaints.length > 0 && (
                <Link
                  to="/student/complaints"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 transition-colors"
                >
                  <span>View Full History ({stats.total || 0})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {recentComplaints.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No complaints reported yet"
                description="Experience a classroom defect, water leakage, or Wi-Fi breakdown? Report it now and campus maintenance will address it."
                actionText="Report Your First Problem"
                onAction={() => navigate('/student/report')}
              />
            ) : (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
                <div className="divide-y divide-slate-800/60">
                  {recentComplaints.map((complaint) => {
                    const CategoryIcon = getCategoryIcon(complaint.category);
                    return (
                      <Link
                        key={complaint._id}
                        to={`/student/complaints/${complaint.complaintId || complaint._id}`}
                        className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors group"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                            <CategoryIcon className="w-5 h-5" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-blue-400">
                                {complaint.complaintId}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="text-xs font-medium text-slate-400">
                                {complaint.category}
                              </span>
                              {getPriorityBadge(complaint.priority)}
                            </div>

                            <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                              {complaint.title}
                            </h3>

                            <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                              <span className="flex items-center gap-1 text-slate-300">
                                <Building className="w-3 h-3 text-slate-500" />
                                {complaint.location}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                {new Date(complaint.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                          {getStatusBadge(complaint.status)}
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
