import mongoose from 'mongoose';
import Complaint, {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
} from '../models/Complaint.js';
import Feedback from '../models/Feedback.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';
import { logActivity, getComplaintTimeline } from '../utils/activityLogger.js';
import { createNotification, notifyAdmins } from '../utils/notificationService.js';
import { buildComplaintQuery, formatPaginatedResponse } from '../utils/queryHelper.js';

/**
 * @desc    Submit a new complaint with Cloudinary image upload
 * @route   POST /api/complaints
 * @access  Private (Student, Admin)
 */
export const createComplaint = async (req, res, next) => {
  try {
    const { title, description, category, location, priority } = req.body;

    // Validate required fields
    if (!title || !description || !category || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, category, and campus location',
      });
    }

    // Validate category
    if (!COMPLAINT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Supported categories: ${COMPLAINT_CATEGORIES.join(', ')}`,
      });
    }

    // Validate priority if provided
    if (priority && !COMPLAINT_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Valid options: ${COMPLAINT_PRIORITIES.join(', ')}`,
      });
    }

    // Process attached images: upload directly to Cloudinary
    let images = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file, { folder: 'campusfix/complaints' })
        );
        const uploadResults = await Promise.all(uploadPromises);
        images = uploadResults.map((r) => r.secure_url);
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: `Failed to upload images to Cloudinary: ${uploadError.message}`,
        });
      }
    } else if (req.body.images) {
      if (Array.isArray(req.body.images)) {
        images = req.body.images;
      } else if (typeof req.body.images === 'string') {
        try {
          const parsed = JSON.parse(req.body.images);
          images = Array.isArray(parsed) ? parsed : [req.body.images];
        } catch {
          images = [req.body.images];
        }
      }
    }

    // Generate unique readable complaint ID (e.g. CF-2026-0001)
    const complaintId = await Complaint.generateComplaintId();

    const complaint = await Complaint.create({
      complaintId,
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      priority: priority || 'Medium',
      images,
      reportedBy: req.user._id,
      status: 'SUBMITTED',
      activityLog: [
        {
          action: 'COMPLAINT_SUBMITTED',
          status: 'SUBMITTED',
          notes: 'Complaint submitted by student reporter',
          performedBy: req.user._id,
          role: 'student',
          timestamp: new Date(),
        },
      ],
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('reportedBy', 'name email studentId department phone')
      .populate('activityLog.performedBy', 'name email role department');

    // Create ActivityLog document
    await logActivity({
      complaintId: complaint._id,
      userId: req.user._id,
      action: 'COMPLAINT_CREATED',
      previousStatus: null,
      newStatus: 'SUBMITTED',
      message: `Complaint submitted by ${req.user.name}`,
    });

    // In-App Notification 1: Notify Admins of new ticket
    await notifyAdmins({
      title: 'New Complaint Submitted',
      message: `New ${complaint.category} complaint logged: "${complaint.title}" by ${req.user.name}.`,
      type: 'COMPLAINT_SUBMITTED',
      complaint: complaint._id,
    });

    // In-App Notification 2: Notify Reporting Student of confirmation
    await createNotification({
      recipient: req.user._id,
      title: 'Complaint Submitted Successfully',
      message: `Your complaint ${complaint.complaintId} has been received and queued for administrative review.`,
      type: 'COMPLAINT_SUBMITTED',
      complaint: complaint._id,
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: populatedComplaint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all complaints reported by current student with search, filter, and pagination
 * @route   GET /api/complaints/my
 * @access  Private (Student)
 */
export const getMyComplaints = async (req, res, next) => {
  try {
    const { query, sort, pageNum, limitNum, skip } = buildComplaintQuery(
      req.query,
      { reportedBy: req.user._id }
    );

    // Execute queries concurrently for high performance
    const [totalComplaints, complaints, allMyComplaints] = await Promise.all([
      Complaint.countDocuments(query),
      Complaint.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('assignedTo', 'name email employeeId department phone')
        .lean(),
      Complaint.find({ reportedBy: req.user._id }).select('status priority').lean(),
    ]);

    // Aggregate real-time summary statistics for student dashboard
    const stats = {
      total: allMyComplaints.length,
      submitted: allMyComplaints.filter((c) => c.status === 'SUBMITTED').length,
      underReview: allMyComplaints.filter((c) => c.status === 'UNDER_REVIEW').length,
      assigned: allMyComplaints.filter((c) => c.status === 'ASSIGNED').length,
      inProgress: allMyComplaints.filter((c) => c.status === 'IN_PROGRESS').length,
      resolved: allMyComplaints.filter((c) => c.status === 'RESOLVED').length,
      verified: allMyComplaints.filter((c) => c.status === 'VERIFIED').length,
      closed: allMyComplaints.filter((c) => c.status === 'CLOSED').length,
      reopened: allMyComplaints.filter((c) => c.status === 'REOPENED').length,
    };

    const response = formatPaginatedResponse(complaints, totalComplaints, pageNum, limitNum, {
      stats,
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed complaint by ID or complaintId
 * @route   GET /api/complaints/:id
 * @access  Private
 */
export const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Search by ObjectId or readable complaintId (e.g. CF-2026-0001)
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

    // Role-based authorization: Students can only view their own complaints
    if (
      req.user.role === 'student' &&
      complaint.reportedBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this complaint ticket',
      });
    }

    // Role-based authorization: Staff can only view complaints assigned to them
    if (
      req.user.role === 'staff' &&
      (!complaint.assignedTo || complaint.assignedTo._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view this complaint as it is not assigned to you',
      });
    }

    // Fetch real database activity timeline
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
 * @desc    Get chronological activity timeline for a complaint
 * @route   GET /api/complaints/:id/timeline
 * @access  Private
 */
export const getComplaintTimelineHandler = async (req, res, next) => {
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

    // Role-based authorization
    if (
      req.user.role === 'student' &&
      complaint.reportedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view the timeline for this complaint',
      });
    }

    if (
      req.user.role === 'staff' &&
      (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view this complaint timeline',
      });
    }

    const timeline = await getComplaintTimeline(complaint._id);

    res.status(200).json({
      success: true,
      count: timeline.length,
      timeline,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update complaint details, resolution details, or student verification/feedback
 * @route   PUT /api/complaints/:id
 * @access  Private
 */
export const updateComplaint = async (req, res, next) => {
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

    // Check ownership for students
    const isOwner = complaint.reportedBy.toString() === req.user._id.toString();
    if (req.user.role === 'student' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this complaint',
      });
    }

    // Check assignment for staff
    if (req.user.role === 'staff') {
      if (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot modify a complaint that is not assigned to you',
        });
      }
      if (req.body.assignedTo && req.body.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Staff members are not permitted to reassign complaints',
        });
      }
    }

    const {
      title,
      description,
      category,
      location,
      priority,
      status,
      feedbackRating,
      feedbackComment,
      resolutionNotes,
      progressNotes,
    } = req.body;

    // Handle student actions
    if (req.user.role === 'student') {
      // 1. Student submitting verification / feedback on a RESOLVED complaint
      if (feedbackRating || feedbackComment !== undefined || status === 'VERIFIED' || status === 'REOPENED') {
        if (!['RESOLVED', 'VERIFIED', 'REOPENED'].includes(complaint.status)) {
          return res.status(400).json({
            success: false,
            message: 'Feedback can only be submitted after the technician marks the issue as RESOLVED',
          });
        }

        if (feedbackRating) {
          const ratingNum = Number(feedbackRating);
          if (ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({
              success: false,
              message: 'Feedback rating must be between 1 and 5 stars',
            });
          }
          complaint.studentFeedback = {
            rating: ratingNum,
            comment: feedbackComment ? feedbackComment.trim() : (complaint.studentFeedback?.comment || ''),
            submittedAt: new Date(),
          };

          // Sync to Feedback model if not already present
          const existingFeedback = await Feedback.findOne({ complaint: complaint._id });
          if (!existingFeedback) {
            const newFeedback = await Feedback.create({
              complaint: complaint._id,
              student: req.user._id,
              rating: ratingNum,
              comment: feedbackComment ? feedbackComment.trim() : '',
              submittedAt: new Date(),
            });
            complaint.feedback = newFeedback._id;
          }
        }

        if (status === 'VERIFIED') {
          const prevStatus = complaint.status;
          complaint.status = 'VERIFIED';
          complaint.closedAt = new Date();
          complaint.activityLog.push({
            action: 'STUDENT_VERIFIED',
            status: 'VERIFIED',
            notes: feedbackComment ? `Resolution verified by student: "${feedbackComment.trim()}"` : 'Resolution verified by student',
            performedBy: req.user._id,
            role: 'student',
            timestamp: new Date(),
          });
          await logActivity({
            complaintId: complaint._id,
            userId: req.user._id,
            action: 'VERIFIED',
            previousStatus: prevStatus,
            newStatus: 'VERIFIED',
            message: `Resolution verified by student ${req.user.name}${feedbackRating ? ` (${feedbackRating} stars)` : ''}${feedbackComment ? `: "${feedbackComment.trim()}"` : ''}`,
          });
        } else if (status === 'REOPENED') {
          const prevStatus = complaint.status;
          complaint.status = 'REOPENED';
          complaint.activityLog.push({
            action: 'STUDENT_REOPENED',
            status: 'REOPENED',
            notes: feedbackComment ? `Issue reopened by student: "${feedbackComment.trim()}"` : 'Issue reopened by student',
            performedBy: req.user._id,
            role: 'student',
            timestamp: new Date(),
          });
          await logActivity({
            complaintId: complaint._id,
            userId: req.user._id,
            action: 'REOPENED',
            previousStatus: prevStatus,
            newStatus: 'REOPENED',
            message: `Complaint reopened by student ${req.user.name}${feedbackComment ? `: "${feedbackComment.trim()}"` : ''}`,
          });
        }
      } else {
        // 2. Student updating complaint content: only permitted while in SUBMITTED or UNDER_REVIEW status
        if (!['SUBMITTED', 'UNDER_REVIEW'].includes(complaint.status)) {
          return res.status(400).json({
            success: false,
            message: `Cannot edit complaint details while in '${complaint.status}' status`,
          });
        }

        if (title) complaint.title = title.trim();
        if (description) complaint.description = description.trim();
        if (category && COMPLAINT_CATEGORIES.includes(category)) complaint.category = category;
        if (location) complaint.location = location.trim();
        if (priority && COMPLAINT_PRIORITIES.includes(priority) && priority !== complaint.priority) {
          const prevPri = complaint.priority;
          complaint.priority = priority;
          await logActivity({
            complaintId: complaint._id,
            userId: req.user._id,
            action: 'PRIORITY_CHANGED',
            previousStatus: complaint.status,
            newStatus: complaint.status,
            message: `Priority updated from ${prevPri} to ${priority} by ${req.user.name}`,
          });
        } else if (priority && COMPLAINT_PRIORITIES.includes(priority)) {
          complaint.priority = priority;
        }

        // Upload any newly uploaded images to Cloudinary
        if (req.files && req.files.length > 0) {
          const uploadPromises = req.files.map((file) =>
            uploadToCloudinary(file, { folder: 'campusfix/complaints' })
          );
          const uploadResults = await Promise.all(uploadPromises);
          const newImages = uploadResults.map((r) => r.secure_url);
          complaint.images = [...complaint.images, ...newImages];
        } else if (req.body.images && Array.isArray(req.body.images)) {
          complaint.images = req.body.images;
        }
      }
    } else if (req.user.role === 'staff') {
      // 3. Maintenance Staff actions with strict status transition rules:
      // ASSIGNED -> IN_PROGRESS -> RESOLVED
      if (status && status !== complaint.status) {
        if (status === 'IN_PROGRESS') {
          if (!['ASSIGNED', 'REOPENED'].includes(complaint.status)) {
            return res.status(400).json({
              success: false,
              message: `Invalid status transition from '${complaint.status}' to 'IN_PROGRESS'. Work can only be started when status is ASSIGNED or REOPENED.`,
            });
          }
          complaint.status = 'IN_PROGRESS';
          complaint.activityLog.push({
            action: 'WORK_STARTED',
            status: 'IN_PROGRESS',
            notes: progressNotes || 'Technician accepted assignment and commenced work',
            performedBy: req.user._id,
            role: 'staff',
            timestamp: new Date(),
          });
        } else if (status === 'RESOLVED') {
          if (complaint.status !== 'IN_PROGRESS') {
            return res.status(400).json({
              success: false,
              message: `Invalid status transition from '${complaint.status}' to 'RESOLVED'. Work must be actively IN_PROGRESS before marking as RESOLVED.`,
            });
          }
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
        } else {
          return res.status(400).json({
            success: false,
            message: `Staff members are not permitted to set status to '${status}'. Allowed transitions: ASSIGNED → IN_PROGRESS → RESOLVED.`,
          });
        }
      } else if (progressNotes && progressNotes.trim()) {
        complaint.activityLog.push({
          action: 'PROGRESS_UPDATE',
          status: complaint.status,
          notes: progressNotes.trim(),
          performedBy: req.user._id,
          role: 'staff',
          timestamp: new Date(),
        });
      }

      if (resolutionNotes !== undefined) {
        complaint.resolutionNotes = resolutionNotes.trim();
      }

      // Handle staff resolution images uploaded via Cloudinary
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file, { folder: 'campusfix/resolutions' })
        );
        const uploadResults = await Promise.all(uploadPromises);
        const newResolutionUrls = uploadResults.map((r) => r.secure_url);
        complaint.resolutionImages = [...complaint.resolutionImages, ...newResolutionUrls];
      } else if (req.body.resolutionImages) {
        if (Array.isArray(req.body.resolutionImages)) {
          complaint.resolutionImages = req.body.resolutionImages;
        } else if (typeof req.body.resolutionImages === 'string') {
          try {
            const parsed = JSON.parse(req.body.resolutionImages);
            complaint.resolutionImages = Array.isArray(parsed) ? parsed : [req.body.resolutionImages];
          } catch {
            complaint.resolutionImages = [req.body.resolutionImages];
          }
        }
      }
    } else {
      // 4. Admin updates
      if (status && COMPLAINT_STATUSES.includes(status)) {
        complaint.status = status;
        if (status === 'RESOLVED' && !complaint.resolvedAt) {
          complaint.resolvedAt = new Date();
        }
        if (status === 'CLOSED' && !complaint.closedAt) {
          complaint.closedAt = new Date();
        }
      }

      if (resolutionNotes !== undefined) {
        complaint.resolutionNotes = resolutionNotes.trim();
      }

      if (req.body.assignedTo !== undefined) {
        complaint.assignedTo = req.body.assignedTo;
      }

      // Handle resolution images uploaded via Cloudinary
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file, { folder: 'campusfix/resolutions' })
        );
        const uploadResults = await Promise.all(uploadPromises);
        const newResolutionUrls = uploadResults.map((r) => r.secure_url);
        complaint.resolutionImages = [...complaint.resolutionImages, ...newResolutionUrls];
      } else if (req.body.resolutionImages) {
        if (Array.isArray(req.body.resolutionImages)) {
          complaint.resolutionImages = req.body.resolutionImages;
        } else if (typeof req.body.resolutionImages === 'string') {
          try {
            const parsed = JSON.parse(req.body.resolutionImages);
            complaint.resolutionImages = Array.isArray(parsed) ? parsed : [req.body.resolutionImages];
          } catch {
            complaint.resolutionImages = [req.body.resolutionImages];
          }
        }
      }
    }

    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('reportedBy', 'name email studentId department phone')
      .populate('assignedTo', 'name email employeeId department phone');

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      complaint: updatedComplaint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a complaint where allowed
 * @route   DELETE /api/complaints/:id
 * @access  Private
 */
export const deleteComplaint = async (req, res, next) => {
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

    // Only owner or admin can delete
    const isOwner = complaint.reportedBy.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this complaint',
      });
    }

    // Students can only delete if the ticket has NOT been assigned or dispatched
    if (req.user.role === 'student' && !['SUBMITTED', 'UNDER_REVIEW'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete complaint while it is '${complaint.status}'. Please contact campus facilities desk.`,
      });
    }

    await Complaint.findByIdAndDelete(complaint._id);

    res.status(200).json({
      success: true,
      message: `Complaint ${complaint.complaintId} has been successfully deleted`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Direct Cloudinary upload endpoint for previewing and caching
 * @route   POST /api/complaints/upload
 * @access  Private
 */
export const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images were provided for upload',
      });
    }

    const folderType = req.query.folder || req.body.folder;
    const folder = folderType === 'resolutions' ? 'campusfix/resolutions' : 'campusfix/complaints';

    const uploadPromises = req.files.map((file) => uploadToCloudinary(file, { folder }));
    const results = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      message: `${results.length} image(s) uploaded successfully to Cloudinary`,
      images: results.map((r) => r.secure_url),
      details: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify complaint resolution (RESOLVED -> VERIFIED -> CLOSED)
 * @route   POST /api/complaints/:id/verify
 * @access  Private (Reporting Student Only)
 */
export const verifyComplaint = async (req, res, next) => {
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

    // Authorization: Only the student who originally reported the complaint can verify it
    if (complaint.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the student who originally reported this complaint can verify its resolution',
      });
    }

    // Validation: Complaint must be in RESOLVED status
    if (complaint.status !== 'RESOLVED') {
      return res.status(400).json({
        success: false,
        message: `Complaint cannot be verified while in '${complaint.status}' status. It must be marked as RESOLVED by maintenance staff.`,
      });
    }

    const { rating, comment } = req.body;

    // 1. Transition: RESOLVED -> VERIFIED
    complaint.activityLog.push({
      action: 'STUDENT_VERIFIED',
      status: 'VERIFIED',
      notes: comment ? `Resolution verified by student: "${comment.trim()}"` : 'Resolution verified by student',
      performedBy: req.user._id,
      role: 'student',
      timestamp: new Date(),
    });

    await logActivity({
      complaintId: complaint._id,
      userId: req.user._id,
      action: 'VERIFIED',
      previousStatus: 'RESOLVED',
      newStatus: 'VERIFIED',
      message: `Resolution verified by student ${req.user.name}`,
    });

    // 2. Transition: VERIFIED -> CLOSED
    complaint.activityLog.push({
      action: 'TICKET_CLOSED',
      status: 'CLOSED',
      notes: 'Complaint ticket closed after student verification',
      performedBy: req.user._id,
      role: 'student',
      timestamp: new Date(),
    });

    await logActivity({
      complaintId: complaint._id,
      userId: req.user._id,
      action: 'CLOSED',
      previousStatus: 'VERIFIED',
      newStatus: 'CLOSED',
      message: 'Complaint ticket automatically closed after student verification',
    });

    // Update status and closedAt timestamp
    complaint.status = 'CLOSED';
    complaint.closedAt = new Date();

    // If student optionally included feedback during verification
    let feedbackRecord = null;
    if (rating !== undefined && rating !== null) {
      const ratingNum = Number(rating);
      if (ratingNum >= 1 && ratingNum <= 5) {
        const existing = await Feedback.findOne({ complaint: complaint._id });
        if (!existing) {
          feedbackRecord = await Feedback.create({
            complaint: complaint._id,
            student: req.user._id,
            rating: ratingNum,
            comment: comment ? comment.trim() : '',
            submittedAt: new Date(),
          });
          complaint.studentFeedback = {
            rating: feedbackRecord.rating,
            comment: feedbackRecord.comment,
            submittedAt: feedbackRecord.submittedAt,
          };
          complaint.feedback = feedbackRecord._id;
        }
      }
    }

    await complaint.save();

    // In-App Notification 1: Notify Assigned Staff of verification
    if (complaint.assignedTo) {
      await createNotification({
        recipient: complaint.assignedTo,
        title: 'Resolution Verified',
        message: `Student ${req.user.name} has verified your resolution for complaint ${complaint.complaintId}. Ticket closed.`,
        type: 'COMPLAINT_VERIFIED',
        complaint: complaint._id,
      });
    }

    // In-App Notification 2: Notify Admins of closure
    await notifyAdmins({
      title: 'Complaint Verified & Closed',
      message: `Complaint ${complaint.complaintId} (${complaint.category}) was verified and closed by ${req.user.name}.`,
      type: 'COMPLAINT_VERIFIED',
      complaint: complaint._id,
    });

    const timeline = await getComplaintTimeline(complaint._id);
    const complaintData = complaint.toObject();
    complaintData.timeline = timeline;

    res.status(200).json({
      success: true,
      message: 'Resolution confirmed! Complaint has transitioned from RESOLVED → VERIFIED → CLOSED.',
      complaint: complaintData,
      feedback: feedbackRecord,
      timeline,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Report problem still exists (RESOLVED -> REOPENED)
 * @route   POST /api/complaints/:id/reopen
 * @access  Private (Reporting Student Only)
 */
export const reopenComplaint = async (req, res, next) => {
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

    // Authorization: Only the student who originally reported the complaint can report problem still exists
    if (complaint.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the student who originally reported this complaint can report that the problem still exists',
      });
    }

    // Validation: Complaint must be in RESOLVED status
    if (complaint.status !== 'RESOLVED') {
      return res.status(400).json({
        success: false,
        message: `Only complaints in RESOLVED status can be reopened with 'Problem Still Exists'. Current status is '${complaint.status}'.`,
      });
    }

    const { reason, comment } = req.body;
    const explanation = reason || comment || 'Problem still exists after repair';

    const prevStatus = complaint.status;
    complaint.status = 'REOPENED';
    complaint.activityLog.push({
      action: 'STUDENT_REOPENED',
      status: 'REOPENED',
      notes: `Problem still exists: "${explanation.trim()}"`,
      performedBy: req.user._id,
      role: 'student',
      timestamp: new Date(),
    });

    await logActivity({
      complaintId: complaint._id,
      userId: req.user._id,
      action: 'REOPENED',
      previousStatus: prevStatus,
      newStatus: 'REOPENED',
      message: `Problem still exists: "${explanation.trim()}" - Reported by student ${req.user.name}`,
    });

    await complaint.save();

    // In-App Notification 1: Notify Assigned Staff
    if (complaint.assignedTo) {
      await createNotification({
        recipient: complaint.assignedTo,
        title: 'Complaint Reopened',
        message: `Student reported problem still exists for complaint ${complaint.complaintId}: "${explanation.trim()}". Re-inspection required.`,
        type: 'COMPLAINT_REOPENED',
        complaint: complaint._id,
      });
    }

    // In-App Notification 2: Notify Admins
    await notifyAdmins({
      title: 'Complaint Reopened',
      message: `Complaint ${complaint.complaintId} (${complaint.category}) was reopened by student ${req.user.name}.`,
      type: 'COMPLAINT_REOPENED',
      complaint: complaint._id,
    });

    const timeline = await getComplaintTimeline(complaint._id);
    const complaintData = complaint.toObject();
    complaintData.timeline = timeline;

    res.status(200).json({
      success: true,
      message: 'Complaint reopened. Campus maintenance desk has been notified for re-inspection.',
      complaint: complaintData,
      timeline,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit feedback after complaint verification
 * @route   POST /api/complaints/:id/feedback
 * @access  Private (Reporting Student Only)
 */
export const submitFeedback = async (req, res, next) => {
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

    // Authorization: Only original reporter can submit feedback
    if (complaint.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the student who originally reported this complaint can submit feedback',
      });
    }

    // Validation: Complaint must be verified / resolved / closed
    if (!['VERIFIED', 'CLOSED', 'RESOLVED'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be provided after complaint resolution or verification',
      });
    }

    // Prevent multiple feedback submissions for the same complaint
    const existingFeedback = await Feedback.findOne({ complaint: complaint._id });
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback has already been submitted for this complaint. Multiple submissions are not allowed.',
        feedback: existingFeedback,
      });
    }

    const { rating, comment } = req.body;
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid star rating between 1 and 5',
      });
    }

    const feedback = await Feedback.create({
      complaint: complaint._id,
      student: req.user._id,
      rating: ratingNum,
      comment: comment ? comment.trim() : '',
      submittedAt: new Date(),
    });

    complaint.studentFeedback = {
      rating: feedback.rating,
      comment: feedback.comment,
      submittedAt: feedback.submittedAt,
    };
    complaint.feedback = feedback._id;

    await complaint.save();

    // In-App Notification 1: Notify Assigned Staff of student rating
    if (complaint.assignedTo) {
      await createNotification({
        recipient: complaint.assignedTo,
        title: 'Student Feedback Received',
        message: `You received a ${ratingNum}★ satisfaction rating from ${req.user.name} for complaint ${complaint.complaintId}.`,
        type: 'FEEDBACK_SUBMITTED',
        complaint: complaint._id,
      });
    }

    // In-App Notification 2: Notify Admins of review
    await notifyAdmins({
      title: 'New Student Feedback',
      message: `Student ${req.user.name} submitted a ${ratingNum}★ rating for complaint ${complaint.complaintId}.`,
      type: 'FEEDBACK_SUBMITTED',
      complaint: complaint._id,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been recorded successfully.',
      feedback,
      complaint,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Feedback has already been submitted for this complaint. Multiple submissions are not allowed.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get feedback for a specific complaint
 * @route   GET /api/complaints/:id/feedback
 * @access  Private
 */
export const getComplaintFeedback = async (req, res, next) => {
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

    const feedback = await Feedback.findOne({ complaint: complaint._id })
      .populate('student', 'name studentId department email')
      .lean();

    res.status(200).json({
      success: true,
      feedback: feedback || null,
    });
  } catch (error) {
    next(error);
  }
};

