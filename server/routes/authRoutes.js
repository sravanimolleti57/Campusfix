import express from 'express';
import {
  register,
  login,
  getCurrentUser,
} from '../controllers/authController.js';
import {
  authenticateUser,
  authorizeRoles,
} from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Authentication Routes
router.post('/register', register);
router.post('/login', login);

// Protected User Routes
router.get('/me', authenticateUser, getCurrentUser);

// Role-Protected Verification Routes
router.get('/admin-only', authenticateUser, authorizeRoles('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Admin: Administrative access authorized',
    user: req.user,
  });
});

router.get('/staff-only', authenticateUser, authorizeRoles('staff', 'admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome Staff/Admin: Maintenance staff access authorized',
    user: req.user,
  });
});

export default router;
