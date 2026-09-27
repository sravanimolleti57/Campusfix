import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  ClipboardList,
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Eye,
  User,
  Building,
  Calendar,
  Briefcase,
  Edit,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Shield,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import Loading from '../../components/ui/Loading';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import {
  getStatusBadge,
  getPriorityBadge,
  getCategoryIcon,
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
} from '../../utils/complaintHelpers';
import ComplaintTimeline from '../../components/complaints/ComplaintTimeline';

const AdminComplaintsPage = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [priority, setPriority] = useState(searchParams.get('priority') || 'All');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [assignedTo, setAssignedTo] = useState(searchParams.get('assignedTo') || 'All');
  const [dateFilter, setDateFilter] = useState(searchParams.get('dateFilter') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page'), 10) || 1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComplaints, setTotalComplaints] = useState(0);

  // Staff members list for assignment dropdown
  const [staffList, setStaffList] = useState([]);

  // Triage / Edit Modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [triageModalOpen, setTriageModalOpen] = useState(false);
  const [triageForm, setTriageForm] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    adminNotes: '',
    resolutionNotes: '',
  });
  const [updating, setUpdating] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch complaints
  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (category !== 'All') params.category = category;
      if (priority !== 'All') params.priority = priority;
      if (status !== 'All') params.status = status;
      if (assignedTo !== 'All') params.assignedTo = assignedTo;
      if (dateFilter && dateFilter !== 'all') params.dateFilter = dateFilter;

      const { data } = await adminService.getComplaints(params);
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
      console.error('Failed to load admin complaints:', err);
      setError(err.response?.data?.message || 'Could not retrieve complaints list.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, category, priority, status, assignedTo, dateFilter, search]);

  // Fetch staff list for assignment dropdown
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const { data } = await adminService.getStaff();
        if (data.success && data.staff) {
          setStaffList(data.staff);
        }
      } catch (err) {
        console.warn('Could not load staff list for assignment:', err.message);
      }
    };
    loadStaff();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Open triage modal with current values and fetch latest real database timeline
  const handleOpenTriage = async (complaint) => {
    setSelectedComplaint(complaint);
    setTriageForm({
      status: complaint.status || 'SUBMITTED',
      priority: complaint.priority || 'Medium',
      assignedTo: complaint.assignedTo?._id || '',
      adminNotes: complaint.adminNotes || '',
      resolutionNotes: complaint.resolutionNotes || '',
    });
    setTriageModalOpen(true);

    try {
      const { data } = await adminService.getComplaintById(complaint._id);
      if (data.success && data.complaint) {
        setSelectedComplaint(data.complaint);
      }
    } catch (err) {
      console.error('Failed to load complaint timeline:', err);
    }
  };

  // Submit triage / update
  const handleTriageSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = {
        status: triageForm.status,
        priority: triageForm.priority,
        assignedTo: triageForm.assignedTo || 'unassign',
        adminNotes: triageForm.adminNotes,
        resolutionNotes: triageForm.resolutionNotes,
      };

      const { data } = await adminService.updateComplaint(selectedComplaint._id, payload);
      if (data.success) {
        showToast(`Complaint ${selectedComplaint.complaintId} updated successfully`, 'success');
        setTriageModalOpen(false);
        fetchComplaints();
      }
    } catch (err) {
      console.error('Triage error:', err);
      showToast(err.response?.data?.message || 'Failed to update complaint', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Handle complaint deletion
  const handleDeleteConfirm = async () => {
    if (!complaintToDelete) return;
    setDeleting(true);
    try {
      const { data } = await adminService.deleteComplaint(complaintToDelete._id);
      if (data.success) {
        showToast(`Complaint ${complaintToDelete.complaintId} deleted`, 'info');
        setDeleteModalOpen(false);
        fetchComplaints();
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast(err.response?.data?.message || 'Could not delete ticket', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setPriority('All');
    setStatus('All');
    setAssignedTo('All');
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
    assignedTo !== 'All' ||
    dateFilter !== 'all' ||
    sortBy !== 'createdAt' ||
    sortOrder !== 'desc';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Campus Complaints Triage Desk</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {totalComplaints} Active Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review incoming student requests, assess severity, allocate trade technicians, and update status
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCurrentPage(1);
              fetchComplaints();
            }}
            className="md:col-span-2 relative"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, location, complaint ID, or student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-24 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold transition-colors"
            >
              Search
            </button>
          </form>

          {/* Sort By */}
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
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer"
            >
              <option value="createdAt:desc">Sort: Newest Logged</option>
              <option value="createdAt:asc">Sort: Oldest Logged</option>
              <option value="priority:desc">Sort: Highest Urgency</option>
              <option value="priority:asc">Sort: Lowest Urgency</option>
              <option value="status:asc">Sort: Lifecycle Status</option>
              <option value="title:asc">Sort: Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2 border-t border-slate-800/60 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="All">All Categories</option>
              {COMPLAINT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="All">All Priorities</option>
              {COMPLAINT_PRIORITIES.map((pri) => (
                <option key={pri} value={pri}>
                  {pri}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {COMPLAINT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Assigned Staff</label>
            <select
              value={assignedTo}
              onChange={(e) => {
                setAssignedTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="All">All Technicians</option>
              <option value="unassigned">Unassigned Only</option>
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div className="flex items-end col-span-2 sm:col-span-1">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
              title="Clear all active search and filter constraints"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      {loading && <Loading message="Loading complaints queue..." size="lg" className="py-20" />}

      {error && !loading && (
        <ErrorMessage
          title="Could not load complaints queue"
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
              title="No complaints match your filters"
              description="Try adjusting your search query or reset filter settings to see more records."
              actionText="Reset All Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Ticket</th>
                      <th className="px-6 py-4">Reporter</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Urgency</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Assigned Staff</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {complaints.map((item) => {
                      const CategoryIcon = getCategoryIcon(item.category);
                      return (
                        <tr key={item._id} className="hover:bg-slate-800/30 transition-colors">
                          {/* Ticket */}
                          <td className="px-6 py-4 space-y-1">
                            <span className="font-mono font-bold text-amber-400 text-xs">
                              {item.complaintId}
                            </span>
                            <p className="font-bold text-white text-xs max-w-xs truncate">
                              {item.title}
                            </p>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <CategoryIcon className="w-3 h-3 text-blue-400" />
                              {item.category}
                            </span>
                          </td>

                          {/* Reporter */}
                          <td className="px-6 py-4 space-y-0.5">
                            <span className="font-semibold text-slate-200 block">
                              {item.reportedBy?.name || 'Unknown Student'}
                            </span>
                            <span className="text-[11px] text-slate-400 block font-mono">
                              {item.reportedBy?.studentId || item.reportedBy?.email}
                            </span>
                          </td>

                          {/* Location */}
                          <td className="px-6 py-4 text-slate-300 max-w-[180px] truncate">
                            <span className="flex items-center gap-1">
                              <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </span>
                          </td>

                          {/* Priority */}
                          <td className="px-6 py-4">{getPriorityBadge(item.priority)}</td>

                          {/* Status */}
                          <td className="px-6 py-4">{getStatusBadge(item.status)}</td>

                          {/* Assigned Staff */}
                          <td className="px-6 py-4">
                            {item.assignedTo ? (
                              <div className="space-y-0.5">
                                <span className="font-semibold text-indigo-300 block">
                                  {item.assignedTo.name}
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  {item.assignedTo.department}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-400/80 font-medium italic">
                                Unassigned
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenTriage(item)}
                                className="px-3 py-1.5 rounded-xl bg-amber-600/15 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Triage</span>
                              </button>

                              <button
                                onClick={() => {
                                  setComplaintToDelete(item);
                                  setDeleteModalOpen(true);
                                }}
                                className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-300 transition-colors"
                                title="Delete Ticket"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Page <strong className="text-white">{currentPage}</strong> of{' '}
                    <strong className="text-white">{totalPages}</strong> ({totalComplaints} items)
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage <= 1}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Triage Modal */}
      {triageModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b0f19]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="font-mono font-bold text-amber-400 text-xs">
                  {selectedComplaint.complaintId}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedComplaint.title}</h3>
                <p className="text-xs text-slate-400">
                  Reported by {selectedComplaint.reportedBy?.name} • {selectedComplaint.location}
                </p>
              </div>
              <button
                onClick={() => setTriageModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description Preview */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Student Description:</span>
              <p className="text-xs text-slate-200 whitespace-pre-line">{selectedComplaint.description}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleTriageSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Change Status</label>
                  <select
                    value={triageForm.status}
                    onChange={(e) => setTriageForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    {COMPLAINT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Change Priority</label>
                  <select
                    value={triageForm.priority}
                    onChange={(e) => setTriageForm((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    {COMPLAINT_PRIORITIES.map((pr) => (
                      <option key={pr} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assign Staff */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Assign Technician</label>
                  <select
                    value={triageForm.assignedTo}
                    onChange={(e) => setTriageForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">(Unassigned)</option>
                    {staffList.map((stf) => (
                      <option key={stf._id} value={stf._id}>
                        {stf.name} ({stf.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Internal Administration / Triage Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes for staff technicians (e.g. key location, parts needed, high urgency reason)..."
                  value={triageForm.adminNotes}
                  onChange={(e) => setTriageForm((prev) => ({ ...prev, adminNotes: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTriageModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Triage Updates</span>
                </button>
              </div>
            </form>

            {/* Real Database Complaint Activity Timeline */}
            <div className="pt-2">
              <ComplaintTimeline
                timeline={selectedComplaint.timeline || []}
                currentStatus={selectedComplaint.status}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Permanently Delete Complaint Ticket?"
        message={`Are you sure you want to delete ticket ${complaintToDelete?.complaintId}? This will remove it from all student and staff reports.`}
        confirmText="Yes, Delete Ticket"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default AdminComplaintsPage;
