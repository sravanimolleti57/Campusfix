import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { staffService } from '../../services/api';
import {
  Wrench,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  MapPin,
  User,
  Phone,
  Mail,
  Camera,
  Upload,
  Send,
  Calendar,
  Layers,
  Flame,
  ShieldCheck,
  RefreshCw,
  X,
  Star,
  FileText,
  History,
  Image as ImageIcon,
} from 'lucide-react';
import ComplaintTimeline from '../../components/complaints/ComplaintTimeline';

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

const StaffComplaintDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbiddenError, setForbiddenError] = useState(null);

  // Active Action Tab: 'progress' or 'resolve'
  const [activeActionTab, setActiveActionTab] = useState('resolve');

  // Form states
  const [startWorkNotes, setStartWorkNotes] = useState('');
  const [startingWork, setStartingWork] = useState(false);

  // Progress notes form
  const [progressNotes, setProgressNotes] = useState('');
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [progressPhotosPreview, setProgressPhotosPreview] = useState([]);
  const [submittingProgress, setSubmittingProgress] = useState(false);

  // Resolution form
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionPhotos, setResolutionPhotos] = useState([]);
  const [resolutionPhotosPreview, setResolutionPhotosPreview] = useState([]);
  const [resolving, setResolving] = useState(false);

  // Image Lightbox modal
  const [activeImagePreview, setActiveImagePreview] = useState(null);

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      setForbiddenError(null);
      const res = await staffService.getComplaintById(id);
      if (res.data.success) {
        setComplaint(res.data.complaint);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setForbiddenError(
          err.response.data.message ||
            'Access Denied: You are not authorized to view this complaint as it is not assigned to you.'
        );
      } else {
        showToast(err.response?.data?.message || 'Failed to load complaint details', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  // Handle Action 1: Start Work
  const handleStartWork = async () => {
    try {
      setStartingWork(true);
      const res = await staffService.startWork(id, {
        notes: startWorkNotes.trim() || 'Technician accepted assignment and commenced maintenance.',
      });
      if (res.data.success) {
        showToast('Work commenced! Status updated to IN_PROGRESS.', 'success');
        setComplaint(res.data.complaint);
        setStartWorkNotes('');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not start work', 'error');
    } finally {
      setStartingWork(false);
    }
  };

  // Handle Action 2: Add Progress Notes
  const handleProgressPhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setProgressPhotos((prev) => [...prev, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setProgressPhotosPreview((prev) => [...prev, ...previews]);
  };

  const handleRemoveProgressPhoto = (index) => {
    setProgressPhotos((prev) => prev.filter((_, i) => i !== index));
    setProgressPhotosPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitProgress = async (e) => {
    e.preventDefault();
    if (!progressNotes || progressNotes.trim().length < 3) {
      showToast('Please enter substantive progress notes (at least 3 characters)', 'warning');
      return;
    }

    try {
      setSubmittingProgress(true);
      const formData = new FormData();
      formData.append('notes', progressNotes.trim());
      progressPhotos.forEach((file) => {
        formData.append('resolutionImages', file); // upload middleware handles images
      });

      const res = await staffService.addProgressNotes(id, formData);
      if (res.data.success) {
        showToast('Progress update logged into ticket timeline!', 'success');
        setComplaint(res.data.complaint);
        setProgressNotes('');
        setProgressPhotos([]);
        setProgressPhotosPreview([]);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to log progress', 'error');
    } finally {
      setSubmittingProgress(false);
    }
  };

  // Handle Action 3: Mark as RESOLVED
  const handleResolutionPhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setResolutionPhotos((prev) => [...prev, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setResolutionPhotosPreview((prev) => [...prev, ...previews]);
  };

  const handleRemoveResolutionPhoto = (index) => {
    setResolutionPhotos((prev) => prev.filter((_, i) => i !== index));
    setResolutionPhotosPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!resolutionNotes || resolutionNotes.trim().length < 5) {
      showToast('Please provide detailed resolution notes explaining how the defect was resolved (min 5 chars)', 'warning');
      return;
    }

    try {
      setResolving(true);
      const formData = new FormData();
      formData.append('resolutionNotes', resolutionNotes.trim());
      resolutionPhotos.forEach((file) => {
        formData.append('resolutionImages', file);
      });

      const res = await staffService.resolveComplaint(id, formData);
      if (res.data.success) {
        showToast('Complaint marked as RESOLVED! Student has been notified to verify.', 'success');
        setComplaint(res.data.complaint);
        setResolutionNotes('');
        setResolutionPhotos([]);
        setResolutionPhotosPreview([]);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to mark complaint as resolved', 'error');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-white">Loading complaint details...</p>
      </div>
    );
  }

  if (forbiddenError) {
    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-10 my-10 bg-slate-900/80 border border-rose-500/30 rounded-2xl text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Role Scoping: Ticket Not Authorized</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{forbiddenError}</p>
        <p className="text-xs text-slate-500">
          As a security policy, maintenance technicians may only inspect and modify tickets explicitly assigned to them by Campus Administration.
        </p>
        <div className="pt-2">
          <Link
            to="/staff/complaints"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Assigned Complaints</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="py-24 text-center space-y-3">
        <p className="text-slate-400 text-sm">Complaint ticket not found.</p>
        <Link to="/staff/complaints" className="text-amber-400 text-xs hover:underline">
          &larr; Back to complaints list
        </Link>
      </div>
    );
  }

  const isAssigned = complaint.status === 'ASSIGNED' || complaint.status === 'REOPENED';
  const isInProgress = complaint.status === 'IN_PROGRESS';
  const isResolvedOrBeyond = ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(complaint.status);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <Link
            to="/staff/complaints"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Back to Assigned Tasks"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-400">
                {complaint.complaintId}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[complaint.status] || 'bg-slate-800 text-slate-300'}`}>
                {complaint.status.replace('_', ' ')}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${priorityColors[complaint.priority] || 'bg-slate-800 text-slate-300'}`}>
                {complaint.priority} Priority
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {complaint.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchComplaintDetails}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh details"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Defect Information & Student Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Overview Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-white">{complaint.location}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Category: <strong className="text-slate-200">{complaint.category}</strong></span>
                <span>•</span>
                <span>Reported: {new Date(complaint.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Problem Description
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60 whitespace-pre-wrap">
                {complaint.description}
              </p>
            </div>

            {/* Student Attached Photos */}
            {complaint.images && complaint.images.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Student Attached Evidence Photos ({complaint.images.length})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {complaint.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveImagePreview(imgUrl)}
                      className="group relative h-32 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer shadow-sm"
                    >
                      <img
                        src={imgUrl}
                        alt={`Evidence ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-semibold text-white">
                        <span>Click to Enlarge</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Internal Triage Notes (if present) */}
            {complaint.adminNotes && (
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs">
                <span className="font-bold text-amber-400 block mb-1">
                  Facilities Dispatch Note:
                </span>
                <p className="text-slate-300 italic">{complaint.adminNotes}</p>
              </div>
            )}
          </div>

          {/* Student Reporter Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              <span>Student Reporter Information</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block">Student Name</span>
                <span className="text-sm font-bold text-white block">
                  {complaint.reportedBy?.name || 'Student'}
                </span>
                <span className="text-xs text-slate-400">
                  ID: <span className="font-mono text-slate-200">{complaint.reportedBy?.studentId || 'N/A'}</span>
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block">Department</span>
                <span className="text-sm font-medium text-slate-200 block">
                  {complaint.reportedBy?.department || 'Academic Division'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block">Contact Phone</span>
                <a
                  href={`tel:${complaint.reportedBy?.phone}`}
                  className="text-xs font-medium text-amber-400 hover:underline flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{complaint.reportedBy?.phone || 'Not provided'}</span>
                </a>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block">Campus Email</span>
                <a
                  href={`mailto:${complaint.reportedBy?.email}`}
                  className="text-xs font-medium text-amber-400 hover:underline flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{complaint.reportedBy?.email}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Student Verification & Feedback (If marked VERIFIED) */}
          {complaint.studentFeedback && complaint.studentFeedback.rating && (
            <div className="bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Student Resolution Verification</h3>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < complaint.studentFeedback.rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-amber-300 ml-1">
                    {complaint.studentFeedback.rating}/5
                  </span>
                </div>
              </div>
              {complaint.studentFeedback.comment && (
                <p className="text-xs text-slate-200 italic bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  "{complaint.studentFeedback.comment}"
                </p>
              )}
              <p className="text-[11px] text-slate-400">
                Verified on {new Date(complaint.studentFeedback.submittedAt || complaint.closedAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Professional Vertical Activity Timeline (Real Database Data) */}
          <ComplaintTimeline timeline={complaint.timeline || []} currentStatus={complaint.status} />
        </div>

        {/* Right Column (1 Col): Interactive Staff Action Panel */}
        <div className="space-y-6">
          {/* Technician Action Panel */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Technician Action Desk</h3>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Staff Only
              </span>
            </div>

            {/* Lifecycle State 1: ASSIGNED or REOPENED -> Action: Accept & Start Work */}
            {isAssigned && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Clock className="w-4 h-4" />
                    <span>Assignment Awaiting Response</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This complaint has been assigned to you by Campus Facilities. Accept the assignment to transition this ticket to <strong>IN_PROGRESS</strong>.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Opening Remarks / Notes (Optional)
                  </label>
                  <textarea
                    rows="3"
                    value={startWorkNotes}
                    onChange={(e) => setStartWorkNotes(e.target.value)}
                    placeholder="e.g. Parts gathered. Heading over to Room/Location to inspect."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition resize-none"
                  />
                </div>

                <button
                  onClick={handleStartWork}
                  disabled={startingWork}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <PlayCircle className="w-5 h-5" />
                  <span>{startingWork ? 'Starting Work...' : 'Accept Assignment & Start Work'}</span>
                </button>
              </div>
            )}

            {/* Lifecycle State 2: IN_PROGRESS -> Two Actions: Progress Notes or Mark Resolved */}
            {isInProgress && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                  <button
                    onClick={() => setActiveActionTab('resolve')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      activeActionTab === 'resolve'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Resolved</span>
                  </button>
                  <button
                    onClick={() => setActiveActionTab('progress')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      activeActionTab === 'progress'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Progress Note</span>
                  </button>
                </div>

                {/* Sub-form A: Mark as RESOLVED */}
                {activeActionTab === 'resolve' && (
                  <form onSubmit={handleSubmitResolution} className="space-y-4">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300">
                      <strong>Resolution Completion:</strong> Summarize the repair actions taken and optionally upload photo proof for student verification.
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Resolution Notes <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        rows="4"
                        required
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Detail how the problem was resolved (e.g. Replaced burnt capacitor, calibrated switchgear, verified proper operation)..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none"
                      />
                    </div>

                    {/* Resolution Proof Photos Upload */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Upload Resolution Photos Proof
                      </label>
                      <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 text-center cursor-pointer transition relative bg-slate-950/40">
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleResolutionPhotoSelect}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <Upload className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                        <p className="text-xs font-semibold text-white">Click or drop repair photos here</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP (Max 5MB)</p>
                      </div>

                      {/* Photo Previews */}
                      {resolutionPhotosPreview.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {resolutionPhotosPreview.map((src, i) => (
                            <div key={i} className="relative h-20 rounded-xl overflow-hidden border border-slate-700 group">
                              <img src={src} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveResolutionPhoto(i)}
                                className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-rose-400 hover:text-white"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={resolving}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{resolving ? 'Submitting Resolution...' : 'Mark Complaint as RESOLVED'}</span>
                    </button>
                  </form>
                )}

                {/* Sub-form B: Log Progress Note */}
                {activeActionTab === 'progress' && (
                  <form onSubmit={handleSubmitProgress} className="space-y-4">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-xs text-blue-300">
                      <strong>Log Intermediate Update:</strong> Record current repair status or troubleshooting findings into the timeline.
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Progress Notes <span className="text-rose-400">*</span>
                      </label>
                      <textarea
                        rows="4"
                        required
                        value={progressNotes}
                        onChange={(e) => setProgressNotes(e.target.value)}
                        placeholder="e.g. Opened ceiling panel. Wiring examined. Waiting for 25A fuse replacement from central inventory..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
                      />
                    </div>

                    {/* Progress Photos Upload */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Attach Diagnostic Photos (Optional)
                      </label>
                      <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 text-center cursor-pointer transition relative bg-slate-950/40">
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleProgressPhotoSelect}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <Camera className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                        <p className="text-xs text-slate-300">Attach on-site progress photos</p>
                      </div>

                      {progressPhotosPreview.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {progressPhotosPreview.map((src, i) => (
                            <div key={i} className="relative h-20 rounded-xl overflow-hidden border border-slate-700">
                              <img src={src} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveProgressPhoto(i)}
                                className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-rose-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submittingProgress}
                      className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submittingProgress ? 'Logging...' : 'Log Progress Update'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Lifecycle State 3: RESOLVED / VERIFIED / CLOSED */}
            {isResolvedOrBeyond && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Work Marked as RESOLVED</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {complaint.status === 'VERIFIED'
                      ? 'The student has verified this resolution and provided feedback.'
                      : complaint.status === 'CLOSED'
                      ? 'This ticket is closed and archived.'
                      : 'Awaiting student confirmation and verification.'}
                  </p>
                  {complaint.resolvedAt && (
                    <p className="text-[10px] text-emerald-400/80 font-mono">
                      Completed: {new Date(complaint.resolvedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {complaint.resolutionNotes && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Saved Resolution Notes
                    </span>
                    <p className="text-xs text-slate-200 bg-slate-950 p-3.5 rounded-xl border border-slate-800 leading-relaxed whitespace-pre-wrap">
                      {complaint.resolutionNotes}
                    </p>
                  </div>
                )}

                {complaint.resolutionImages && complaint.resolutionImages.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Resolution Photos ({complaint.resolutionImages.length})
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {complaint.resolutionImages.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`Proof ${i + 1}`}
                          onClick={() => setActiveImagePreview(img)}
                          className="h-24 w-full object-cover rounded-xl border border-slate-800 cursor-pointer hover:opacity-80 transition"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {activeImagePreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setActiveImagePreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
            <button
              onClick={() => setActiveImagePreview(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeImagePreview}
              alt="Enlarged defect proof"
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffComplaintDetailPage;
