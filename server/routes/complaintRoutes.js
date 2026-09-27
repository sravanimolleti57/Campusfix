import express from 'express';
import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  uploadImages,
  getComplaintTimelineHandler,
  verifyComplaint,
  reopenComplaint,
  submitFeedback,
  getComplaintFeedback,
} from '../controllers/complaintController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { uploadImagesMiddleware } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All complaint routes require an authenticated user
router.use(authenticateUser);

// Dedicated route for complaint activity timeline
router.get('/:id/timeline', getComplaintTimelineHandler);

// Final verification workflow endpoints
router.post('/:id/verify', verifyComplaint);
router.post('/:id/reopen', reopenComplaint);
router.route('/:id/feedback').post(submitFeedback).get(getComplaintFeedback);

// Dedicated route for uploading attachments directly to Cloudinary
router.post('/upload', uploadImagesMiddleware, uploadImages);

// Student's own complaints list
router.get('/my', getMyComplaints);

// Main collection endpoints (handles multipart Cloudinary uploads)
router
  .route('/')
  .post(uploadImagesMiddleware, createComplaint);

// Single complaint endpoints by Mongo ID or complaintId (handles staff resolution images or updates)
router
  .route('/:id')
  .get(getComplaintById)
  .put(uploadImagesMiddleware, updateComplaint)
  .delete(deleteComplaint);

export default router;
