import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Search,
  Filter,
  Shield,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Eye,
  Mail,
  Phone,
  Building,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  UserCheck,
  UserX,
} from 'lucide-react';
import Loading from '../../components/ui/Loading';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';

const AdminUsersPage = () => {
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('All');
  const [isActive, setIsActive] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // User detail modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Status toggle confirmation
  const [confirmToggleModalOpen, setConfirmToggleModalOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);
  const [toggling, setToggling] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: 12,
      };

      if (search.trim()) params.search = search.trim();
      if (role !== 'All') params.role = role;
      if (isActive !== 'All') params.isActive = isActive;

      const { data } = await adminService.getUsers(params);
      if (data.success) {
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalUsers(data.totalUsers || 0);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.response?.data?.message || 'Could not retrieve users list.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, role, isActive]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleConfirm = async () => {
    if (!userToToggle) return;
    setToggling(true);
    try {
      const { data } = await adminService.toggleUserStatus(userToToggle._id);
      if (data.success) {
        showToast(data.message, 'success');
        setConfirmToggleModalOpen(false);
        fetchUsers();
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      showToast(err.response?.data?.message || 'Could not update user account status', 'error');
      setConfirmToggleModalOpen(false);
    } finally {
      setToggling(false);
    }
  };

  const getRoleBadge = (userRole) => {
    switch (userRole) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase tracking-wide">
            <Shield className="w-3 h-3 text-amber-400" /> Admin
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 uppercase tracking-wide">
            <Briefcase className="w-3 h-3 text-indigo-400" /> Staff
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 uppercase tracking-wide">
            <GraduationCap className="w-3 h-3 text-blue-400" /> Student
          </span>
        );
    }
  };

  const hasActiveFilters = search || role !== 'All' || isActive !== 'All';

  const handleResetFilters = () => {
    setSearch('');
    setRole('All');
    setIsActive('All');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Campus User Directory</h1>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {totalUsers} Registered
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Search, audit, and manage account authorization across students, staff, and administrators
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, roll number, or employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>

          <div>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition"
            >
              <option value="All">All User Roles</option>
              <option value="student">Students</option>
              <option value="staff">Maintenance Staff</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={isActive}
              onChange={(e) => {
                setIsActive(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition"
            >
              <option value="All">All Account Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Suspended Only</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="shrink-0 px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading && <Loading message="Loading user directory..." size="lg" className="py-20" />}

      {error && !loading && (
        <ErrorMessage
          title="Could not load user records"
          message={error}
          onRetry={fetchUsers}
          variant="card"
        />
      )}

      {!loading && !error && (
        <>
          {users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users match your criteria"
              description="Try modifying search keywords or clearing role filter."
              actionText="Reset Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Campus ID</th>
                      <th className="px-6 py-4">Academic / Trade Unit</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                        {/* User */}
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 font-bold flex items-center justify-center shrink-0">
                            {u.name?.[0] || 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{u.name}</span>
                            <span className="text-[11px] text-slate-400 block">{u.email}</span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4">{getRoleBadge(u.role)}</td>

                        {/* ID */}
                        <td className="px-6 py-4 font-mono text-slate-300">
                          {u.studentId || u.employeeId || 'N/A'}
                        </td>

                        {/* Department */}
                        <td className="px-6 py-4 text-slate-300 truncate max-w-[180px]">
                          {u.department || 'General'}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                              <XCircle className="w-3.5 h-3.5" /> Suspended
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setDetailModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setUserToToggle(u);
                                setConfirmToggleModalOpen(true);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                                u.isActive
                                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                              }`}
                            >
                              {u.isActive ? (
                                <>
                                  <UserX className="w-3 h-3" /> Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3 h-3" /> Activate
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Page <strong className="text-white">{currentPage}</strong> of{' '}
                    <strong className="text-white">{totalPages}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      {/* User Details Modal */}
      {detailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b0f19]/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setDetailModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-lg">
                {selectedUser.name?.[0]}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{selectedUser.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {getRoleBadge(selectedUser.role)}
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedUser.studentId || selectedUser.employeeId || 'ID: N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs divide-y divide-slate-800/80">
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" /> Campus Email
                </span>
                <span className="font-semibold text-slate-200">{selectedUser.email}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-400" /> Department
                </span>
                <span className="font-semibold text-slate-200">{selectedUser.department}</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> Contact Phone
                </span>
                <span className="font-semibold text-slate-200">
                  {selectedUser.phone || 'Not provided'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Account Status</span>
                <span
                  className={`font-bold uppercase text-[11px] ${
                    selectedUser.isActive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {selectedUser.isActive ? 'Active' : 'Suspended'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Toggling User Status */}
      <ConfirmModal
        isOpen={confirmToggleModalOpen}
        onClose={() => setConfirmToggleModalOpen(false)}
        onConfirm={handleToggleConfirm}
        title={userToToggle?.isActive ? 'Suspend User Account?' : 'Activate User Account?'}
        message={
          userToToggle?.isActive
            ? `Suspending ${userToToggle?.name} will prevent them from signing into the CampusFix portal.`
            : `Activating ${userToToggle?.name} will restore their login access.`
        }
        confirmText={userToToggle?.isActive ? 'Yes, Suspend Account' : 'Yes, Activate Account'}
        cancelText="Cancel"
        variant={userToToggle?.isActive ? 'danger' : 'primary'}
        loading={toggling}
      />
    </div>
  );
};

export default AdminUsersPage;
