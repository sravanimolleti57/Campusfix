import React from 'react';
import {
  CheckCircle2,
  CircleDot,
  Clock,
  AlertCircle,
  Wrench,
  UserCheck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  FileCheck,
  ArrowRight,
  User,
  Calendar,
} from 'lucide-react';

// Format date in exact professional format e.g. "26 Sep 2026, 10:30 AM"
const formatTimelineDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

// Map activity action to clean readable label
const getActionDisplay = (action) => {
  switch (action) {
    case 'COMPLAINT_CREATED':
      return {
        title: 'Complaint submitted',
        icon: 'check',
        color: 'emerald',
      };
    case 'COMPLAINT_REVIEWED':
      return {
        title: 'Complaint reviewed',
        icon: 'check',
        color: 'indigo',
      };
    case 'PRIORITY_CHANGED':
      return {
        title: 'Priority updated',
        icon: 'alert',
        color: 'amber',
      };
    case 'STAFF_ASSIGNED':
      return {
        title: 'Assigned to Maintenance Team',
        icon: 'check',
        color: 'amber',
      };
    case 'STAFF_REASSIGNED':
      return {
        title: 'Reassigned Maintenance Technician',
        icon: 'check',
        color: 'orange',
      };
    case 'ASSIGNMENT_ACCEPTED':
      return {
        title: 'Assignment accepted',
        icon: 'check',
        color: 'blue',
      };
    case 'WORK_STARTED':
      return {
        title: 'Work in progress',
        icon: 'dot',
        color: 'blue',
      };
    case 'PROGRESS_UPDATED':
      return {
        title: 'Progress update logged',
        icon: 'dot',
        color: 'blue',
      };
    case 'RESOLVED':
      return {
        title: 'Complaint resolved',
        icon: 'check',
        color: 'emerald',
      };
    case 'REOPENED':
      return {
        title: 'Complaint reopened by student',
        icon: 'rotate',
        color: 'rose',
      };
    case 'VERIFIED':
      return {
        title: 'Resolution verified by student',
        icon: 'check',
        color: 'emerald',
      };
    case 'CLOSED':
      return {
        title: 'Ticket closed & archived',
        icon: 'check',
        color: 'slate',
      };
    default:
      return {
        title: action.replace(/_/g, ' ').toLowerCase(),
        icon: 'check',
        color: 'slate',
      };
  }
};

const ComplaintTimeline = ({ timeline = [], currentStatus = null }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
        <Clock className="w-8 h-8 text-slate-600 mx-auto" />
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">No Activity Logged Yet</h4>
        <p className="text-[11px] text-slate-400">Activity events will automatically appear here as the complaint progresses.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Complaint Activity Timeline</h3>
            <p className="text-[10px] text-slate-400">Complete verified history logged in database</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {timeline.length} {timeline.length === 1 ? 'Event' : 'Events'}
        </span>
      </div>

      {/* Professional Vertical Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-3 before:w-0.5 before:bg-slate-800">
        {timeline.map((item, index) => {
          const display = getActionDisplay(item.action);
          const isLatest = index === timeline.length - 1;
          const formattedDate = formatTimelineDate(item.timestamp);
          const performerName = item.user?.name || 'System';
          const performerRole = item.user?.role ? (item.user.role === 'admin' ? 'Admin' : item.user.role === 'staff' ? 'Maintenance Staff' : 'Student') : '';

          return (
            <div key={item._id || index} className="relative group">
              {/* Timeline Indicator Icon */}
              <div className="absolute -left-6 sm:-left-8 top-0.5 flex items-center justify-center">
                {display.icon === 'dot' ? (
                  <div className="relative flex items-center justify-center">
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-ping absolute opacity-50" />
                    <span className="w-3 h-3 rounded-full bg-blue-400 border-2 border-[#0b0f19] shadow-sm shadow-blue-500/50" />
                  </div>
                ) : display.color === 'emerald' ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                ) : display.color === 'rose' ? (
                  <div className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center text-[10px] font-bold">
                    ↺
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                )}
              </div>

              {/* Event Content Block */}
              <div className="space-y-1">
                {/* Title */}
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white capitalize leading-tight">
                    {display.title}
                  </h4>
                  {isLatest && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Latest
                    </span>
                  )}
                  {item.newStatus && item.newStatus !== item.previousStatus && (
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.newStatus}
                    </span>
                  )}
                </div>

                {/* Date & Time */}
                <p className="text-[11px] font-medium text-slate-400">
                  {formattedDate}
                </p>

                {/* Performer Details (e.g. Reported by Vamsi / Reviewed by Admin / Assigned to Ramesh) */}
                <p className="text-[11px] text-slate-300 font-normal">
                  {item.action === 'COMPLAINT_CREATED' && (
                    <span>Reported by <strong className="text-white font-semibold">{performerName}</strong></span>
                  )}
                  {item.action === 'COMPLAINT_REVIEWED' && (
                    <span>Reviewed by <strong className="text-white font-semibold">Admin {performerName}</strong></span>
                  )}
                  {item.action === 'STAFF_ASSIGNED' && (
                    <span>{item.message}</span>
                  )}
                  {item.action === 'ASSIGNMENT_ACCEPTED' && (
                    <span>Accepted by technician <strong className="text-white font-semibold">{performerName}</strong></span>
                  )}
                  {item.action === 'WORK_STARTED' && (
                    <span>Work in progress by <strong className="text-white font-semibold">{performerName}</strong></span>
                  )}
                  {item.action === 'PROGRESS_UPDATED' && (
                    <span>Updated by <strong className="text-white font-semibold">{performerName}</strong></span>
                  )}
                  {item.action === 'RESOLVED' && (
                    <span>Resolved by technician <strong className="text-white font-semibold">{performerName}</strong></span>
                  )}
                  {item.action === 'VERIFIED' && (
                    <span>Verified by student <strong className="text-white font-semibold">{performerName}</strong></span>
                  )}
                  {item.action === 'REOPENED' && (
                    <span>Reopened by <strong className="text-white font-semibold">{performerName}</strong></span>
                  )}
                  {item.action === 'CLOSED' && (
                    <span>Closed by Admin <strong className="text-white font-semibold">{performerName}</strong></span>
                  )}
                  {item.action === 'PRIORITY_CHANGED' && (
                    <span>{item.message}</span>
                  )}
                </p>

                {/* Optional Message or Details Bubble */}
                {item.message && item.action !== 'STAFF_ASSIGNED' && item.action !== 'PRIORITY_CHANGED' && (
                  <div className="mt-1 text-xs text-slate-300 bg-slate-950/50 px-3 py-2 rounded-xl border border-slate-800/80 inline-block max-w-full whitespace-pre-wrap leading-relaxed">
                    {item.message}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComplaintTimeline;
