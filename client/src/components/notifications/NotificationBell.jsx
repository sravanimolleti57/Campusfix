import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/api';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Wrench,
  ShieldCheck,
  Star,
  Eye,
  UserCheck,
  RefreshCw,
  Loader2,
  ArrowRight,
} from 'lucide-react';

/**
 * Maps notification type to matching icon, background, and accent color
 */
const getNotificationTypeConfig = (type) => {
  switch (type) {
    case 'COMPLAINT_SUBMITTED':
      return {
        icon: FileText,
        bg: 'bg-blue-500/15',
        text: 'text-blue-400',
        border: 'border-blue-500/20',
        label: 'Complaint Submitted',
      };
    case 'COMPLAINT_REVIEWED':
      return {
        icon: Eye,
        bg: 'bg-purple-500/15',
        text: 'text-purple-400',
        border: 'border-purple-500/20',
        label: 'Under Review',
      };
    case 'COMPLAINT_ASSIGNED':
      return {
        icon: UserCheck,
        bg: 'bg-cyan-500/15',
        text: 'text-cyan-400',
        border: 'border-cyan-500/20',
        label: 'Staff Assigned',
      };
    case 'ASSIGNMENT_ACCEPTED':
      return {
        icon: Wrench,
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        label: 'Work In Progress',
      };
    case 'STATUS_CHANGED':
      return {
        icon: RefreshCw,
        bg: 'bg-sky-500/15',
        text: 'text-sky-400',
        border: 'border-sky-500/20',
        label: 'Status Updated',
      };
    case 'COMPLAINT_RESOLVED':
      return {
        icon: CheckCircle2,
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        label: 'Resolved',
      };
    case 'COMPLAINT_REOPENED':
      return {
        icon: AlertTriangle,
        bg: 'bg-rose-500/15',
        text: 'text-rose-400',
        border: 'border-rose-500/20',
        label: 'Reopened',
      };
    case 'COMPLAINT_VERIFIED':
      return {
        icon: ShieldCheck,
        bg: 'bg-teal-500/15',
        text: 'text-teal-400',
        border: 'border-teal-500/20',
        label: 'Verified & Closed',
      };
    case 'FEEDBACK_SUBMITTED':
      return {
        icon: Star,
        bg: 'bg-yellow-500/15',
        text: 'text-yellow-400',
        border: 'border-yellow-500/20',
        label: 'Feedback Received',
      };
    default:
      return {
        icon: Bell,
        bg: 'bg-slate-800',
        text: 'text-slate-300',
        border: 'border-slate-700',
        label: 'Campus Notification',
      };
  }
};

/**
 * Format relative time (e.g., 'Just now', '5m ago', '3h ago')
 */
const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 30) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const NotificationBell = ({ align = 'right' }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const containerRef = useRef(null);

  // Fetch real notifications from database
  const fetchNotifications = async (showLoadingSpinner = false) => {
    if (!isAuthenticated) return;
    try {
      if (showLoadingSpinner) setLoading(true);
      const res = await notificationService.getNotifications({
        limit: 25,
        unreadOnly: filterUnreadOnly,
      });

      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('[NotificationBell] Failed to fetch notifications:', err);
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  // Initial load and auto-polling every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications(true);

    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, filterUnreadOnly]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mark single notification as read
  const handleMarkAsRead = async (e, notificationId) => {
    e.stopPropagation();
    try {
      const res = await notificationService.markAsRead(notificationId);
      if (res.data?.success) {
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === notificationId ? { ...item, isRead: true } : item
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('[NotificationBell] Mark as read error:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    try {
      setMarkingAll(true);
      const res = await notificationService.markAllAsRead();
      if (res.data?.success) {
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('[NotificationBell] Mark all as read error:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  // Click on a notification item to navigate and mark as read
  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead({ stopPropagation: () => {} }, notif._id);
    }
    setIsOpen(false);

    // Direct routing based on user role and complaint reference
    const complaintId = notif.complaint?._id || notif.complaint;
    if (complaintId) {
      if (user?.role === 'student') {
        navigate(`/student/complaints/${complaintId}`);
      } else if (user?.role === 'staff') {
        navigate(`/staff/complaints/${complaintId}`);
      } else if (user?.role === 'admin') {
        navigate('/admin/complaints');
      } else {
        navigate('/');
      }
    } else {
      if (user?.role === 'admin') navigate('/admin/dashboard');
      else if (user?.role === 'staff') navigate('/staff/dashboard');
      else navigate('/student');
    }
  };

  if (!isAuthenticated) return null;

  const displayedNotifications = filterUnreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications(false);
          }
        }}
        className={`relative p-2 rounded-xl transition-all duration-200 ${
          isOpen
            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/20'
            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
        }`}
        aria-label="View notifications"
        title="In-App Notifications"
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform group-hover:scale-110" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-blue-500 text-[10px] font-extrabold text-white ring-2 ring-[#0b0f19] shadow-md shadow-blue-500/50">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
            <span className="absolute -top-1 -right-1 flex h-4 w-4 rounded-full bg-blue-400 opacity-75 animate-ping pointer-events-none" />
          </>
        )}
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'left' ? 'left-0' : 'right-0'
          } mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/80 z-50 overflow-hidden flex flex-col text-xs animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header */}
          <div className="p-3.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Notifications</span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  Up to date
                </span>
              )}
            </div>

            {/* Mark All As Read Button */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAll}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all disabled:opacity-50"
                title="Mark all notifications as read"
              >
                {markingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="px-3 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2">
            <button
              onClick={() => setFilterUnreadOnly(false)}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all ${
                !filterUnreadOnly
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              All Notifications
            </button>
            <button
              onClick={() => setFilterUnreadOnly(true)}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all flex items-center gap-1.5 ${
                filterUnreadOnly
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>Unread Only</span>
              {unreadCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              )}
            </button>
          </div>

          {/* Body: Notifications List / Loading / Empty */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin scrollbar-thumb-slate-700">
            {/* Loading State */}
            {loading && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((skeleton) => (
                  <div key={skeleton} className="flex items-start gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 shrink-0" />
                    <div className="flex-1 space-y-2 py-0.5">
                      <div className="h-3.5 bg-slate-800 rounded w-3/4" />
                      <div className="h-3 bg-slate-800/60 rounded w-5/6" />
                      <div className="h-2.5 bg-slate-800/40 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && displayedNotifications.length === 0 && (
              <div className="py-12 px-6 text-center flex flex-col items-center justify-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
                  <BellOff className="w-6 h-6 stroke-1" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-200 text-sm">
                    {filterUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                  <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
                    {filterUnreadOnly
                      ? 'You are all caught up! Switch to "All" to view previous notifications.'
                      : 'You will receive real-time notifications when complaints are reported, reviewed, assigned, or resolved.'}
                  </p>
                </div>
              </div>
            )}

            {/* Notification Items List */}
            {!loading &&
              displayedNotifications.map((notif) => {
                const config = getNotificationTypeConfig(notif.type);
                const IconComponent = config.icon;

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group relative ${
                      !notif.isRead
                        ? 'bg-blue-950/20 hover:bg-blue-950/35 border-l-2 border-l-blue-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Icon Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl ${config.bg} ${config.text} ${config.border} border flex items-center justify-center shrink-0 mt-0.5 shadow-sm`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-xs font-bold truncate leading-tight ${
                            !notif.isRead ? 'text-white' : 'text-slate-300'
                          }`}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Attached Complaint Metadata Tag */}
                      <div className="flex items-center gap-2 pt-0.5">
                        {notif.complaint?.complaintId && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/80">
                            #{notif.complaint.complaintId}
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${config.bg} ${config.text}`}
                        >
                          {config.label}
                        </span>
                      </div>
                    </div>

                    {/* Action: Mark as read button if unread */}
                    {!notif.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(e, notif._id)}
                        className="opacity-80 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors shrink-0"
                        title="Mark as read"
                        aria-label="Mark notification as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Updates</span>
            </span>

            <button
              onClick={() => fetchNotifications(true)}
              className="hover:text-white flex items-center gap-1 transition-colors"
              title="Refresh notifications"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
