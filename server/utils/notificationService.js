import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Create a single in-app notification for a designated user
 */
export const createNotification = async ({
  recipient,
  title,
  message,
  type,
  complaint = null,
}) => {
  try {
    if (!recipient) return null;
    return await Notification.create({
      recipient,
      title,
      message,
      type,
      complaint,
      isRead: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('[Notification Error]: Failed to create notification:', error.message);
    return null;
  }
};

/**
 * Dispatch an in-app notification to all active system administrators
 */
export const notifyAdmins = async ({ title, message, type, complaint = null }) => {
  try {
    const activeAdmins = await User.find({ role: 'admin', isActive: true }).select('_id');
    if (!activeAdmins || activeAdmins.length === 0) return [];

    const notificationsToInsert = activeAdmins.map((admin) => ({
      recipient: admin._id,
      title,
      message,
      type,
      complaint,
      isRead: false,
      createdAt: new Date(),
    }));

    return await Notification.insertMany(notificationsToInsert);
  } catch (error) {
    console.error('[Notification Error]: Failed to broadcast to admins:', error.message);
    return [];
  }
};
