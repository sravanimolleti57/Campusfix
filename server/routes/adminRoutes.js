import express from 'express';
import {
  getAdminStats,
  getAdminComplaints,
  getAdminComplaintById,
  updateAdminComplaint,
  deleteAdminComplaint,
  getAdminUsers,
  toggleUserStatus,
  getAdminStaffList,
  createStaffMember,
  updateStaffMember,
  getCategoriesOverview,
  getLocationsOverview,
  getAdminFeedbacks,
} from '../controllers/adminController.js';
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Role-based authorization: Only admins can access any admin API
router.use(authenticateUser);
router.use(authorizeRoles('admin'));

// Analytics Dashboard Endpoint
router.get('/stats', getAdminStats);

// Student Feedback & Ratings Endpoint for Admin
router.get('/feedback', getAdminFeedbacks);

// Complaints Lifecycle & Triage Endpoints
router.get('/complaints', getAdminComplaints);
router.get('/complaints/:id', getAdminComplaintById);
router.put('/complaints/:id', updateAdminComplaint);
router.delete('/complaints/:id', deleteAdminComplaint);

// User Management Endpoints
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', toggleUserStatus);

// Staff Management Endpoints
router.get('/staff', getAdminStaffList);
router.post('/staff', createStaffMember);
router.put('/staff/:id', updateStaffMember);
router.patch('/staff/:id/status', toggleUserStatus);

// Category & Location Insights
router.get('/categories', getCategoriesOverview);
router.get('/locations', getLocationsOverview);

export default router;
