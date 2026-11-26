const express = require('express');
const router = express.Router();
const { register, login, getMe, googleAuth, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validators');

// Public authentication routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/google', googleAuth);

// Protected user profile routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;

