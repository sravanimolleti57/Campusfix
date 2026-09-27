import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { staffService } from '../../services/api';
import {
  Wrench,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Eye,
  MapPin,
  RefreshCw,
  X,
  HardHat,
  Calendar,
  Sparkles,
  User,
  SlidersHorizontal,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Electrical',
  'Plumbing',
  'Internet/Wi-Fi',
  'Classroom',
  'Laboratory',
  'Hostel',
  'Cleaning',
  'Furniture',
  'Security',
  'Other',
];

const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];

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

const StaffComplaintsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // State
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    highPriority: 0,
  });

  // Filter States
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'inProgress', 'resolved', 'highPriority'
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [priority, setPriority] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComplaints, setTotalComplaints] = useState(0);

  // Quick Action Modal (Start Work confirmation)
  const [startWorkModal, setStartWorkModal] = useState({
    open: false,
    complaint: null,
    notes: '',
    loading: false,
  });

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        sortBy,
      };

      if (search.trim()) params.search = search.trim();
      if (category !== 'All') params.category = category;
      if (priority !== 'All') params.priority = priority;

      // Handle activeTab filtering
      if (activeTab === 'pending') {
        params.status = 'ASSIGNED';
      } else if (activeTab === 'inProgress') {
        params.status = 'IN_PROGRESS';
      } else if (activeTab === 'resolved') {
        params.status = 'completed'; // mapped in controller to RESOLVED, VERIFIED, CLOSED
      } else if (activeTab === 'highPriority') {
        params.priority = 'High'; // Or Critical
      }

      const res = await staffService.getComplaints(params);
      if (res.data.success) {
        setComplaints(res.data.complaints);
        setTotalPages(res.data.totalPages);
        setTotalComplaints(res.data.totalComplaints);
        if (res.data.tabCounts) {
          setTabCounts(res.data.tabCounts);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch assigned complaints', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, activeTab, category, priority, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setPriority('All');
    setSortBy('createdAt:desc');
    setActiveTab('all');
    setPage(1);
  };

  // Start Work Action
  const handleConfirmStartWork = async () => {
    if (!startWorkModal.complaint) return;
    try {
      setStartWorkModal((prev) => ({ ...prev, loading: true }));
      const res = await staffService.startWork(startWorkModal.complaint._id, {
        notes: startWorkModal.notes.trim() || 'Technician accepted assignment and commenced repair.',
      });
      if (res.data.success) {
        showToast('Work started! Status transitioned to IN_PROGRESS.', 'success');
        setStartWorkModal({ open: false, complaint: null, notes: '', loading: false });
        fetchComplaints();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not start work on ticket', 'error');
      setStartWorkModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              My Assigned Work
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {totalComplaints} Active Tickets
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complaints assigned directly to your department and technician ID.
          </p>
        </div>

        <button
          onClick={fetchComplaints}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {[
          { id: 'all', label: 'All Tasks', count: tabCounts.all },
          { id: 'pending', label: 'Pending Start', count: tabCounts.pending, badgeColor: 'bg-amber-500/20 text-amber-300' },
          { id: 'inProgress', label: 'In Progress', count: tabCounts.inProgress, badgeColor: 'bg-blue-500/20 text-blue-300' },
          { id: 'resolved', label: 'Resolved / Done', count: tabCounts.resolved, badgeColor: 'bg-emerald-500/20 text-emerald-300' },
          { id: 'highPriority', label: 'Urgent / High', count: tabCounts.highPriority, badgeColor: 'bg-rose-500/20 text-rose-300' },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                active
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                active ? 'bg-slate-950/20 text-slate-950' : tab.badgeColor || 'bg-slate-800 text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket ID, title, campus location, or description..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition cursor-pointer"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  Priority: {p}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition cursor-pointer"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="priority:desc">High Priority First</option>
              <option value="status:asc">Status Progression</option>
            </select>

            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-sm hover:-translate-y-0.5"
            >
              Filter
            </button>

            {(search || category !== 'All' || priority !== 'All' || activeTab !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Complaints List Cards */}
      {loading ? (
        <div className="py-20 text-center bg-slate-900/30 border border-slate-800 rounded-2xl">
          <RefreshCw className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-white">Retrieving assigned complaints...</p>
          <p className="text-xs text-slate-400 mt-1">Checking campus dispatch server</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/30 border border-slate-800 rounded-2xl p-8 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Complaints Match Your Criteria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try resetting your search query or status filter to see other maintenance tasks assigned to you.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((item) => (
            <div
              key={item._id}
              className="stat-card bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {item.complaintId}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusColors[item.status] || 'bg-slate-800 text-slate-300'}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${priorityColors[item.priority] || 'bg-slate-800 text-slate-300'}`}>
                      {item.priority} Priority
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {item.category}
                    </span>
                  </div>

                  <Link
                    to={`/staff/complaints/${item._id}`}
                    className="block text-base font-bold text-white hover:text-amber-400 transition"
                  >
                    {item.title}
                  </Link>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Right side: Location & Action buttons */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/60">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-medium truncate max-w-xs">{item.location}</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* If ASSIGNED: Show Start Work Action */}
                    {(item.status === 'ASSIGNED' || item.status === 'REOPENED') && (
                      <button
                        onClick={() =>
                          setStartWorkModal({
                            open: true,
                            complaint: item,
                            notes: '',
                            loading: false,
                          })
                        }
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/10 transition"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Accept & Start</span>
                      </button>
                    )}

                    {/* If IN_PROGRESS: Show Progress / Resolve Actions */}
                    {item.status === 'IN_PROGRESS' && (
                      <Link
                        to={`/staff/complaints/${item._id}`}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/10 transition"
                      >
                        <Wrench className="w-4 h-4" />
                        <span>Log Progress & Resolve</span>
                      </Link>
                    )}

                    {/* View Details Link */}
                    <Link
                      to={`/staff/complaints/${item._id}`}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer: Reporter & Dates */}
              <div className="pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reported by: <strong className="text-slate-300 font-semibold">{item.reportedBy?.name || 'Student'}</strong> ({item.reportedBy?.department || 'Student'})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Logged: {new Date(item.createdAt).toLocaleDateString()}</span>
                  {item.resolvedAt && (
                    <span className="text-emerald-400">
                      Resolved: {new Date(item.resolvedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 text-xs text-slate-400">
              <span>
                Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalComplaints} items)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Start Work Confirmation Modal */}
      {startWorkModal.open && startWorkModal.complaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <PlayCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Accept & Start Work</h3>
                  <p className="text-[11px] text-slate-400">Lifecycle transition: ASSIGNED &rarr; IN_PROGRESS</p>
                </div>
              </div>
              <button
                onClick={() => setStartWorkModal({ open: false, complaint: null, notes: '', loading: false })}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold text-amber-400">{startWorkModal.complaint.complaintId}</span>
                <span className="text-slate-400">• {startWorkModal.complaint.category}</span>
              </div>
              <p className="text-sm font-bold text-white">{startWorkModal.complaint.title}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{startWorkModal.complaint.location}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Initial Work Notes / Estimated Time (Optional)
              </label>
              <textarea
                rows="3"
                value={startWorkModal.notes}
                onChange={(e) =>
                  setStartWorkModal((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="e.g. Arrived on site with required replacement parts. Commencing diagnosis..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setStartWorkModal({ open: false, complaint: null, notes: '', loading: false })}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStartWork}
                disabled={startWorkModal.loading}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/10 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <PlayCircle className="w-4 h-4" />
                <span>{startWorkModal.loading ? 'Commencing...' : 'Confirm & Start Work'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffComplaintsPage;
