import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Briefcase,
  UserPlus,
  Search,
  Edit,
  UserX,
  UserCheck,
  CheckCircle2,
  Clock,
  Wrench,
  Mail,
  Phone,
  Building,
  Layers,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Loading from '../../components/ui/Loading';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';

const DEPARTMENTS = [
  'Electrical & Power Systems',
  'Plumbing & Water Supply',
  'Campus Wi-Fi & IT Infrastructure',
  'Classroom AV & Equipment',
  'Laboratory Facilities & Safety',
  'Hostel Maintenance & Housing',
  'Campus Sanitation & Hygiene',
  'General Maintenance',
];

const AdminStaffPage = () => {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Create Staff Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    department: 'Electrical & Power Systems',
    phone: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit Staff Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    employeeId: '',
    department: '',
    phone: '',
    password: '',
  });
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  // Toggle Status Modal
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [staffToToggle, setStaffToToggle] = useState(null);
  const [toggling, setToggling] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await adminService.getStaff();
      if (data.success && data.staff) {
        setStaffList(data.staff);
      }
    } catch (err) {
      console.error('Failed to load staff members:', err);
      setError(err.response?.data?.message || 'Could not retrieve staff list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Handle Create Staff
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (createForm.password.length < 6) {
      setCreateError('Password must be at least 6 characters long');
      return;
    }

    setCreating(true);
    try {
      const { data } = await adminService.createStaff(createForm);
      if (data.success) {
        showToast(`Maintenance staff member ${data.staff.name} added!`, 'success');
        setCreateModalOpen(false);
        setCreateForm({
          name: '',
          email: '',
          password: '',
          employeeId: '',
          department: 'Electrical & Power Systems',
          phone: '',
        });
        fetchStaff();
      }
    } catch (err) {
      console.error('Staff creation failed:', err);
      setCreateError(err.response?.data?.message || 'Failed to create staff member.');
    } finally {
      setCreating(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (staff) => {
    setSelectedStaff(staff);
    setEditForm({
      name: staff.name,
      employeeId: staff.employeeId || '',
      department: staff.department || 'Electrical & Power Systems',
      phone: staff.phone || '',
      password: '',
    });
    setEditError('');
    setEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setUpdating(true);
    try {
      const payload = {
        name: editForm.name,
        employeeId: editForm.employeeId,
        department: editForm.department,
        phone: editForm.phone,
      };
      if (editForm.password && editForm.password.length >= 6) {
        payload.password = editForm.password;
      }

      const { data } = await adminService.updateStaff(selectedStaff._id, payload);
      if (data.success) {
        showToast(`Staff profile for ${data.staff.name} updated successfully!`, 'success');
        setEditModalOpen(false);
        fetchStaff();
      }
    } catch (err) {
      console.error('Edit staff failed:', err);
      setEditError(err.response?.data?.message || 'Failed to update staff profile.');
    } finally {
      setUpdating(false);
    }
  };

  // Handle Toggle Status Confirm
  const handleToggleConfirm = async () => {
    if (!staffToToggle) return;
    setToggling(true);
    try {
      const { data } = await adminService.toggleStaffStatus(staffToToggle._id);
      if (data.success) {
        showToast(data.message, 'success');
        setToggleModalOpen(false);
        fetchStaff();
      }
    } catch (err) {
      console.error('Toggle staff status failed:', err);
      showToast(err.response?.data?.message || 'Could not update status', 'error');
      setToggleModalOpen(false);
    } finally {
      setToggling(false);
    }
  };

  // Filter staff by search and department
  const filteredStaff = staffList.filter((s) => {
    const matchSearch =
      search.trim() === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.employeeId && s.employeeId.toLowerCase().includes(search.toLowerCase()));

    const matchDept = departmentFilter === 'All' || s.department === departmentFilter;

    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Maintenance Staff & Workload</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {staffList.length} Technicians
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage trade technicians, allocate campus building zones, and monitor active queue loads
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/25 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Technician</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, employee ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Staff Grid */}
      {loading && <Loading message="Loading maintenance staff records..." size="lg" className="py-20" />}

      {error && !loading && (
        <ErrorMessage
          title="Could not load staff list"
          message={error}
          onRetry={fetchStaff}
          variant="card"
        />
      )}

      {!loading && !error && (
        <>
          {filteredStaff.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No technicians match your search"
              description="Click the button above to add a new maintenance staff member."
              actionText="Add New Technician"
              onAction={() => setCreateModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStaff.map((staff) => (
                <div
                  key={staff._id}
                  className="stat-card bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Top Row: Name & Active badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-base">
                          {staff.name?.[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base leading-tight">
                            {staff.name}
                          </h3>
                          <span className="font-mono text-[11px] text-slate-400">
                            {staff.employeeId || 'EMP-STF'}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                          staff.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {staff.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>

                    {/* Department Tag */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-300">
                      <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{staff.department}</span>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-1.5 text-xs text-slate-400 pt-1">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{staff.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{staff.phone || 'Phone not registered'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Workload Stats Bar */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Assigned Workload
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                        <span className="text-[10px] text-slate-400 block">Total</span>
                        <span className="text-sm font-bold text-white">
                          {staff.workload?.totalAssigned || 0}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                        <span className="text-[10px] text-amber-400 block">Active</span>
                        <span className="text-sm font-bold text-amber-300">
                          {staff.workload?.activeRepairs || 0}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                        <span className="text-[10px] text-emerald-400 block">Done</span>
                        <span className="text-sm font-bold text-emerald-300">
                          {staff.workload?.resolved || 0}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => handleOpenEdit(staff)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          setStaffToToggle(staff);
                          setToggleModalOpen(true);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                          staff.isActive
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                        }`}
                      >
                        {staff.isActive ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Suspend</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Activate</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Staff Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b0f19]/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Add New Maintenance Technician</h3>
              <p className="text-xs text-slate-400">
                Create institutional login credentials for trade staff
              </p>
            </div>

            {createError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel O'Connor"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Campus Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="samuel@campusfix.edu"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Password (min 6 chars) *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Employee ID</label>
                  <input
                    type="text"
                    placeholder="EMP-STF-020"
                    value={createForm.employeeId}
                    onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+1 555-0144"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Trade Department *</label>
                <select
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Technician</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b0f19]/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Edit Technician Profile</h3>
              <p className="text-xs text-slate-400">
                Update trade details for {selectedStaff.name} ({selectedStaff.email})
              </p>
            </div>

            {editError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={editForm.employeeId}
                    onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Trade Department</label>
                <select
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Reset Password (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  placeholder="New password (optional)"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Staff Activation/Suspension */}
      <ConfirmModal
        isOpen={toggleModalOpen}
        onClose={() => setToggleModalOpen(false)}
        onConfirm={handleToggleConfirm}
        title={staffToToggle?.isActive ? 'Suspend Staff Technician?' : 'Activate Staff Technician?'}
        message={
          staffToToggle?.isActive
            ? `Suspending ${staffToToggle?.name} will temporarily pause their dispatch eligibility and login permissions.`
            : `Activating ${staffToToggle?.name} will allow them to receive new maintenance task assignments.`
        }
        confirmText={staffToToggle?.isActive ? 'Yes, Suspend' : 'Yes, Activate'}
        cancelText="Cancel"
        variant={staffToToggle?.isActive ? 'danger' : 'primary'}
        loading={toggling}
      />
    </div>
  );
};

export default AdminStaffPage;
