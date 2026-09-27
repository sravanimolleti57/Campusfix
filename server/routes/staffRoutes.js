import express from 'express';
import {
  getStaffDashboard,
  getStaffComplaints,
  getStaffComplaintById,
  startWorkOnComplaint,
  addProgressNotes,
  uploadResolutionImages,
  markComplaintAsResolved,
  updateStaffComplaint,
} from '../controllers/staffController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';
import { uploadImagesMiddleware } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Strict RBAC: All staff routes require an active technician/staff account
router.use(authenticateUser);
router.use(authorizeRoles('staff'));

// Staff dashboard metrics and overview
router.get('/dashboard', getStaffDashboard);

// Staff complaints collection (scoped strictly to current technician)
router.get('/complaints', getStaffComplaints);

// Specific staff complaint actions
router.get('/complaints/:id', getStaffComplaintById);
router.put('/complaints/:id', uploadImagesMiddleware, updateStaffComplaint);

// 1. Accept assignment / Start work: ASSIGNED -> IN_PROGRESS
router.post('/complaints/:id/start-work', startWorkOnComplaint);

// 2. Add progress notes / intermediate updates
router.post('/complaints/:id/progress', uploadImagesMiddleware, addProgressNotes);

// 3. Upload resolution proof images to Cloudinary
router.post('/complaints/:id/upload', uploadImagesMiddleware, uploadResolutionImages);

// 4. Mark as RESOLVED: IN_PROGRESS -> RESOLVED
router.post('/complaints/:id/resolve', uploadImagesMiddleware, markComplaintAsResolved);

export default router;
