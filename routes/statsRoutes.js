const express = require('express');
const router = express.Router();
const {
  getOverviewStats,
  getWeeklyStats
} = require('../controllers/statsController');
const { protect } = require('../middleware/auth');

// Protect all stats routes
router.use(protect);

router.get('/overview', getOverviewStats);
router.get('/weekly', getWeeklyStats);

module.exports = router;

