const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

/**
 * Generate JWT token with 30-day expiry
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('A user with this email address already exists', 409));
    }

    // Create user (password is automatically hashed via Mongoose pre-save hook)
    const user = await User.create({
      name,
      email,
      password
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toSafeObject(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password since it has select: false
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toSafeObject(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private (Protected)
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  generateToken
};

