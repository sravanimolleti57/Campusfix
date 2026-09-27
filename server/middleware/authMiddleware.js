import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware: Authenticate User via JWT Bearer Token
 * Validates presence, signature, expiration, and user account status
 */
export const authenticateUser = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed: Malformed token format',
        });
      }

      const secret = process.env.JWT_SECRET || 'campusfix_jwt_fallback_secret_key_2026';
      const decoded = jwt.verify(token, secret);

      // Retrieve user without password field
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed: User account no longer exists',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account suspended: Please contact campus administration',
        });
      }

      // Attach user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error('[JWT Auth Error]:', error.message);

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Authentication token has expired. Please log in again.',
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid authentication token signature',
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No authentication token provided in Authorization header',
    });
  }
};

/**
 * Middleware: Authorize specific user roles
 * Usage: authorizeRoles('admin'), authorizeRoles('staff', 'admin')
 * @param  {...string} roles - Allowed roles
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to role authorization',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Role (${req.user.role}) is not authorized to access this resource`,
      });
    }

    next();
  };
};
