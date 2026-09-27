import React from 'react';
import {
  Zap,
  Droplets,
  Wifi,
  Monitor,
  FlaskConical,
  Home,
  Trash2,
  Armchair,
  ShieldAlert,
  HelpCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  XCircle,
  Eye,
} from 'lucide-react';

export const COMPLAINT_CATEGORIES = [
  { value: 'Electrical', label: 'Electrical & Power', icon: Zap },
  { value: 'Plumbing', label: 'Plumbing & Water', icon: Droplets },
  { value: 'Internet/Wi-Fi', label: 'Internet / Wi-Fi Network', icon: Wifi },
  { value: 'Classroom', label: 'Classroom & AV Equipment', icon: Monitor },
  { value: 'Laboratory', label: 'Laboratory Facilities', icon: FlaskConical },
  { value: 'Hostel', label: 'Hostel & Housing', icon: Home },
  { value: 'Cleaning', label: 'Sanitation & Cleaning', icon: Trash2 },
  { value: 'Furniture', label: 'Furniture & Fixtures', icon: Armchair },
  { value: 'Security', label: 'Campus Safety & Security', icon: ShieldAlert },
  { value: 'Other', label: 'Other Infrastructure', icon: HelpCircle },
];

export const COMPLAINT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export const COMPLAINT_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'VERIFIED',
  'CLOSED',
  'REOPENED',
];

export const getStatusBadge = (status) => {
  switch (status) {
    case 'SUBMITTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase">
          <Clock className="w-3 h-3" /> Submitted
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase">
          <Eye className="w-3 h-3" /> Under Review
        </span>
      );
    case 'ASSIGNED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 uppercase">
          <Clock className="w-3 h-3" /> Staff Assigned
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-purple-500/10 text-purple-300 border border-purple-500/30 uppercase">
          <RefreshCw className="w-3 h-3 animate-spin" /> In Progress
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Resolved
        </span>
      );
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-teal-500/15 text-teal-300 border border-teal-500/30 uppercase">
          <FileCheck className="w-3 h-3 text-teal-400" /> Verified by Student
        </span>
      );
    case 'CLOSED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-slate-800 text-slate-400 border border-slate-700 uppercase">
          <CheckCircle2 className="w-3 h-3" /> Closed
        </span>
      );
    case 'REOPENED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-rose-500/15 text-rose-300 border border-rose-500/30 uppercase">
          <AlertCircle className="w-3 h-3 text-rose-400" /> Reopened
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-slate-800 text-slate-300 border border-slate-700">
          {status}
        </span>
      );
  }
};

export const getPriorityBadge = (priority) => {
  switch (priority) {
    case 'Critical':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span> Critical
        </span>
      );
    case 'High':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-500/15 text-orange-300 border border-orange-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> High
        </span>
      );
    case 'Medium':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Medium
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Low
        </span>
      );
  }
};

export const getCategoryIcon = (category) => {
  const match = COMPLAINT_CATEGORIES.find((c) => c.value === category);
  return match ? match.icon : HelpCircle;
};
