import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have a recipient'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: [
        'COMPLAINT_SUBMITTED',
        'COMPLAINT_REVIEWED',
        'COMPLAINT_ASSIGNED',
        'ASSIGNMENT_ACCEPTED',
        'STATUS_CHANGED',
        'COMPLAINT_RESOLVED',
        'COMPLAINT_REOPENED',
        'COMPLAINT_VERIFIED',
        'FEEDBACK_SUBMITTED',
        'GENERAL',
      ],
      default: 'GENERAL',
      index: true,
    },
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user notifications querying & unread counting
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
