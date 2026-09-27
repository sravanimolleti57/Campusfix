import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { complaintService } from '../../services/api';
import {
  ClipboardList,
  Search,
  Filter,
  PlusCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Building,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Loading from '../../components/ui/Loading';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import {
  getStatusBadge,
  getPriorityBadge,
  getCategoryIcon,
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
} from '../../utils/complaintHelpers';

const MyComplaintsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters & Pagination state initialized from URL search params or defaults
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [priority, setPriority] = useState(searchParams.get('priority') || 'All');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [dateFilter, setDateFilter] = useState(searchParams.get('dateFilter') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page'), 10) || 1);
  const [pageSize, setPageSize] = useState(8);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComplaints, setTotalComplaints] = useState(0);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (category !== 'All') params.category = category;
      if (priority !== 'All') params.priority = priority;
      if (status !== 'All') params.status = status;
      if (dateFilter && dateFilter !== 'all') params.dateFilter = dateFilter;

      const { data } = await complaintService.getMyComplaints(params);

      if (data.success) {
        setComplaints(data.data || data.complaints || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalComplaints(data.pagination.total || 0);
        } else {
          setTotalPages(data.totalPages || 1);
          setTotalComplaints(data.totalComplaints || 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch complaints list:', err);
      setError(err.response?.data?.message || 'Unable to retrieve complaint history from server.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, sortBy, sortOrder, category, priority, status, dateFilter, search]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Handle Search Input Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchComplaints();
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setPriority('All');
    setStatus('All');
    setDateFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    category !== 'All' ||
    priority !== 'All' ||
    status !== 'All' ||
    (dateFilter && dateFilter !== 'all') ||
    sortBy !== 'createdAt' ||
    sortOrder !== 'desc';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My Campus Complaints</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {totalComplaints} Total
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and track all your logged facilities maintenance tickets
          </p>
        </div>

        <Link
          to="/student/report"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/25 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Problem</span>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
        {/* Search input + Sort row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, location, description, or complaint ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-24 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors"
            >
              Search
            </button>
          </form>

          {/* Sort By Dropdown */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split(':');
                setSortBy(field);
                setSortOrder(order);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
            >
              <option value="createdAt:desc">Sort: Newest First</option>
              <option value="createdAt:asc">Sort: Oldest First</option>
              <option value="priority:desc">Sort: Highest Priority</option>
              <option value="priority:asc">Sort: Lowest Priority</option>
              <option value="status:asc">Sort: By Status</option>
              <option value="title:asc">Sort: Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-800/60 text-xs">
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="All">All Categories</option>
              {COMPLAINT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="All">All Priorities</option>
              {COMPLAINT_PRIORITIES.map((pri) => (
                <option key={pri} value={pri}>
                  {pri} Priority
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {COMPLAINT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Clear Filters Action */}
          <div className="flex items-end col-span-2 sm:col-span-1">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:hover:bg-slate-800"
              title="Clear all active search and filter constraints"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading && <Loading message="Loading complaints..." size="lg" className="py-16" />}

      {error && !loading && (
        <ErrorMessage
          title="Failed to retrieve complaints"
          message={error}
          onRetry={fetchComplaints}
          variant="card"
        />
      )}

      {!loading && !error && (
        <>
          {complaints.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={hasActiveFilters ? 'No matching complaints found' : 'No complaints submitted yet'}
              description={
                hasActiveFilters
                  ? 'Try modifying your search keywords or resetting category and status filters.'
                  : 'You have not submitted any campus facilities complaints yet. Click below to file your first ticket.'
              }
              actionText={hasActiveFilters ? 'Clear All Filters' : 'Report a Problem'}
              onAction={hasActiveFilters ? handleResetFilters : () => navigate('/student/report')}
            />
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {/* Complaints Table (Desktop) / Card Stack (Mobile) */}
              <div className="divide-y divide-slate-800/80">
                {complaints.map((item) => {
                  const CategoryIcon = getCategoryIcon(item.category);
                  return (
                    <div
                      key={item._id}
                      className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                          <CategoryIcon className="w-6 h-6" />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-blue-400">
                              {item.complaintId}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-xs font-semibold text-slate-300">
                              {item.category}
                            </span>
                            {getPriorityBadge(item.priority)}
                            {item.images?.length > 0 && (
                              <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full font-medium">
                                📷 {item.images.length} photo{item.images.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>

                          <Link
                            to={`/student/complaints/${item.complaintId || item._id}`}
                            className="text-sm sm:text-base font-bold text-white group-hover:text-blue-400 transition-colors block"
                          >
                            {item.title}
                          </Link>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1 text-slate-300">
                              <Building className="w-3 h-3 text-slate-500" />
                              {item.location}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {new Date(item.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            {item.assignedTo && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-300">
                                  Staff: {item.assignedTo.name} ({item.assignedTo.department})
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                        {getStatusBadge(item.status)}

                        <Link
                          to={`/student/complaints/${item.complaintId || item._id}`}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                  <span>
                    Showing Page <strong className="text-white">{currentPage}</strong> of{' '}
                    <strong className="text-white">{totalPages}</strong> ({totalComplaints} items)
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage <= 1}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-800 flex items-center gap-1 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                      .map((p) => (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-lg font-bold transition-colors ${
                            currentPage === p
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      ))}

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-800 flex items-center gap-1 transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyComplaintsPage;
