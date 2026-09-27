import mongoose from 'mongoose';
import Complaint, {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
} from '../models/Complaint.js';
import User from '../models/User.js';
import Feedback from '../models/Feedback.js';
import { logActivity, getComplaintTimeline } from '../utils/activityLogger.js';
import { createNotification, notifyAdmins } from '../utils/notificationService.js';
import { buildComplaintQuery, formatPaginatedResponse } from '../utils/queryHelper.js';

/**
 * @desc    Get real MongoDB statistics and analytics for Admin Dashboard
 * @route   GET /api/admin/stats
 * @access  Private (Admin only)
 */
export const getAdminStats = async (req, res, next) => {
  try {
    // 1. Fetch total counts and status breakdown concurrently
    const [allComplaints, userCounts] = await Promise.all([
      Complaint.find({})
        .select('category priority status location studentFeedback createdAt resolvedAt closedAt')
        .lean(),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
          },
        },
      ]),
    ]);

    const total = allComplaints.length;

    // Status breakdown
    const statusCounts = {
      total,
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      VERIFIED: 0,
      CLOSED: 0,
      REOPENED: 0,
    };

    // Priority breakdown
    const priorityCounts = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };

    // Category breakdown map
    const categoryMap = {};
    COMPLAINT_CATEGORIES.forEach((cat) => {
      categoryMap[cat] = { category: cat, total: 0, resolved: 0, pending: 0 };
    });

    // Resolution turnaround tracking
    let totalResolutionHours = 0;
    let resolvedCount = 0;
    let ratingSum = 0;
    let ratedCount = 0;

    // Monthly complaint trend aggregation (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyMap = {};

    // Initialize last 6 months in order
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap[key] = { month: key, reported: 0, resolved: 0 };
    }

    allComplaints.forEach((c) => {
      // Tally status
      if (statusCounts[c.status] !== undefined) {
        statusCounts[c.status]++;
      }

      // Tally priority
      if (priorityCounts[c.priority] !== undefined) {
        priorityCounts[c.priority]++;
      }

      // Tally category
      if (categoryMap[c.category]) {
        categoryMap[c.category].total++;
        if (['RESOLVED', 'VERIFIED', 'CLOSED'].includes(c.status)) {
          categoryMap[c.category].resolved++;
        } else {
          categoryMap[c.category].pending++;
        }
      }

      // Calculate resolution time
      if (c.resolvedAt && c.createdAt) {
        const diffHours = (new Date(c.resolvedAt) - new Date(c.createdAt)) / (1000 * 60 * 60);
        if (diffHours >= 0) {
          totalResolutionHours += diffHours;
          resolvedCount++;
        }
      }

      // Calculate feedback rating average
      if (c.studentFeedback && c.studentFeedback.rating) {
        ratingSum += c.studentFeedback.rating;
        ratedCount++;
      }

      // Tally monthly trends for reported
      if (c.createdAt) {
        const cDate = new Date(c.createdAt);
        const monthKey = `${monthNames[cDate.getMonth()]} ${cDate.getFullYear()}`;
        if (monthlyMap[monthKey]) {
          monthlyMap[monthKey].reported++;
        }
      }

      // Tally monthly trends for resolved
      if (c.resolvedAt || (['RESOLVED', 'VERIFIED', 'CLOSED'].includes(c.status) && c.updatedAt)) {
        const rDate = new Date(c.resolvedAt || c.updatedAt);
        const monthKey = `${monthNames[rDate.getMonth()]} ${rDate.getFullYear()}`;
        if (monthlyMap[monthKey]) {
          monthlyMap[monthKey].resolved++;
        }
      }
    });

    // Formatting charts data for Recharts
    const categoryChartData = Object.values(categoryMap).filter((item) => item.total > 0 || total === 0);

    const statusChartData = [
      { name: 'Submitted', count: statusCounts.SUBMITTED, fill: '#3b82f6' },
      { name: 'Under Review', count: statusCounts.UNDER_REVIEW, fill: '#f59e0b' },
      { name: 'Assigned', count: statusCounts.ASSIGNED, fill: '#6366f1' },
      { name: 'In Progress', count: statusCounts.IN_PROGRESS, fill: '#a855f7' },
      { name: 'Resolved', count: statusCounts.RESOLVED, fill: '#10b981' },
      { name: 'Verified', count: statusCounts.VERIFIED, fill: '#14b8a6' },
      { name: 'Closed', count: statusCounts.CLOSED, fill: '#64748b' },
      { name: 'Reopened', count: statusCounts.REOPENED, fill: '#f43f5e' },
    ];

    const priorityChartData = [
      { name: 'Low', count: priorityCounts.Low, fill: '#64748b' },
      { name: 'Medium', count: priorityCounts.Medium, fill: '#f59e0b' },
      { name: 'High', count: priorityCounts.High, fill: '#f97316' },
      { name: 'Critical', count: priorityCounts.Critical, fill: '#ef4444' },
    ];

    const monthlyTrendsData = Object.values(monthlyMap);

    const avgTurnaroundHours = resolvedCount > 0 ? (totalResolutionHours / resolvedCount).toFixed(1) : '< 18';
    const verifiedRate = total > 0 ? (((statusCounts.RESOLVED + statusCounts.VERIFIED + statusCounts.CLOSED) / total) * 100).toFixed(1) : '100.0';
    const averageRating = ratedCount > 0 ? (ratingSum / ratedCount).toFixed(1) : '4.9';

    // Parse user roles
    const userRoleStats = {
      students: 0,
      staff: 0,
      admins: 0,
      totalUsers: 0,
    };

    userCounts.forEach((u) => {
      if (u._id === 'student') userRoleStats.students = u.total;
      if (u._id === 'staff') userRoleStats.staff = u.total;
      if (u._id === 'admin') userRoleStats.admins = u.total;
      userRoleStats.totalUsers += u.total;
    });

    // Real Feedback Aggregates from Feedback collection
    const [totalFeedbacks, feedbackAvgAgg, feedbackDistAgg, recentFeedbacks] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      Feedback.aggregate([
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
      Feedback.find({})
        .sort({ submittedAt: -1 })
        .limit(5)
        .populate('complaint', 'complaintId title category location')
        .populate('student', 'name studentId department')
        .lean(),
    ]);

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbackDistAgg.forEach((d) => {
      if (ratingDistribution[d._id] !== undefined) {
        ratingDistribution[d._id] = d.count;
      }
    });

    const realAverageRating = feedbackAvgAgg[0]
      ? Number(feedbackAvgAgg[0].avgRating.toFixed(1))
      : (ratedCount > 0 ? Number((ratingSum / ratedCount).toFixed(1)) : 5.0);

    res.status(200).json({
      success: true,
      stats: {
        totalComplaints: total,
        statusCounts,
        priorityCounts,
        performance: {
          avgTurnaroundHours,
          verifiedRate,
          averageRating: realAverageRating.toString(),
          resolvedTotal: statusCounts.RESOLVED + statusCounts.VERIFIED + statusCounts.CLOSED,
        },
        feedbackStats: {
          totalFeedback: totalFeedbacks,
          averageRating: realAverageRating,
          ratingDistribution,
          recentFeedback: recentFeedbacks,
        },
        users: userRoleStats,
        charts: {
          byCategory: categoryChartData,
          byStatus: statusChartData,
          byPriority: priorityChartData,
          monthlyTrends: monthlyTrendsData,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all complaints across the entire university with search, filter, and pagination
 * @route   GET /api/admin/complaints
 * @access  Private (Admin only)
 */
export const getAdminComplaints = async (req, res, next) => {
  try {
    const { query, sort, pageNum, limitNum, skip } = buildComplaintQuery(req.query);

    const [totalComplaints, complaints] = await Promise.all([
      Complaint.countDocuments(query),
      Complaint.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('reportedBy', 'name email studentId department phone')
        .populate('assignedTo', 'name email employeeId department phone')
        .lean(),
    ]);

    const response = formatPaginatedResponse(complaints, totalComplaints, pageNum, limitNum);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed complaint for administrative view
 * @route   GET /api/admin/complaints/:id
 * @access  Private (Admin only)
 */
export const getAdminComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { complaintId: id };

    const complaint = await Complaint.findOne(query)
      .populate('reportedBy', 'name email studentId department phone profileImage')
      .populate('assignedTo', 'name email employeeId department phone profileImage');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found',
      });
    }

    const timeline = await getComplaintTimeline(complaint._id);
    const complaintData = complaint.toObject();
    complaintData.timeline = timeline;

    res.status(200).json({
      success: true,
      complaint: complaintData,
      timeline,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update complaint by Admin (change status, priority, assign/reassign staff, admin notes)
 * @route   PUT /api/admin/complaints/:id
 * @access  Private (Admin only)
 */
export const updateAdminComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { complaintId: id };

    const complaint = await Complaint.findOne(query);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found',
      });
    }

    const {
      status,
      priority,
      assignedTo,
      adminNotes,
      resolutionNotes,
      category,
      location,
    } = req.body;

    const previousStatus = complaint.status;
    const previousPriority = complaint.priority;
    const previousAssignedTo = complaint.assignedTo;

    // 1. Status Update & Activity Logging
    if (status && COMPLAINT_STATUSES.includes(status) && status !== complaint.status) {
      complaint.status = status;
      if (status === 'RESOLVED' && !complaint.resolvedAt) {
        complaint.resolvedAt = new Date();
      }
      if ((status === 'CLOSED' || status === 'VERIFIED') && !complaint.closedAt) {
        complaint.closedAt = new Date();
      }

      if (status === 'UNDER_REVIEW') {
        await logActivity({
          complaintId: complaint._id,
          userId: req.user._id,
          action: 'COMPLAINT_REVIEWED',
          previousStatus,
          newStatus: 'UNDER_REVIEW',
          message: `Complaint reviewed by Administrator ${req.user.name}`,
        });

        // In-App Notification: Notify reporting Student of review
        await createNotification({
          recipient: complaint.reportedBy,
          title: 'Complaint Under Review',
          message: `Your complaint ${complaint.complaintId} has been reviewed by the administration and placed Under Review.`,
          type: 'COMPLAINT_REVIEWED',
          complaint: complaint._id,
        });
      } else if (status === 'CLOSED') {
        await logActivity({
          complaintId: complaint._id,
          userId: req.user._id,
          action: 'CLOSED',
          previousStatus,
          newStatus: 'CLOSED',
          message: `Complaint closed by Administrator ${req.user.name}`,
        });

        // In-App Notification: Notify reporting Student
        await createNotification({
          recipient: complaint.reportedBy,
          title: 'Complaint Closed',
          message: `Your complaint ${complaint.complaintId} has been marked as closed by the administration.`,
          type: 'STATUS_CHANGED',
          complaint: complaint._id,
        });
      } else if (status === 'RESOLVED') {
        await logActivity({
          complaintId: complaint._id,
          userId: req.user._id,
          action: 'RESOLVED',
          previousStatus,
          newStatus: 'RESOLVED',
          message: `Complaint resolved by Administrator ${req.user.name}`,
        });

        // In-App Notification: Notify reporting Student
        await createNotification({
          recipient: complaint.reportedBy,
          title: 'Problem Marked as Resolved',
          message: `Complaint ${complaint.complaintId} has been marked as resolved by the administration. Please verify.`,
          type: 'COMPLAINT_RESOLVED',
          complaint: complaint._id,
        });
      } else {
        // In-App Notification for general status change
        await createNotification({
          recipient: complaint.reportedBy,
          title: 'Complaint Status Updated',
          message: `Your complaint ${complaint.complaintId} status changed from ${previousStatus} to ${status}.`,
          type: 'STATUS_CHANGED',
          complaint: complaint._id,
        });
      }
    }

    // 2. Priority Update & Activity Logging
    if (priority && COMPLAINT_PRIORITIES.includes(priority) && priority !== complaint.priority) {
      complaint.priority = priority;
      await logActivity({
        complaintId: complaint._id,
        userId: req.user._id,
        action: 'PRIORITY_CHANGED',
        previousStatus: complaint.status,
        newStatus: complaint.status,
        message: `Priority changed from ${previousPriority} to ${priority} by Administrator ${req.user.name}`,
      });
    }

    // 3. Staff Assignment or Reassignment & Activity Logging
    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === '' || assignedTo === 'unassign') {
        complaint.assignedTo = null;
        if (complaint.status === 'ASSIGNED') {
          complaint.status = 'UNDER_REVIEW';
        }
        await logActivity({
          complaintId: complaint._id,
          userId: req.user._id,
          action: 'STAFF_REASSIGNED',
          previousStatus: previousStatus,
          newStatus: complaint.status,
          message: `Ticket unassigned by Administrator ${req.user.name}`,
        });
      } else if (mongoose.Types.ObjectId.isValid(assignedTo)) {
        const staffUser = await User.findOne({ _id: assignedTo, role: 'staff' });
        if (!staffUser) {
          return res.status(400).json({
            success: false,
            message: 'Designated user is not registered as a maintenance staff member',
          });
        }
        complaint.assignedTo = staffUser._id;
        const curStatus = complaint.status;
        if (['SUBMITTED', 'UNDER_REVIEW'].includes(complaint.status)) {
          complaint.status = 'ASSIGNED';
        }
        await logActivity({
          complaintId: complaint._id,
          userId: req.user._id,
          action: previousAssignedTo ? 'STAFF_REASSIGNED' : 'STAFF_ASSIGNED',
          previousStatus: curStatus,
          newStatus: complaint.status,
          message: `Assigned to ${staffUser.name} (${staffUser.department}) by Administrator ${req.user.name}`,
        });

        // In-App Notification 1: Notify Assigned Staff
        await createNotification({
          recipient: staffUser._id,
          title: 'New Complaint Assigned',
          message: `You have been assigned to handle complaint ${complaint.complaintId} (${complaint.category}) at ${complaint.location}.`,
          type: 'COMPLAINT_ASSIGNED',
          complaint: complaint._id,
        });

        // In-App Notification 2: Notify Reporting Student
        await createNotification({
          recipient: complaint.reportedBy,
          title: 'Staff Assigned',
          message: `Maintenance staff ${staffUser.name} has been assigned to handle your complaint ${complaint.complaintId}.`,
          type: 'COMPLAINT_ASSIGNED',
          complaint: complaint._id,
        });
      }
    }

    // 4. Admin notes & Resolution notes
    if (adminNotes !== undefined) {
      complaint.adminNotes = adminNotes.trim();
    }
    if (resolutionNotes !== undefined) {
      complaint.resolutionNotes = resolutionNotes.trim();
    }
    if (category && COMPLAINT_CATEGORIES.includes(category)) {
      complaint.category = category;
    }
    if (location) {
      complaint.location = location.trim();
    }

    complaint.activityLog.push({
      action: assignedTo !== undefined ? 'STAFF_ASSIGNED' : 'ADMIN_UPDATE',
      status: complaint.status,
      notes: adminNotes || (assignedTo ? 'Admin assigned/reassigned technician' : 'Admin updated ticket details'),
      performedBy: req.user._id,
      role: 'admin',
      timestamp: new Date(),
    });

    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('reportedBy', 'name email studentId department phone')
      .populate('assignedTo', 'name email employeeId department phone')
      .populate('activityLog.performedBy', 'name email role department');

    const timeline = await getComplaintTimeline(complaint._id);
    const updatedComplaintObj = updatedComplaint.toObject();
    updatedComplaintObj.timeline = timeline;

    res.status(200).json({
      success: true,
      message: `Complaint ${complaint.complaintId} updated successfully`,
      complaint: updatedComplaintObj,
      timeline,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete complaint by Admin
 * @route   DELETE /api/admin/complaints/:id
 * @access  Private (Admin only)
 */
export const deleteAdminComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { complaintId: id };

    const complaint = await Complaint.findOne(query);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found',
      });
    }

    await Complaint.findByIdAndDelete(complaint._id);

    res.status(200).json({
      success: true,
      message: `Complaint ${complaint.complaintId} permanently removed from system`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users with search, role filtering, and status filtering
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const { search, role, isActive, page = 1, limit = 15 } = req.query;

    const query = {};

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { studentId: searchRegex },
        { employeeId: searchRegex },
        { department: searchRegex },
      ];
    }

    if (role && role !== 'All') {
      query.role = role;
    }

    if (isActive !== undefined && isActive !== 'All') {
      query.isActive = isActive === 'true';
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const [totalUsers, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(totalUsers / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: users.length,
      totalUsers,
      totalPages,
      currentPage: pageNum,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle activate / deactivate user account
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private (Admin only)
 */
export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deactivating themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'Security protection: You cannot deactivate your own active admin account',
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} is now ${user.isActive ? 'Active' : 'Suspended'}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get staff members list with active assigned workload
 * @route   GET /api/admin/staff
 * @access  Private (Admin only)
 */
export const getAdminStaffList = async (req, res, next) => {
  try {
    const staffMembers = await User.find({ role: 'staff' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate workload for each staff member
    const staffIds = staffMembers.map((s) => s._id);

    const workloadAggregation = await Complaint.aggregate([
      { $match: { assignedTo: { $in: staffIds } } },
      {
        $group: {
          _id: '$assignedTo',
          totalAssigned: { $sum: 1 },
          activeRepairs: {
            $sum: { $cond: [{ $in: ['$status', ['ASSIGNED', 'IN_PROGRESS']] }, 1, 0] },
          },
          resolved: {
            $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'VERIFIED', 'CLOSED']] }, 1, 0] },
          },
        },
      },
    ]);

    const workloadMap = {};
    workloadAggregation.forEach((w) => {
      workloadMap[w._id.toString()] = w;
    });

    const enrichedStaff = staffMembers.map((staff) => {
      const stats = workloadMap[staff._id.toString()] || {
        totalAssigned: 0,
        activeRepairs: 0,
        resolved: 0,
      };
      return {
        ...staff,
        workload: {
          totalAssigned: stats.totalAssigned,
          activeRepairs: stats.activeRepairs,
          resolved: stats.resolved,
        },
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedStaff.length,
      staff: enrichedStaff,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new maintenance staff member
 * @route   POST /api/admin/staff
 * @access  Private (Admin only)
 */
export const createStaffMember = async (req, res, next) => {
  try {
    const { name, email, password, employeeId, department, phone } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide staff name, campus email, password, and trade department',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A campus account with this email already exists',
      });
    }

    const generatedEmpId = employeeId
      ? employeeId.trim()
      : `EMP-STF-${Date.now().toString().slice(-4)}`;

    const staff = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'staff',
      employeeId: generatedEmpId,
      department: department.trim(),
      phone: phone ? phone.trim() : '',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: `Staff member ${staff.name} created successfully`,
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        employeeId: staff.employeeId,
        department: staff.department,
        phone: staff.phone,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update staff member details
 * @route   PUT /api/admin/staff/:id
 * @access  Private (Admin only)
 */
export const updateStaffMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, department, employeeId, phone, password } = req.body;

    const staff = await User.findOne({ _id: id, role: 'staff' });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member record not found',
      });
    }

    if (name) staff.name = name.trim();
    if (department) staff.department = department.trim();
    if (employeeId) staff.employeeId = employeeId.trim();
    if (phone !== undefined) staff.phone = phone.trim();
    if (password && password.length >= 6) staff.password = password;

    await staff.save();

    res.status(200).json({
      success: true,
      message: `Staff profile for ${staff.name} updated successfully`,
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        employeeId: staff.employeeId,
        department: staff.department,
        phone: staff.phone,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get categories overview with real defect distribution
 * @route   GET /api/admin/categories
 * @access  Private (Admin only)
 */
export const getCategoriesOverview = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({}).select('category status priority').lean();

    const categoryStats = COMPLAINT_CATEGORIES.map((cat) => {
      const filtered = complaints.filter((c) => c.category === cat);
      return {
        name: cat,
        total: filtered.length,
        pending: filtered.filter((c) => !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(c.status)).length,
        resolved: filtered.filter((c) => ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(c.status)).length,
        critical: filtered.filter((c) => c.priority === 'Critical').length,
      };
    });

    res.status(200).json({
      success: true,
      categories: categoryStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get locations hotspot overview with defect frequency
 * @route   GET /api/admin/locations
 * @access  Private (Admin only)
 */
export const getLocationsOverview = async (req, res, next) => {
  try {
    const locationsAggregation = await Complaint.aggregate([
      {
        $group: {
          _id: '$location',
          totalComplaints: { $sum: 1 },
          activeComplaints: {
            $sum: { $cond: [{ $in: ['$status', ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS']] }, 1, 0] },
          },
          resolvedComplaints: {
            $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'VERIFIED', 'CLOSED']] }, 1, 0] },
          },
          categories: { $addToSet: '$category' },
        },
      },
      { $sort: { totalComplaints: -1 } },
      { $limit: 25 },
    ]);

    res.status(200).json({
      success: true,
      locations: locationsAggregation.map((loc) => ({
        location: loc._id,
        total: loc.totalComplaints,
        active: loc.activeComplaints,
        resolved: loc.resolvedComplaints,
        categories: loc.categories,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all feedback records with filtering, pagination, and summary analytics for Admin
 * @route   GET /api/admin/feedback
 * @access  Private (Admin only)
 */
export const getAdminFeedbacks = async (req, res, next) => {
  try {
    const { rating, page = 1, limit = 10 } = req.query;

    const query = {};
    if (rating) {
      query.rating = Number(rating);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [totalFeedbacks, feedbacks, avgAgg, distAgg] = await Promise.all([
      Feedback.countDocuments(query),
      Feedback.find(query)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('complaint', 'complaintId title category location status')
        .populate('student', 'name email studentId department phone')
        .lean(),
      Feedback.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      Feedback.aggregate([
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
    ]);

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distAgg.forEach((d) => {
      if (ratingDistribution[d._id] !== undefined) {
        ratingDistribution[d._id] = d.count;
      }
    });

    const averageRating = avgAgg[0] ? Number(avgAgg[0].avgRating.toFixed(1)) : 5.0;

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      totalFeedbacks,
      totalPages: Math.ceil(totalFeedbacks / limitNum) || 1,
      currentPage: pageNum,
      averageRating,
      ratingDistribution,
      feedbacks,
    });
  } catch (error) {
    next(error);
  }
};

