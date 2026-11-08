const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');
const { AppError } = require('../middleware/errorHandler');
const { calculateStreaks, getTodayDateString } = require('../utils/streak');

/**
 * Helper to determine today's date taking into account client timezone or override
 */
const getClientToday = (req) => {
  if (req.query && req.query.today && /^\d{4}-\d{2}-\d{2}$/.test(req.query.today)) {
    return req.query.today;
  }
  const clientTimeZone = req.headers['x-timezone'] || process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata';
  return getTodayDateString(clientTimeZone);
};

/**
 * @desc    Create a new habit
 * @route   POST /api/habits
 * @access  Private
 */
const createHabit = async (req, res, next) => {
  try {
    const { title, description, icon, color, frequency, reminderTime } = req.body;

    const habit = await Habit.create({
      user: req.user._id,
      title,
      description: description || '',
      icon: icon || 'check',
      color: color || '#6366F1',
      frequency: frequency || 'daily',
      reminderTime: reminderTime || null
    });

    const today = getClientToday(req);

    res.status(201).json({
      success: true,
      message: 'Habit created successfully',
      data: {
        habit: {
          ...habit.toObject(),
          todayDone: false,
          currentStreak: 0,
          longestStreak: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all habits for the logged-in user
 * @route   GET /api/habits
 * @access  Private
 */
const getHabits = async (req, res, next) => {
  try {
    const today = getClientToday(req);
    const includeArchived = req.query.includeArchived === 'true';

    const filter = { user: req.user._id };
    if (!includeArchived) {
      filter.isArchived = false;
    }

    const habits = await Habit.find(filter).sort({ createdAt: -1 });

    if (habits.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: { habits: [] }
      });
    }

    // Efficiently batch fetch all check-in dates for this user's habits
    const habitIds = habits.map(h => h._id);
    const checkIns = await CheckIn.find(
      { habit: { $in: habitIds }, user: req.user._id },
      'habit date'
    );

    // Map habitId -> Set of date strings
    const checkInMap = new Map();
    for (const checkIn of checkIns) {
      const key = checkIn.habit.toString();
      if (!checkInMap.has(key)) {
        checkInMap.set(key, []);
      }
      checkInMap.get(key).push(checkIn.date);
    }

    // Decorate each habit with todayDone and currentStreak (and longestStreak)
    const habitsWithStreaks = habits.map(habit => {
      const habitObj = habit.toObject();
      const dates = checkInMap.get(habit._id.toString()) || [];
      const { currentStreak, longestStreak } = calculateStreaks(dates, today);
      const todayDone = dates.includes(today);

      return {
        ...habitObj,
        todayDone,
        currentStreak,
        longestStreak
      };
    });

    res.status(200).json({
      success: true,
      count: habitsWithStreaks.length,
      data: { habits: habitsWithStreaks }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single habit by ID
 * @route   GET /api/habits/:id
 * @access  Private
 */
const getHabitById = async (req, res, next) => {
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
    const checkIns = await CheckIn.find({ habit: habit._id }, 'date').sort({ date: -1 });
    const dates = checkIns.map(c => c.date);
    const { currentStreak, longestStreak } = calculateStreaks(dates, today);
    const todayDone = dates.includes(today);

    res.status(200).json({
      success: true,
      data: {
        habit: {
          ...habit.toObject(),
          todayDone,
          currentStreak,
          longestStreak,
          totalCheckIns: dates.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a habit
 * @route   PUT /api/habits/:id
 * @access  Private
 */
const updateHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return next(new AppError('Habit not found', 404));
    }

    // Verify ownership
    if (habit.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to modify this habit', 403));
    }

    const { title, description, icon, color, frequency, reminderTime, isArchived } = req.body;

    if (title !== undefined) habit.title = title;
    if (description !== undefined) habit.description = description;
    if (icon !== undefined) habit.icon = icon;
    if (color !== undefined) habit.color = color;
    if (frequency !== undefined) habit.frequency = frequency;
    if (reminderTime !== undefined) habit.reminderTime = reminderTime;
    if (isArchived !== undefined) habit.isArchived = isArchived;

    await habit.save();

    const today = getClientToday(req);
    const checkIns = await CheckIn.find({ habit: habit._id }, 'date');
    const dates = checkIns.map(c => c.date);
    const { currentStreak, longestStreak } = calculateStreaks(dates, today);
    const todayDone = dates.includes(today);

    res.status(200).json({
      success: true,
      message: 'Habit updated successfully',
      data: {
        habit: {
          ...habit.toObject(),
          todayDone,
          currentStreak,
          longestStreak
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a habit and all its check-ins
 * @route   DELETE /api/habits/:id
 * @access  Private
 */
const deleteHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return next(new AppError('Habit not found', 404));
    }

    // Verify ownership
    if (habit.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to delete this habit', 403));
    }

    // Cascade delete all check-ins belonging to this habit
    const deleteCheckInsResult = await CheckIn.deleteMany({ habit: habit._id });
    await Habit.findByIdAndDelete(habit._id);

    res.status(200).json({
      success: true,
      message: 'Habit and associated check-ins deleted successfully',
      data: {
        deletedHabitId: habit._id,
        deletedCheckInsCount: deleteCheckInsResult.deletedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle habit archive state
 * @route   PATCH /api/habits/:id/archive
 * @access  Private
 */
const archiveHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return next(new AppError('Habit not found', 404));
    }

    // Verify ownership
    if (habit.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to archive this habit', 403));
    }

    // If explicit isArchived boolean supplied, use it; otherwise toggle
    if (req.body && typeof req.body.isArchived === 'boolean') {
      habit.isArchived = req.body.isArchived;
    } else {
      habit.isArchived = !habit.isArchived;
    }

    await habit.save();

    res.status(200).json({
      success: true,
      message: `Habit ${habit.isArchived ? 'archived' : 'unarchived'} successfully`,
      data: {
        habit: habit.toObject()
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  archiveHabit,
  getClientToday
};

