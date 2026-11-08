const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const habitRoutes = require('./habitRoutes');
const statsRoutes = require('./statsRoutes');

// Mount feature routers
router.use('/auth', authRoutes);
router.use('/habits', habitRoutes);
router.use('/stats', statsRoutes);

// Health check endpoint under /api/health
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Habit Tracker API is up and running healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;

