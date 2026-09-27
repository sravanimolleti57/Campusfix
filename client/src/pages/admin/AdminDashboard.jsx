import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Users,
  Briefcase,
  TrendingUp,
  FileCheck,
  Eye,
  Shield,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Calendar,
  Star,
  MessageSquare,
  X,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import Loading from '../../components/ui/Loading';
import ErrorMessage from '../../components/ui/ErrorMessage';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Admin Feedback Modal state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbacksList, setFeedbacksList] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('');

  const fetchFeedbacks = async (rating = '') => {
    try {
      setFeedbackLoading(true);
      const params = {};
      if (rating) params.rating = rating;
      const { data } = await adminService.getFeedback(params);
      if (data.success) {
        setFeedbacksList(data.feedbacks || []);
      }
    } catch (err) {
      console.error('Failed to load feedbacks:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const openFeedbackModal = () => {
    setFeedbackModalOpen(true);
    fetchFeedbacks(selectedRatingFilter);
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await adminService.getStats();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setError(err.response?.data?.message || 'Unable to retrieve real MongoDB analytics from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <Loading message="Aggregating live MongoDB institutional analytics..." size="lg" className="py-24" />;
  }

  if (error || !stats) {
    return (
      <ErrorMessage
        title="Admin Analytics Unavailable"
        message={error || 'Could not compile campus facilities statistics.'}
        onRetry={fetchStats}
        variant="card"
      />
    );
  }

  const { statusCounts, priorityCounts, charts, performance, users } = stats;

  const statusCards = [
    { label: 'Total Logged', value: stats.totalComplaints, icon: Layers, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Submitted', value: statusCounts.SUBMITTED, icon: Clock, color: 'text-blue-300 bg-blue-500/10 border-blue-500/20' },
    { label: 'Under Review', value: statusCounts.UNDER_REVIEW, icon: Eye, color: 'text-amber-300 bg-amber-500/10 border-amber-500/20' },
    { label: 'Staff Assigned', value: statusCounts.ASSIGNED, icon: Briefcase, color: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20' },
    { label: 'In Progress', value: statusCounts.IN_PROGRESS, icon: RefreshCw, color: 'text-purple-300 bg-purple-500/10 border-purple-500/20' },
    { label: 'Resolved', value: statusCounts.RESOLVED, icon: CheckCircle2, color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Verified', value: statusCounts.VERIFIED, icon: FileCheck, color: 'text-teal-300 bg-teal-500/10 border-teal-500/20' },
    { label: 'Closed', value: statusCounts.CLOSED, icon: CheckCircle2, color: 'text-slate-400 bg-slate-800 border-slate-700' },
    { label: 'Reopened', value: statusCounts.REOPENED, icon: AlertTriangle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Campus Facilities Intelligence</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live DB Sync
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time infrastructure defect dispatching, technician SLAs, and student verification metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/complaints?status=SUBMITTED"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-amber-600/20 transition-all"
          >
            <Clock className="w-4 h-4" />
            <span>Triage Pending ({statusCounts.SUBMITTED + statusCounts.UNDER_REVIEW})</span>
          </Link>
          <Link
            to="/admin/staff"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <span>Staff Workload</span>
          </Link>
        </div>
      </div>

      {/* 2. Primary 9 Status Lifecycle Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
        {statusCards.map((sc, idx) => {
          const Icon = sc.icon;
          return (
            <div
              key={idx}
              className="stat-card p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2"
            >
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${sc.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">{sc.value || 0}</p>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">
                {sc.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 3. Resolution Performance KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{performance.avgTurnaroundHours} hrs</p>
          <div>
            <p className="text-xs font-bold text-slate-300">Avg Turnaround</p>
            <p className="text-[11px] text-slate-500">Defect to on-site fix</p>
          </div>
        </div>

        <div className="stat-card bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-300">{performance.verifiedRate}%</p>
          <div>
            <p className="text-xs font-bold text-slate-300">Resolution Rate</p>
            <p className="text-[11px] text-slate-500">{performance.resolvedTotal} issues resolved</p>
          </div>
        </div>

        <div className="stat-card bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-300">{performance.averageRating} / 5.0</p>
          <div>
            <p className="text-xs font-bold text-slate-300">Student Satisfaction</p>
            <p className="text-[11px] text-slate-500">Based on verified ratings</p>
          </div>
        </div>

        <div className="stat-card bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{users.totalUsers}</p>
          <div>
            <p className="text-xs font-bold text-slate-300">Active Campus Users</p>
            <p className="text-[11px] text-slate-500">{users.students} Students · {users.staff} Staff</p>
          </div>
        </div>
      </div>

      {/* 4. Interactive Recharts Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Complaints by Category */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span>Complaints by Problem Category</span>
              </h3>
              <p className="text-[11px] text-slate-400">Total vs Resolved tickets per trade classification</p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.byCategory} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="total" name="Total Logged" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Complaints by Status */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-indigo-400" />
                <span>Complaints by Current Status</span>
              </h3>
              <p className="text-[11px] text-slate-400">Distribution across active workflow stages</p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.byStatus.filter((s) => s.count > 0)}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={50}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {charts.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Monthly Complaint Trends */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Monthly Complaint Volume & Resolution Trends</span>
              </h3>
              <p className="text-[11px] text-slate-400">6-Month historical intake vs closure curve</p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="reported" name="Complaints Logged" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReported)" strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" name="Complaints Resolved" stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Complaints by Priority */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span>Complaints by Urgency & Priority</span>
              </h3>
              <p className="text-[11px] text-slate-400">Low, Medium, High, and Critical triage counts</p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.byPriority} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                />
                <Bar dataKey="count" name="Complaint Count" radius={[6, 6, 0, 0]}>
                  {charts.byPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Student Feedback & Satisfaction Analytics Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Student Feedback & Satisfaction Metrics</span>
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated real-time ratings from verified complaint resolutions across campus
            </p>
          </div>

          <button
            type="button"
            onClick={openFeedbackModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span>View All Feedback Records</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Average Rating & Summary Box */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Satisfaction</span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-amber-300">
                {stats.feedbackStats?.averageRating || performance.averageRating || '5.0'}
              </span>
              <span className="text-lg text-slate-500 font-bold">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    Math.round(Number(stats.feedbackStats?.averageRating || performance.averageRating || 5)) >= star
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-slate-400">
              Based on <strong className="text-white font-semibold">{stats.feedbackStats?.totalFeedback || 0}</strong> verified student reviews
            </p>
          </div>

          {/* Star Distribution Breakdown Bars */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6 space-y-2.5 flex flex-col justify-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1">Rating Breakdown</span>
            {[5, 4, 3, 2, 1].map((ratingVal) => {
              const count = stats.feedbackStats?.ratingDistribution?.[ratingVal] || 0;
              const total = stats.feedbackStats?.totalFeedback || 1;
              const percentage = Math.round((count / (total || 1)) * 100);
              return (
                <div key={ratingVal} className="flex items-center gap-3 text-xs">
                  <span className="w-10 text-slate-300 font-semibold flex items-center gap-1">
                    {ratingVal} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                  </span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${stats.feedbackStats?.totalFeedback ? percentage : 0}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-slate-400 font-mono text-[11px]">
                    {count} ({stats.feedbackStats?.totalFeedback ? percentage : 0}%)
                  </span>
                </div>
              );
            })}
          </div>

          {/* Recent Feedback Feed */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latest Student Reviews</span>
              <span className="text-[10px] text-slate-500">Live verified sign-offs</span>
            </div>

            <div className="space-y-3 divide-y divide-slate-800/60 max-h-52 overflow-y-auto pr-1">
              {stats.feedbackStats?.recentFeedback && stats.feedbackStats.recentFeedback.length > 0 ? (
                stats.feedbackStats.recentFeedback.map((fb, idx) => (
                  <div key={fb._id || idx} className="pt-2.5 first:pt-0 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white truncate max-w-[140px]">
                        {fb.student?.name || 'Verified Student'}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              fb.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {fb.comment && (
                      <p className="text-[11px] text-slate-300 italic line-clamp-2">
                        "{fb.comment}"
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{fb.complaint?.complaintId || 'Complaint Ticket'}</span>
                      <span>{fb.submittedAt ? new Date(fb.submittedAt).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No verified student reviews recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Feedback Records Modal */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Student Feedback & Reviews Registry</h3>
                  <p className="text-[11px] text-slate-400">Live verified resolution sign-offs from database</p>
                </div>
              </div>
              <button
                onClick={() => setFeedbackModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rating Filter Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Filter by Rating:
              </span>
              {['', '5', '4', '3', '2', '1'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSelectedRatingFilter(r);
                    fetchFeedbacks(r);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    selectedRatingFilter === r
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {r === '' ? 'All Reviews' : `${r} ★`}
                </button>
              ))}
            </div>

            {/* Feedback List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {feedbackLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Loading feedback from MongoDB...</span>
                </div>
              ) : feedbacksList.length > 0 ? (
                feedbacksList.map((fb) => (
                  <div
                    key={fb._id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-xs">
                            {fb.student?.name || 'Student'}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({fb.student?.studentId || fb.student?.department || 'Student'})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Complaint:{' '}
                          <span className="text-blue-400 font-mono font-semibold">
                            {fb.complaint?.complaintId}
                          </span>{' '}
                          - {fb.complaint?.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              fb.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-800'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold text-amber-300 ml-1">
                          {fb.rating}.0
                        </span>
                      </div>
                    </div>

                    {fb.comment && (
                      <p className="text-xs text-slate-200 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 italic">
                        "{fb.comment}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                      <span>Category: {fb.complaint?.category || 'Campus Facility'}</span>
                      <span>
                        Verified on: {fb.submittedAt ? new Date(fb.submittedAt).toLocaleString() : ''}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No feedback records found matching selected filter.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setFeedbackModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
