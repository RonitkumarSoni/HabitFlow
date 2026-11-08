const express = require('express');
const router = express.Router();
const {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  archiveHabit
} = require('../controllers/habitController');
const {
  toggleCheckIn,
  getHabitCheckIns
} = require('../controllers/checkInController');
const { getHabitStats } = require('../controllers/statsController');
const { protect } = require('../middleware/auth');
const {
  validateCreateHabit,
  validateUpdateHabit,
  validateObjectId,
  validateToggleCheckIn,
  validateCheckInQuery
} = require('../middleware/validators');

// Protect all habit routes - requires valid JWT Bearer token
router.use(protect);

// Habit CRUD routes
router.route('/')
  .post(validateCreateHabit, createHabit)
  .get(getHabits);

router.route('/:id')
  .get(validateObjectId('id'), getHabitById)
  .put(validateUpdateHabit, updateHabit)
  .delete(validateObjectId('id'), deleteHabit);

// Archive route
router.patch('/:id/archive', validateObjectId('id'), archiveHabit);

// Check-in toggle & history routes
router.post('/:id/toggle', validateToggleCheckIn, toggleCheckIn);
router.get('/:id/checkins', validateCheckInQuery, getHabitCheckIns);

// Individual habit stats route
router.get('/:id/stats', validateObjectId('id'), getHabitStats);

module.exports = router;

