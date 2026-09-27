import mongoose from 'mongoose';

const COMPLAINT_CATEGORIES = [
  'Electrical',
  'Plumbing',
  'Internet/Wi-Fi',
  'Classroom',
  'Laboratory',
  'Hostel',
  'Cleaning',
  'Furniture',
  'Security',
  'Other',
];

const COMPLAINT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const COMPLAINT_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'VERIFIED',
  'CLOSED',
  'REOPENED',
];

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a complaint title'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed complaint description'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please specify a problem category'],
      enum: {
        values: COMPLAINT_CATEGORIES,
        message: '{VALUE} is not a supported complaint category',
      },
    },
    location: {
      type: String,
      required: [true, 'Please specify the campus location (e.g. Science Block B, Room 204)'],
      trim: true,
    },
    priority: {
      type: String,
      enum: {
        values: COMPLAINT_PRIORITIES,
        message: '{VALUE} is not a valid priority level',
      },
      default: 'Medium',
    },
    images: {
      type: [String],
      default: [],
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Complaint must have an associated student reporter'],
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: COMPLAINT_STATUSES,
        message: '{VALUE} is not a valid complaint status',
      },
      default: 'SUBMITTED',
      index: true,
    },
    resolutionNotes: {
      type: String,
      default: '',
      trim: true,
    },
    adminNotes: {
      type: String,
      default: '',
      trim: true,
    },
    resolutionImages: {
      type: [String],
      default: [],
    },
    studentFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      comment: {
        type: String,
        default: '',
        trim: true,
      },
      submittedAt: {
        type: Date,
        default: null,
      },
    },
    feedback: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    activityLog: [
      {
        action: {
          type: String,
          required: true,
        },
        status: {
          type: String,
        },
        notes: {
          type: String,
          default: '',
          trim: true,
        },
        images: {
          type: [String],
          default: [],
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for search, filtering, and sorting
complaintSchema.index({ reportedBy: 1, createdAt: -1 });
complaintSchema.index({ assignedTo: 1, createdAt: -1 });
complaintSchema.index({ status: 1, priority: 1, createdAt: -1 });
complaintSchema.index({ category: 1, createdAt: -1 });
complaintSchema.index({ createdAt: -1 });


// Helper method to generate the next readable complaint ID in format CF-YYYY-XXXX
complaintSchema.statics.generateComplaintId = async function () {
  const currentYear = new Date().getFullYear();
  const prefix = `CF-${currentYear}-`;

  // Find the highest existing complaintId matching the current year's prefix
  const latestComplaint = await this.findOne({
    complaintId: new RegExp(`^${prefix}\\d{4}$`),
  })
    .sort({ complaintId: -1 })
    .lean();

  let nextSequence = 1;
  if (latestComplaint && latestComplaint.complaintId) {
    const sequencePart = latestComplaint.complaintId.replace(prefix, '');
    const parsedSequence = parseInt(sequencePart, 10);
    if (!isNaN(parsedSequence)) {
      nextSequence = parsedSequence + 1;
    }
  }

  return `${prefix}${String(nextSequence).padStart(4, '0')}`;
};

const Complaint = mongoose.model('Complaint', complaintSchema);

export { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES, COMPLAINT_STATUSES };
export default Complaint;
