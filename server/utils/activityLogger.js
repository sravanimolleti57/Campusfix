import ActivityLog from '../models/ActivityLog.js';

/**
 * Log an important complaint action into the ActivityLog collection
 * 
 * @param {Object} params
 * @param {String|ObjectId} params.complaintId
 * @param {String|ObjectId} params.userId
 * @param {String} params.action - e.g. COMPLAINT_CREATED, COMPLAINT_REVIEWED, PRIORITY_CHANGED, STAFF_ASSIGNED, etc.
 * @param {String} [params.previousStatus=null]
 * @param {String} [params.newStatus=null]
 * @param {String} params.message
 * @returns {Promise<Document>}
 */
export const logActivity = async ({
  complaintId,
  userId,
  action,
  previousStatus = null,
  newStatus = null,
  message,
}) => {
  try {
    const entry = await ActivityLog.create({
      complaint: complaintId,
      user: userId,
      action,
      previousStatus,
      newStatus,
      message: message.trim(),
      timestamp: new Date(),
    });
    return entry;
  } catch (error) {
    console.error(`[ActivityLog Warning]: Failed to record activity log (${action}):`, error.message);
    return null;
  }
};

/**
 * Retrieve the chronological activity timeline for a complaint
 * 
 * @param {String|ObjectId} complaintId
 * @returns {Promise<Array>}
 */
export const getComplaintTimeline = async (complaintId) => {
  return await ActivityLog.find({ complaint: complaintId })
    .sort({ timestamp: 1 })
    .populate('user', 'name role department profileImage studentId employeeId phone email')
    .lean();
};
