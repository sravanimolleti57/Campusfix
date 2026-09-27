import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { complaintService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Wrench,
  AlertCircle,
  Upload,
  X,
  ArrowLeft,
  Loader2,
  Check,
  Building,
  FileText,
  Tag,
  ShieldAlert,
  Info,
} from 'lucide-react';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  getPriorityBadge,
} from '../../utils/complaintHelpers';

const ReportComplaintPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Electrical',
    location: '',
    priority: 'Medium',
    description: '',
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Validate max files (max 5)
    if (selectedFiles.length + files.length > 5) {
      setFormError('You can attach a maximum of 5 images per complaint.');
      return;
    }

    // Validate size (max 5MB each) and format
    const validFiles = [];
    const validPreviews = [];

    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        setFormError('Please select only JPEG, PNG, or WebP image files.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError(`Image "${file.name}" exceeds the 5MB size limit.`);
        return;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => [...prev, ...validPreviews]);
    setFormError('');
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.title.trim()) {
      setFormError('Please enter a clear complaint title.');
      return;
    }
    if (!formData.location.trim()) {
      setFormError('Please specify the campus location (e.g. Science Block B, Room 204).');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Please provide a detailed description of the problem.');
      return;
    }

    setSubmitting(true);

    try {
      // Build FormData payload to support multi-part image uploads
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('category', formData.category);
      payload.append('location', formData.location.trim());
      payload.append('priority', formData.priority);
      payload.append('description', formData.description.trim());

      selectedFiles.forEach((file) => {
        payload.append('images', file);
      });

      const { data } = await complaintService.createComplaint(payload);

      if (data.success && data.complaint) {
        showToast(
          `Complaint ${data.complaint.complaintId} has been successfully submitted!`,
          'success'
        );
        navigate(`/student/complaints/${data.complaint.complaintId || data.complaint._id}`);
      } else {
        setFormError(data.message || 'Failed to submit complaint.');
        showToast(data.message || 'Submission error', 'error');
      }
    } catch (err) {
      console.error('Submission failed:', err);
      const message =
        err.response?.data?.message || 'Server error while submitting your complaint ticket.';
      setFormError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/student"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Dashboard</span>
        </Link>

        <span className="text-[11px] text-slate-500 font-medium">Step 1 of 1: Problem Details</span>
      </div>

      {/* Main Form Container */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-10 shadow-xl space-y-8">
        {/* Form Title & Context */}
        <div className="space-y-2 border-b border-slate-800/80 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold">
            <Wrench className="w-3.5 h-3.5" />
            <span>Facilities Service Request</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Report a Campus Problem</h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Submit defective campus facilities, broken equipment, or safety concerns directly to estate management. Your ticket will be reviewed and dispatched to designated trade technicians.
          </p>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1 font-medium">{formError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Title */}
          <div>
            <label className="block text-slate-200 font-bold mb-2 flex items-center justify-between">
              <span>Complaint Title *</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {formData.title.length}/120
              </span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                name="title"
                required
                maxLength={120}
                placeholder="e.g. Overhead Projector Bulb Blown in Room 204"
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>

          {/* Category & Location Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Dropdown */}
            <div>
              <label className="block text-slate-200 font-bold mb-2">Problem Category *</label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                >
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value} className="bg-slate-900 text-white">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Campus Location */}
            <div>
              <label className="block text-slate-200 font-bold mb-2">Specific Campus Location *</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  name="location"
                  required
                  placeholder="e.g. Science Block B, 2nd Floor, Room 204"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-slate-200 font-bold mb-2">Perceived Priority Level</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COMPLAINT_PRIORITIES.map((pri) => {
                const isSelected = formData.priority === pri;
                return (
                  <button
                    key={pri}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, priority: pri }))}
                    className={`py-3 px-4 rounded-xl border text-center font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span>{pri}</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      {pri === 'Critical'
                        ? 'Immediate Hazard'
                        : pri === 'High'
                        ? 'Major Impact'
                        : pri === 'Medium'
                        ? 'Standard Defect'
                        : 'Minor Cosmetic'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-200 font-bold mb-2 flex items-center justify-between">
              <span>Detailed Description *</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {formData.description.length}/2000
              </span>
            </label>
            <textarea
              name="description"
              required
              rows={5}
              maxLength={2000}
              placeholder="Describe what is broken, when you noticed it, any error messages, or potential safety hazards..."
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors leading-relaxed"
            />
          </div>

          {/* Image Upload Component */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-slate-200 font-bold">
                Supporting Photographs (Optional, up to 5)
              </label>
              <span className="text-[11px] text-slate-500">
                Max 5MB each • JPG, PNG, WebP
              </span>
            </div>

            {/* Dropzone Container */}
            <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 text-center bg-slate-950/60 transition-colors relative">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleFileChange}
                disabled={selectedFiles.length >= 5}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                id="complaint-image-input"
              />
              <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="font-semibold text-slate-300">
                  Click to select photos or drag & drop here
                </p>
                <p className="text-[11px] text-slate-500">
                  Attaching photos helps technicians bring the exact spare parts required
                </p>
              </div>
            </div>

            {/* Thumbnails preview gallery */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                {previewUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center"
                  >
                    <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-slate-950/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notice Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-start gap-3 text-slate-400 text-[11px]">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p>
              Once submitted, you will receive a tracking ID (e.g. <span className="font-mono text-slate-300">CF-2026-0001</span>). You can monitor dispatch notes and verify final repairs in real time.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <Link
              to="/student"
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Complaint Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportComplaintPage;
