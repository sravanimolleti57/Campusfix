import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';
import { logActivity, getComplaintTimeline } from '../utils/activityLogger.js';
import { createNotification, notifyAdmins } from '../utils/notificationService.js';
import { buildComplaintQuery, formatPaginatedResponse } from '../utils/queryHelper.js';

/**
 * Valid status transitions for maintenance staff:
 * ASSIGNED -> IN_PROGRESS
 * REOPENED -> IN_PROGRESS
 * IN_PROGRESS -> RESOLVED
 * (Staff cannot transition to VERIFIED, CLOSED, SUBMITTED, UNDER_REVIEW, or ASSIGNED)
 */
const ALLOWED_STAFF_TRANSITIONS = {
  ASSIGNED: ['IN_PROGRESS'],
  REOPENED: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
};

/**
 * Helper to validate staff status transitions
 */
const validateStaffStatusTransition = (currentStatus, targetStatus) => {
  if (currentStatus === targetStatus) {
    return {
      valid: false,
      message: `Complaint is already in '${currentStatus}' status.`,
    };
  }

  const allowedTargets = ALLOWED_STAFF_TRANSITIONS[currentStatus] || [];
  if (!allowedTargets.includes(targetStatus)) {
    return {
      valid: false,
      message: `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed staff transitions: ${
        allowedTargets.length > 0 ? allowedTargets.join(', ') : 'None (ticket is in terminal or non-staff state)'
      }. Valid lifecycle progression is: ASSIGNED → IN_PROGRESS → RESOLVED.`,
    };
  }
  return { valid: true };
};

/**
 * @desc    Get staff dashboard statistics and summary for the logged-in technician
 * @route   GET /api/staff/dashboard
 * @access  Private (Staff only)
 */
export const getStaffDashboard = async (req, res, next) => {
  try {
    const staffId = req.user._id;

    // Fetch all complaints assigned to this staff member
    const myComplaints = await Complaint.find({ assignedTo: staffId })
      .select('status priority category title location complaintId createdAt updatedAt resolvedAt')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate real metrics
    const totalAssigned = myComplaints.length;
    const pendingAssignments = myComplaints.filter(
      (c) => c.status === 'ASSIGNED' || c.status === 'REOPENED'
    ).length;
    const inProgress = myComplaints.filter((c) => c.status === 'IN_PROGRESS').length;
    const resolved = myComplaints.filter(
      (c) => c.status === 'RESOLVED' || c.status === 'VERIFIED' || c.status === 'CLOSED'
    ).length;
    const highPriority = myComplaints.filter(
      (c) =>
        (c.priority === 'High' || c.priority === 'Critical') &&
        !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(c.status)
    ).length;

    // Priority breakdown
    const priorityCounts = {
      Low: myComplaints.filter((c) => c.priority === 'Low').length,
      Medium: myComplaints.filter((c) => c.priority === 'Medium').length,
      High: myComplaints.filter((c) => c.priority === 'High').length,
      Critical: myComplaints.filter((c) => c.priority === 'Critical').length,
    };

    // Category breakdown
    const categoryMap = {};
    myComplaints.forEach((c) => {
      categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
    }));

    // 5 Most urgent or recent complaints awaiting work
    const recentTasks = myComplaints
      .filter((c) => !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(c.status))
      .slice(0, 6);

    res.status(200).json({
      success: true,
      stats: {
        totalAssigned,
        pendingAssignments,
        inProgress,
        resolved,
        highPriority,
        priorityCounts,
        categoryBreakdown,
      },
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all complaints assigned ONLY to the logged-in staff member with search, filter, sort, and pagination
 * @route   GET /api/staff/complaints
 * @access  Private (Staff only)
 */
export const getStaffComplaints = async (req, res, next) => {
  try {
    const staffId = req.user._id;
    const { query, sort, pageNum, limitNum, skip } = buildComplaintQuery(
      req.query,
      { assignedTo: staffId }
    );

    const [totalComplaints, complaints, allAssigned] = await Promise.all([
      Complaint.countDocuments(query),
      Complaint.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('reportedBy', 'name email studentId department phone')
        .populate('assignedTo', 'name email employeeId department phone')
        .lean(),
      Complaint.find({ assignedTo: staffId }).select('status priority').lean(),
    ]);

    // Live counts for quick tab filtering
    const tabCounts = {
      all: allAssigned.length,
      pending: allAssigned.filter((c) => c.status === 'ASSIGNED' || c.status === 'REOPENED').length,
      inProgress: allAssigned.filter((c) => c.status === 'IN_PROGRESS').length,
      resolved: allAssigned.filter((c) => ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(c.status)).length,
      highPriority: allAssigned.filter(
        (c) => (c.priority === 'High' || c.priority === 'Critical') && !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(c.status)
      ).length,
    };

    const response = formatPaginatedResponse(complaints, totalComplaints, pageNum, limitNum, {
      tabCounts,
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed complaint by ID - ONLY if assigned to the logged-in staff member
 * @route   GET /api/staff/complaints/:id
 * @access  Private (Staff only)
 */
export const getStaffComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { complaintId: id };

    const complaint = await Complaint.findOne(query)
      .populate('reportedBy', 'name email studentId department phone profileImage')
      .populate('assignedTo', 'name email employeeId department phone profileImage')
      .populate('activityLog.performedBy', 'name email role department');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint record not found',
      });
    }

    // STRICT ROLE ISOLATION: Staff can ONLY view complaints assigned to them
    if (!complaint.assignedTo || complaint.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view this complaint as it is not assigned to you',
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
 * @desc    Accept assignment and transition complaint to IN_PROGRESS (Start Work)
 * @route   POST /api/staff/complaints/:id/start-work
 * @access  Private (Staff only)
 */
export const startWorkOnComplaint = async (req, res, next) => {
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

    // Role check: must be assigned to current staff
    if (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot accept or start work on a complaint not assigned to you',
      });
    }

    // Status transition validation
    const transitionCheck = validateStaffStatusTransition(complaint.status, 'IN_PROGRESS');
    if (!transitionCheck.valid) {
      return res.status(400).json({
        success: false,
        message: transitionCheck.message,
      });
    }

    const prevStatus = complaint.status;
    complaint.status = 'IN_PROGRESS';

    const note = req.body.notes?.trim() || 'Technician accepted assignment and commenced troubleshooting/maintenance work.';
    complaint.activityLog.push({
      action: 'WORK_STARTED',
      status: 'IN_PROGRESS',
      notes: note,
      performedBy: req.user._id,
      role: 'staff',
      timestamp: new Date(),
    });

    await complaint.save();

    // Log both assignment accepted and work started into ActivityLog
    await logActivity({
      complaintId: complaint._id,
      userId: req.user._id,
      action: 'ASSIGNMENT_ACCEPTED',
      previousStatus: prevStatus,
      newStatus: 'IN_PROGRESS',
      message: `Assignment accepted by ${req.user.name}`,
    });

    await logActivity({
      complaintId: complaint._id,
      userId: req.user._id,
      action: 'WORK_STARTED',
      previousStatus: 'IN_PROGRESS',
      newStatus: 'IN_PROGRESS',
      message: note,
    });

    // In-App Notification 1: Notify reporting Student that work has commenced
    await createNotification({
      recipient: complaint.reportedBy,
      title: 'Work In Progress',
      message: `Technician ${req.user.name} has accepted the assignment and started work on complaint ${complaint.complaintId}.`,
      type: 'ASSIGNMENT_ACCEPTED',
      complaint: complaint._id,
    });

    // In-App Notification 2: Notify Admins
    await notifyAdmins({
      title: 'Assignment Accepted',
      message: `${req.user.name} accepted assignment and began repair work on complaint ${complaint.complaintId}.`,
      type: 'ASSIGNMENT_ACCEPTED',
      complaint: complaint._id,
    });

    const updated = await Complaint.findById(complaint._id)
      .populate('reportedBy', 'name email studentId department phone')
      .populate('assignedTo', 'name email employeeId department phone')
      .populate('activityLog.performedBy', 'name email role department');

    res.status(200).json({
      success: true,
      message: 'Work commenced successfully. Status updated to IN_PROGRESS.',
      complaint: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add progress notes or updates during ongoing repair/resolution
 * @route   POST /api/staff/complaints/:id/progress
 * @access  Private (Staff only)
 */
export const addProgressNotes = async (req, res, next) => {
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

    // Role check: must be assigned to current staff
    if (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot update progress on a complaint not assigned to you',
      });
    }

    // Status must be IN_PROGRESS
    if (complaint.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: `Cannot add progress notes. Ticket status is '${complaint.status}'. Work must be actively IN_PROGRESS.`,
      });
    }

    const { notes } = req.body;
    if (!notes || notes.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please provide substantive progress notes (at least 3 characters)',
      });
    }

    // Handle optional progress images uploaded to Cloudinary
    let progressImages = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file, { folder: 'campusfix/progress' })
        );
        const results = await Promise.all(uploadPromises);
        progressImages = results.map((r) => r.secure_url);
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: `Failed to upload progress photos: ${err.message}`,
        });
      }
    }

    complaint.activityLog.push({
      action: 'PROGRESS_UPDATE',
      status: 'IN_PROGRESS',
      notes: notes.trim(),
      images: progressImages,
      performedBy: req.user._id,
      role: 'staff',
      timestamp: new Date(),
    });

    await complaint.save();

    await logActivity({
      complaintId: complaint._id,
      userId: req.user._id,
      action: 'PROGRESS_UPDATED',
      previousStatus: 'IN_PROGRESS',
      newStatus: 'IN_PROGRESS',
      message: `Progress update by ${req.user.name}: ${notes.trim()}`,
    });

    const updated = await Complaint.findById(complaint._id)
      .populate('reportedBy', 'name email studentId department phone')
      .populate('assignedTo', 'name email employeeId department phone')
      .populate('activityLog.performedBy', 'name email role department');

    res.status(200).json({
      success: true,
      message: 'Progress update logged successfully',
      complaint: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload resolution proof images to Cloudinary
 * @route   POST /api/staff/complaints/:id/upload
 * @access  Private (Staff only)
 */
export const uploadResolutionImages = async (req, res, next) => {
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

    // Role check: must be assigned to current staff
    if (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot upload resolution images for a complaint not assigned to you',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided for upload',
      });
    }

    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file, { folder: 'campusfix/resolutions' })
    );
    const results = await Promise.all(uploadPromises);
    const newImageUrls = results.map((r) => r.secure_url);

    complaint.resolutionImages = [...complaint.resolutionImages, ...newImageUrls];

    complaint.activityLog.push({
      action: 'RESOLUTION_IMAGES_ATTACHED',
      status: complaint.status,
      notes: `Attached ${newImageUrls.length} resolution proof image(s)`,
      images: newImageUrls,
      performedBy: req.user._id,
      role: 'staff',
      timestamp: new Date(),
    });

    await complaint.save();

    res.status(200).json({
      success: true,
      message: `${newImageUrls.length} resolution image(s) uploaded successfully`,
      resolutionImages: complaint.resolutionImages,
      uploadedUrls: newImageUrls,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark complaint as RESOLVED with resolution notes and images
 * @route   POST /api/staff/complaints/:id/resolve
 * @access  Private (Staff only)
 */
export const markComplaintAsResolved = async (req, res, next) => {
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

    // Role check: must be assigned to current staff
    if (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot mark an unassigned complaint as resolved',
      });
    }

    // Strict status transition validation: Must be IN_PROGRESS
    const transitionCheck = validateStaffStatusTransition(complaint.status, 'RESOLVED');
    if (!transitionCheck.valid) {
      return res.status(400).json({
        success: false,
        message: transitionCheck.message,
      });
    }

    const { resolutionNotes } = req.body;
    if (!resolutionNotes || resolutionNotes.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide detailed resolution notes explaining how the problem was resolved (minimum 5 characters)',
      });
    }

    // Handle any resolution images uploaded with this request
    let uploadedUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file, { folder: 'campusfix/resolutions' })
        );
        const results = await Promise.all(uploadPromises);
        uploadedUrls = results.map((r) => r.secure_url);
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: `Failed to upload resolution proof photos: ${err.message}`,
        });
      }
    } else if (req.body.resolutionImages) {
      if (Array.isArray(req.body.resolutionImages)) {
        uploadedUrls = req.body.resolutionImages;
      } else if (typeof req.body.resolutionImages === 'string') {
        try {
          const parsed = JSON.parse(req.body.resolutionImages);
          uploadedUrls = Array.isArray(parsed) ? parsed : [req.body.resolutionImages];
        } catch {
          uploadedUrls = [req.body.resolutionImages];
        }
      }
    }

    // Update complaint state
    complaint.status = 'RESOLVED';
    complaint.resolvedAt = new Date();
    complaint.resolutionNotes = resolutionNotes.trim();

    if (uploadedUrls.length > 0) {
      complaint.resolutionImages = [...new Set([...complaint.resolutionImages, ...uploadedUrls])];
    }

    complaint.activityLog.push({
      action: 'MARKED_RESOLVED',
      status: 'RESOLVED',
      notes: resolutionNotes.trim(),
      images: uploadedUrls,
      performedBy: req.user._id,
      role: 'staff',
      timestamp: new Date(),
    });

    await complaint.save();

    await logActivity({
      complaintId: complaint._id,
      userId: req.user._id,
      action: 'RESOLVED',
      previousStatus: 'IN_PROGRESS',
      newStatus: 'RESOLVED',
      message: `Resolved by ${req.user.name}: ${resolutionNotes.trim()}`,
    });

    // In-App Notification 1: Notify reporting Student to verify resolution
    await createNotification({
      recipient: complaint.reportedBy,
      title: 'Problem Marked as Resolved',
      message: `Technician ${req.user.name} has resolved complaint ${complaint.complaintId}. Please inspect and confirm resolution.`,
      type: 'COMPLAINT_RESOLVED',
      complaint: complaint._id,
    });

    // In-App Notification 2: Notify Admins
    await notifyAdmins({
      title: 'Complaint Resolved',
      message: `Complaint ${complaint.complaintId} (${complaint.category}) was resolved by technician ${req.user.name}.`,
      type: 'COMPLAINT_RESOLVED',
      complaint: complaint._id,
    });

    const updated = await Complaint.findById(complaint._id)
      .populate('reportedBy', 'name email studentId department phone')
      .populate('assignedTo', 'name email employeeId department phone')
      .populate('activityLog.performedBy', 'name email role department');

    res.status(200).json({
      success: true,
      message: 'Complaint has been marked as RESOLVED. Student will be notified to verify resolution.',
      complaint: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    General complaint update for staff (status transition, progress/resolution notes)
 * @route   PUT /api/staff/complaints/:id
 * @access  Private (Staff only)
 */
export const updateStaffComplaint = async (req, res, next) => {
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

    // STRICT ISOLATION: Staff can only update their own assigned complaints
    if (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this complaint',
      });
    }

    // Staff cannot reassign or change user/reporter/priority/category
    if (req.body.assignedTo && req.body.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Staff members are not permitted to reassign complaints',
      });
    }

    const { status, progressNotes, resolutionNotes } = req.body;

    // Handle status transitions
    if (status && status !== complaint.status) {
      const check = validateStaffStatusTransition(complaint.status, status);
      if (!check.valid) {
        return res.status(400).json({
          success: false,
          message: check.message,
        });
      }

      if (status === 'IN_PROGRESS') {
        complaint.status = 'IN_PROGRESS';
        complaint.activityLog.push({
          action: 'WORK_STARTED',
          status: 'IN_PROGRESS',
          notes: progressNotes || 'Technician commenced work on complaint',
          performedBy: req.user._id,
          role: 'staff',
          timestamp: new Date(),
        });
      } else if (status === 'RESOLVED') {
        if (!resolutionNotes && !progressNotes) {
          return res.status(400).json({
            success: false,
            message: 'Resolution notes are required when marking a complaint as RESOLVED',
          });
        }
        complaint.status = 'RESOLVED';
        complaint.resolvedAt = new Date();
        complaint.resolutionNotes = (resolutionNotes || progressNotes).trim();
        complaint.activityLog.push({
          action: 'MARKED_RESOLVED',
          status: 'RESOLVED',
          notes: (resolutionNotes || progressNotes).trim(),
          performedBy: req.user._id,
          role: 'staff',
          timestamp: new Date(),
        });
      }
    } else if (progressNotes && progressNotes.trim()) {
      // Just progress notes without status change
      complaint.activityLog.push({
        action: 'PROGRESS_UPDATE',
        status: complaint.status,
        notes: progressNotes.trim(),
        performedBy: req.user._id,
        role: 'staff',
        timestamp: new Date(),
      });
    }

    if (resolutionNotes) {
      complaint.resolutionNotes = resolutionNotes.trim();
    }

    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate('reportedBy', 'name email studentId department phone')
      .populate('assignedTo', 'name email employeeId department phone')
      .populate('activityLog.performedBy', 'name email role department');

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      complaint: updated,
    });
  } catch (error) {
    next(error);
  }
};
