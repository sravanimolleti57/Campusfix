import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { complaintService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  Calendar,
  Building,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  User,
  Mail,
  Phone,
  Star,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  FileCheck,
  ChevronRight,
  Info,
  Loader2,
  X,
} from 'lucide-react';
import Loading from '../../components/ui/Loading';
import ErrorMessage from '../../components/ui/ErrorMessage';
import ConfirmModal from '../../components/ui/ConfirmModal';
import {
  getStatusBadge,
  getPriorityBadge,
  getCategoryIcon,
} from '../../utils/complaintHelpers';
import ComplaintTimeline from '../../components/complaints/ComplaintTimeline';

const TIMELINE_STEPS = [
  { key: 'SUBMITTED', label: '1. Submitted', desc: 'Ticket logged by student' },
  { key: 'UNDER_REVIEW', label: '2. Under Review', desc: 'Admin checking priority' },
  { key: 'ASSIGNED', label: '3. Assigned', desc: 'Dispatched to technician' },
  { key: 'IN_PROGRESS', label: '4. In Progress', desc: 'Repair work on-site' },
  { key: 'RESOLVED', label: '5. Resolved', desc: 'Technician completed fix' },
  { key: 'VERIFIED', label: '6. Verified', desc: 'Student confirmed closure' },
];

const ComplaintDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [complaint, setComplaint] = useState(null);

  // Student verification & feedback state
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Resolution verification & Problem Still Exists modals
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);
  const [submittingReopen, setSubmittingReopen] = useState(false);

  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    location: '',
    description: '',
  });
  const [updating, setUpdating] = useState(false);

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await complaintService.getComplaintById(id);
      if (data.success && data.complaint) {
        setComplaint(data.complaint);
        setEditFormData({
          title: data.complaint.title,
          location: data.complaint.location,
          description: data.complaint.description,
        });
      }
    } catch (err) {
      console.error('Error fetching complaint details:', err);
      setError(
        err.response?.data?.message || 'Unable to retrieve the specified complaint details.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  // Action: [Confirm Resolution] -> RESOLVED → VERIFIED → CLOSED
  const handleConfirmResolution = async () => {
    setSubmittingVerify(true);
    try {
      const { data } = await complaintService.verifyComplaint(
        complaint.complaintId || complaint._id,
        {
          rating,
          comment: feedbackComment.trim(),
        }
      );

      if (data.success && data.complaint) {
        setComplaint(data.complaint);
        setVerifyModalOpen(false);
        showToast(
          'Resolution confirmed! Ticket transitioned RESOLVED → VERIFIED → CLOSED. Thank you!',
          'success'
        );
      }
    } catch (err) {
      console.error('Failed to confirm resolution:', err);
      showToast(err.response?.data?.message || 'Error confirming resolution', 'error');
    } finally {
      setSubmittingVerify(false);
    }
  };

  // Action: [Problem Still Exists] -> RESOLVED → REOPENED
  const handleProblemStillExists = async () => {
    setSubmittingReopen(true);
    try {
      const { data } = await complaintService.reopenComplaint(
        complaint.complaintId || complaint._id,
        {
          reason: reopenReason.trim() || 'Defect still remains after maintenance staff work',
        }
      );

      if (data.success && data.complaint) {
        setComplaint(data.complaint);
        setReopenModalOpen(false);
        setReopenReason('');
        showToast(
          'Complaint reopened! Maintenance administration has been notified for re-inspection.',
          'warning'
        );
      }
    } catch (err) {
      console.error('Failed to report problem still exists:', err);
      showToast(err.response?.data?.message || 'Error reporting problem still exists', 'error');
    } finally {
      setSubmittingReopen(false);
    }
  };

  // Submit feedback separately if ticket is already closed/verified without feedback
  const handleSubmitFeedbackOnly = async () => {
    setSubmittingFeedback(true);
    try {
      const { data } = await complaintService.submitFeedback(
        complaint.complaintId || complaint._id,
        {
          rating,
          comment: feedbackComment.trim(),
        }
      );

      if (data.success && data.feedback) {
        setComplaint((prev) => ({
          ...prev,
          studentFeedback: {
            rating: data.feedback.rating,
            comment: data.feedback.comment,
            submittedAt: data.feedback.submittedAt,
          },
        }));
        showToast('Feedback submitted successfully! Thank you for rating the service.', 'success');
      }
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      showToast(err.response?.data?.message || 'Error submitting feedback', 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Handle complaint deletion (allowed when SUBMITTED or UNDER_REVIEW)
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const { data } = await complaintService.deleteComplaint(
        complaint.complaintId || complaint._id
      );
      if (data.success) {
        showToast('Complaint ticket has been successfully deleted.', 'info');
        navigate('/student/complaints');
      }
    } catch (err) {
      console.error('Deletion error:', err);
      showToast(err.response?.data?.message || 'Could not delete complaint ticket', 'error');
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  // Handle complaint edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const { data } = await complaintService.updateComplaint(
        complaint.complaintId || complaint._id,
        editFormData
      );
      if (data.success && data.complaint) {
        setComplaint(data.complaint);
        showToast('Complaint details updated successfully.', 'success');
        setEditModalOpen(false);
      }
    } catch (err) {
      console.error('Update error:', err);
      showToast(err.response?.data?.message || 'Failed to update complaint details', 'error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <Loading message="Loading complaint details..." size="lg" className="min-h-[70vh]" />;
  }

  if (error || !complaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorMessage
          title="Complaint Record Unavailable"
          message={error || 'Could not find the requested complaint record.'}
          onRetry={fetchComplaintDetails}
          variant="card"
        />
        <div className="text-center pt-6">
          <Link
            to="/student/complaints"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to My Complaints</span>
          </Link>
        </div>
      </div>
    );
  }

  const CategoryIcon = getCategoryIcon(complaint.category);
  const canEditOrDelete = ['SUBMITTED', 'UNDER_REVIEW'].includes(complaint.status);
  const isResolved = complaint.status === 'RESOLVED';
  const isVerified = complaint.status === 'VERIFIED' || complaint.status === 'CLOSED';

  // Calculate current stage index for visual step progress
  const currentStepIndex = TIMELINE_STEPS.findIndex((s) => s.key === complaint.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* 1. Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/student/complaints"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Complaints</span>
        </Link>

        {canEditOrDelete && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
              <span>Edit Details</span>
            </button>

            <button
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Cancel Ticket</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Main Ticket Header Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-sm font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-500/20">
                {complaint.complaintId}
              </span>
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <CategoryIcon className="w-4 h-4 text-blue-400" />
                {complaint.category}
              </span>
              {getPriorityBadge(complaint.priority)}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              {complaint.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Building className="w-4 h-4 text-slate-500" />
                {complaint.location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                Reported {new Date(complaint.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="shrink-0">{getStatusBadge(complaint.status)}</div>
        </div>

        {/* 3. Visual Resolution Timeline */}
        <div className="pt-6 border-t border-slate-800/80 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Resolution Lifecycle Progress
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
            {TIMELINE_STEPS.map((step, idx) => {
              const isPastOrCurrent = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-2xl border transition-all text-xs space-y-1 ${
                    isCurrent
                      ? 'bg-blue-600/15 border-blue-500 text-blue-200 shadow-md shadow-blue-500/10'
                      : isPastOrCurrent
                      ? 'bg-slate-950/80 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px]">{step.label}</span>
                    {isPastOrCurrent && !isCurrent && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Two-Column Layout: Details + Staff/Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Complaint Description & Photos (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Problem Description
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {complaint.description}
            </p>
          </div>

          {/* Attached Complaint Photographs */}
          {complaint.images && complaint.images.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Submitted Defect Photos ({complaint.images.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {complaint.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(imgUrl)}
                    className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video hover:border-blue-500/50 transition-colors"
                  >
                    <img
                      src={imgUrl}
                      alt={`Defect ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                      <span>Click to Enlarge</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Proof & Notes (When completed by technician) */}
          {(complaint.resolutionNotes || (complaint.resolutionImages && complaint.resolutionImages.length > 0)) && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-200 uppercase tracking-wider">
                  Technician Resolution Report
                </h3>
              </div>

              {complaint.resolutionNotes && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-400">Resolution Notes:</span>
                  <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-emerald-500/20">
                    {complaint.resolutionNotes}
                  </p>
                </div>
              )}

              {/* Resolution Proof Photos */}
              {complaint.resolutionImages && complaint.resolutionImages.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold text-emerald-400">
                    Resolution Proof Photos ({complaint.resolutionImages.length}):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {complaint.resolutionImages.map((resImg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImage(resImg)}
                        className="relative group rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-950 aspect-video hover:border-emerald-400 transition-colors"
                      >
                        <img
                          src={resImg}
                          alt={`Resolution proof ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity">
                          <span>Enlarge Proof</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {complaint.resolvedAt && (
                <p className="text-[11px] text-slate-400">
                  Resolved on: {new Date(complaint.resolvedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Interactive Student Verification Workflow: "Problem marked as resolved." */}
          {isResolved && (
            <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl relative overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                    Staff Action Completed
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Problem marked as resolved.
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    The maintenance staff has performed the necessary repairs and reported this complaint as resolved. Please verify if the facility issue has been completely fixed.
                  </p>
                </div>
              </div>

              {/* Action Buttons: [Confirm Resolution] & [Problem Still Exists] */}
              <div className="flex flex-wrap items-center gap-3 pt-2 sm:pl-16">
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Resolution</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReopenModalOpen(true)}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                >
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span>Problem Still Exists</span>
                </button>
              </div>
            </div>
          )}

          {/* Already Verified Feedback Display (Enforces single feedback view) */}
          {complaint.studentFeedback?.rating ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-teal-400" />
                  <span>Student Verification & Feedback Sign-Off</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  ✓ Feedback Submitted
                </span>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      complaint.studentFeedback.rating >= s
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
                <span className="text-xs text-amber-300 font-semibold ml-2">
                  {complaint.studentFeedback.rating} / 5 Stars
                </span>
              </div>

              {complaint.studentFeedback.comment && (
                <p className="text-xs text-slate-300 italic pt-1">
                  "{complaint.studentFeedback.comment}"
                </p>
              )}

              {complaint.studentFeedback.submittedAt && (
                <p className="text-[11px] text-slate-500 pt-1">
                  Submitted on: {new Date(complaint.studentFeedback.submittedAt).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            isVerified && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Provide Resolution Feedback</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Rating 1–5</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setRating(starVal)}
                        className="p-1 transition-transform hover:scale-125"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            rating >= starVal ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-amber-300 font-semibold ml-2">
                      {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : 'Poor'}
                    </span>
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Share any comments on the resolution quality..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={handleSubmitFeedbackOnly}
                    disabled={submittingFeedback}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {submittingFeedback ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Submit Feedback</span>
                  </button>
                </div>
              </div>
            )
          )}

          {/* Professional Vertical Activity Timeline (Real Database Data) */}
          <ComplaintTimeline timeline={complaint.timeline || []} currentStatus={complaint.status} />
        </div>

        {/* Right Column: Assigned Staff & Info Metadata (1 col) */}
        <div className="space-y-6">
          {/* Assigned Staff Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Assigned Maintenance Staff
            </h3>

            {complaint.assignedTo ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{complaint.assignedTo.name}</h4>
                    <p className="text-[11px] text-slate-400">
                      Trade: <span className="text-slate-200">{complaint.assignedTo.department}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2 text-slate-400 text-[11px]">
                  {complaint.assignedTo.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{complaint.assignedTo.email}</span>
                    </div>
                  )}
                  {complaint.assignedTo.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{complaint.assignedTo.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1.5 text-xs text-slate-400">
                <Clock className="w-5 h-5 text-amber-400 mx-auto" />
                <p className="font-semibold text-slate-300">Awaiting Staff Assignment</p>
                <p className="text-[11px] text-slate-500">
                  Campus administration will review ticket priority and assign the designated technician.
                </p>
              </div>
            )}
          </div>

          {/* Ticket Metadata Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3.5 shadow-xl text-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Ticket Information
            </h3>

            <div className="space-y-2.5 divide-y divide-slate-800/80">
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Ticket ID</span>
                <span className="font-mono font-bold text-slate-200">{complaint.complaintId}</span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Category</span>
                <span className="font-semibold text-slate-200">{complaint.category}</span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Location</span>
                <span className="font-semibold text-slate-200 text-right max-w-[160px] truncate">
                  {complaint.location}
                </span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Priority</span>
                {getPriorityBadge(complaint.priority)}
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Current Status</span>
                {getStatusBadge(complaint.status)}
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Submitted</span>
                <span className="text-slate-300 text-[11px]">
                  {new Date(complaint.createdAt).toLocaleDateString()}
                </span>
              </div>

              {complaint.closedAt && (
                <div className="flex justify-between pt-2">
                  <span className="text-slate-400">Closed</span>
                  <span className="text-emerald-400 font-semibold text-[11px]">
                    {new Date(complaint.closedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Ticket Deletion */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Cancel & Delete Complaint Ticket?"
        message={`Are you sure you want to cancel ticket ${complaint.complaintId}? This will completely remove the defect report from estate management systems.`}
        confirmText="Yes, Delete Ticket"
        cancelText="Keep Ticket"
        variant="danger"
        loading={deleting}
      />

      {/* Modal for Editing Complaint (allowed during SUBMITTED/UNDER_REVIEW) */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b0f19]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setEditModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Edit Complaint Details</h3>
              <p className="text-xs text-slate-400">
                Update information before technicians are dispatched
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Campus Location</label>
                <input
                  type="text"
                  required
                  value={editFormData.location}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={4}
                  required
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Resolution Modal (RESOLVED -> VERIFIED -> CLOSED) */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Confirm Resolution</h3>
                  <p className="text-[11px] text-slate-400">RESOLVED → VERIFIED → CLOSED</p>
                </div>
              </div>
              <button
                onClick={() => setVerifyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you satisfied that the defect has been properly repaired? Confirming resolution will sign off this ticket and transition it directly to <strong className="text-emerald-400">CLOSED</strong>.
            </p>

            {/* Satisfaction Rating */}
            <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <label className="block text-xs font-bold text-slate-200">
                How satisfied are you with the resolution? (1–5 Stars)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 transition-transform hover:scale-125"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        rating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs text-amber-300 font-semibold ml-2">
                  {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : 'Poor'}
                </span>
              </div>
            </div>

            {/* Verification Comments */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">
                Resolution Comments (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Technician Ramesh did a great job, fully fixed and verified!"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVerifyModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolution}
                disabled={submittingVerify}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                {submittingVerify ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Confirm Resolution & Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Problem Still Exists Modal (RESOLVED -> REOPENED) */}
      {reopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Problem Still Exists</h3>
                  <p className="text-[11px] text-slate-400">RESOLVED → REOPENED</p>
                </div>
              </div>
              <button
                onClick={() => setReopenModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If the problem was not adequately solved or has returned, please detail the issue below. This ticket will be reopened for the maintenance staff and administration to re-inspect.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">
                Describe What Is Still Broken <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="e.g. The leak resumed after high water pressure in the afternoon. Valve is still dripping."
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReopenModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProblemStillExists}
                disabled={submittingReopen || !reopenReason.trim()}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                {submittingReopen ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span>Report Problem Still Exists</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Full Photo Preview Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl max-h-[85vh] p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-2"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Enlarged defect"
              className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-2xl border border-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetailsPage;
