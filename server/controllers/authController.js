import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

/**
 * @desc    Register a new student
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, studentId, department, phone, role } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, and department',
      });
    }

    // 2. Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // 3. Normalize email and check for duplicate registration
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // 4. Default registration to student unless explicitly admin/staff for seeded setup
    const userRole = role && ['student', 'staff', 'admin'].includes(role) ? role : 'student';

    // 5. Require studentId for student registrations
    if (userRole === 'student' && !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required for student registration',
      });
    }

    // 6. Check duplicate studentId if provided
    if (studentId) {
      const existingStudentId = await User.findOne({ studentId: studentId.trim() });
      if (existingStudentId) {
        return res.status(400).json({
          success: false,
          message: 'An account with this Student ID is already registered',
        });
      }
    }

    // 7. Create the new user record (password is automatically hashed by Mongoose pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      studentId: studentId ? studentId.trim() : undefined,
      department: department.trim(),
      phone: phone ? phone.trim() : '',
      role: userRole,
    });

    // 8. Generate JWT token
    const token = generateToken(user._id, user.role);

    // 9. Send response with safe user representation (no password)
    return res.status(201).json({
      success: true,
      message: 'Student account registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        phone: user.phone,
        profileImage: user.profileImage,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Registration Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during registration',
    });
  }
};

/**
 * @desc    Authenticate user & get JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    // 2. Find user by email and explicitly select password (since select: false in schema)
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials: User not found',
      });
    }

    // 3. Verify password hash using bcryptjs
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials: Password incorrect',
      });
    }

    // 4. Verify account active state
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact campus administration.',
      });
    }

    // 5. Generate JWT token
    const token = generateToken(user._id, user.role);

    // 6. Return response with safe user object
    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        employeeId: user.employeeId,
        department: user.department,
        phone: user.phone,
        profileImage: user.profileImage,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during login',
    });
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (JWT Protected)
 */
export const getCurrentUser = async (req, res) => {
  try {
    // req.user was populated by authenticateUser middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error('[Get Current User Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve user profile',
    });
  }
};
