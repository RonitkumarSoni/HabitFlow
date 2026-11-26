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

/**
 * @desc    Google Sign-In / Sign-Up
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleAuth = async (req, res, next) => {
  try {
    const { token, email: clientEmail, name: clientName, photoUrl } = req.body;

    let email = clientEmail;
    let name = clientName;
    let googleId = null;
    let picture = photoUrl;

    // Verify token with Google userinfo API
    if (token) {
      try {
        const fetch = global.fetch || require('node-fetch');
        const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
        if (googleRes.ok) {
          const profile = await googleRes.json();
          email = profile.email || email;
          name = profile.name || name;
          googleId = profile.sub;
          picture = profile.picture || picture;
        }
      } catch (tokenErr) {
        console.warn('Google token verification fetch failed:', tokenErr.message);
      }
    }

    if (!email) {
      return next(new AppError('Could not retrieve email from Google account', 400));
    }

    // Check if user exists by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Update googleId and picture if not set
      if (!user.googleId && googleId) user.googleId = googleId;
      if (!user.picture && picture) user.picture = picture;
      await user.save();
    } else {
      // Create new user for first time Google login
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        googleId,
        picture,
        password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)
      });
    }

    const jwtToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        user: user.toSafeObject(),
        token: jwtToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile (name, email)
 * @route   PUT /api/auth/profile
 * @access  Private (Protected)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: userId }
      });
      if (emailExists) {
        return next(new AppError('This email is already in use by another account', 409));
      }
      user.email = email.toLowerCase().trim();
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toSafeObject()
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
  googleAuth,
  updateProfile,
  generateToken
};

