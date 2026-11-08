const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');
const { AppError } = require('../middleware/errorHandler');
const { calculateStreaks } = require('../utils/streak');
const { getClientToday } = require('./habitController');

/**
 * @desc    Toggle check-in for a habit on a specific date (creates if absent, removes if present)
 * @route   POST /api/habits/:id/toggle
 * @access  Private
 */
const toggleCheckIn = async (req, res, next) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return next(new AppError('Habit not found', 404));
    }

    // Verify ownership
    if (habit.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to access this habit', 403));
    }

    const today = getClientToday(req);
    const targetDate = req.body && req.body.date ? req.body.date : today;

    // Check if check-in already exists for this habit and date
    const existingCheckIn = await CheckIn.findOne({
      habit: habit._id,
      date: targetDate
    });

    let checkedIn = false;
    let actionMessage = '';

    if (existingCheckIn) {
      // Remove existing check-in
      await CheckIn.deleteOne({ _id: existingCheckIn._id });
      checkedIn = false;
      actionMessage = `Check-in removed for ${targetDate}`;
    } else {
      // Create new check-in
      await CheckIn.create({
        user: req.user._id,
        habit: habit._id,
        date: targetDate
      });
      checkedIn = true;
      actionMessage = `Check-in marked for ${targetDate}`;
    }

    // Recalculate streak using updated check-ins
    const updatedCheckIns = await CheckIn.find({ habit: habit._id }, 'date');
    const dates = updatedCheckIns.map(c => c.date);
    const { currentStreak, longestStreak } = calculateStreaks(dates, today);
    const todayDone = dates.includes(today);

    res.status(200).json({
      success: true,
      message: actionMessage,
      data: {
        habit: {
          ...habit.toObject(),
          todayDone,
          currentStreak,
          longestStreak
        },
        checkedIn,
        date: targetDate,
        currentStreak,
        longestStreak
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get check-in history for a habit with optional date range (?from=YYYY-MM-DD&to=YYYY-MM-DD)
 * @route   GET /api/habits/:id/checkins
 * @access  Private
 */
const getHabitCheckIns = async (req, res, next) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return next(new AppError('Habit not found', 404));
    }

    // Verify ownership
    if (habit.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to access this habit', 403));
    }

    const filter = { habit: habit._id };
    const { from, to } = req.query;

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const checkIns = await CheckIn.find(filter).sort({ date: 1 });
    const dates = checkIns.map(c => c.date);

    res.status(200).json({
      success: true,
      count: checkIns.length,
      data: {
        habitId: habit._id,
        checkIns,
        dates
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleCheckIn,
  getHabitCheckIns
};

