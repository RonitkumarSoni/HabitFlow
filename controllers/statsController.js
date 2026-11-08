const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');
const { AppError } = require('../middleware/errorHandler');
const { calculateStreaks, shiftDateString } = require('../utils/streak');
const { getClientToday } = require('./habitController');

/**
 * @desc    Get overview statistics across all habits of the user
 * @route   GET /api/stats/overview
 * @access  Private
 */
const getOverviewStats = async (req, res, next) => {
  try {
    const today = getClientToday(req);

    // Get active (non-archived) habits
    const habits = await Habit.find({ user: req.user._id, isArchived: false });
    const totalHabits = habits.length;

    if (totalHabits === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalHabits: 0,
          completedToday: 0,
          todayPercentage: 0,
          longestStreak: 0
        }
      });
    }

    const habitIds = habits.map(h => h._id);

    // Fetch all check-ins for active habits
    const allCheckIns = await CheckIn.find(
      { habit: { $in: habitIds }, user: req.user._id },
      'habit date'
    );

    // Group dates by habit and count completed today
    let completedToday = 0;
    const habitDatesMap = new Map();

    for (const checkIn of allCheckIns) {
      if (checkIn.date === today) {
        completedToday += 1;
      }

      const key = checkIn.habit.toString();
      if (!habitDatesMap.has(key)) {
        habitDatesMap.set(key, []);
      }
      habitDatesMap.get(key).push(checkIn.date);
    }

    const todayPercentage = Math.round((completedToday / totalHabits) * 100);

    // Find the highest longest streak across all habits
    let overallLongestStreak = 0;
    for (const habit of habits) {
      const dates = habitDatesMap.get(habit._id.toString()) || [];
      const { longestStreak } = calculateStreaks(dates, today);
      if (longestStreak > overallLongestStreak) {
        overallLongestStreak = longestStreak;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalHabits,
        completedToday,
        todayPercentage,
        longestStreak: overallLongestStreak
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get last 7 days completion statistics [{ date, completed, total }]
 * @route   GET /api/stats/weekly
 * @access  Private
 */
const getWeeklyStats = async (req, res, next) => {
  try {
    const today = getClientToday(req);

    // Get active habits count
    const habits = await Habit.find({ user: req.user._id, isArchived: false });
    const total = habits.length;
    const habitIds = habits.map(h => h._id);

    // Generate past 7 days chronologically (6 days ago through today)
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      past7Days.push(shiftDateString(today, -i));
    }

    const startDate = past7Days[0];

    // Fetch check-ins within the 7-day window
    const checkIns = await CheckIn.find(
      {
        user: req.user._id,
        habit: { $in: habitIds },
        date: { $gte: startDate, $lte: today }
      },
      'date'
    );

    // Count completions per date
    const dateCounts = new Map();
    for (const checkIn of checkIns) {
      dateCounts.set(checkIn.date, (dateCounts.get(checkIn.date) || 0) + 1);
    }

    const weekly = past7Days.map(date => ({
      date,
      completed: dateCounts.get(date) || 0,
      total
    }));

    res.status(200).json({
      success: true,
      data: {
        weekly
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed statistics for a specific habit
 * @route   GET /api/habits/:id/stats
 * @access  Private
 */
const getHabitStats = async (req, res, next) => {
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

    // Fetch all check-ins for this habit
    const checkIns = await CheckIn.find({ habit: habit._id }, 'date').sort({ date: 1 });
    const dates = checkIns.map(c => c.date);
    const dateSet = new Set(dates);

    // Calculate streaks
    const { currentStreak, longestStreak } = calculateStreaks(dates, today);
    const totalCompletions = dates.length;

    // Calculate 30-day completion rate
    const start30DaysAgo = shiftDateString(today, -29);
    let completionsLast30Days = 0;
    for (const d of dates) {
      if (d >= start30DaysAgo && d <= today) {
        completionsLast30Days += 1;
      }
    }
    const completionRate = Math.round((completionsLast30Days / 30) * 100);

    // Heatmap data: past 90 days (89 days ago up to today = 90 days total)
    const heatmap = [];
    const heatmapDates = [];
    for (let i = 89; i >= 0; i--) {
      const d = shiftDateString(today, -i);
      const isCompleted = dateSet.has(d);
      heatmap.push({
        date: d,
        completed: isCompleted
      });
      if (isCompleted) {
        heatmapDates.push(d);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        habitId: habit._id,
        title: habit.title,
        currentStreak,
        longestStreak,
        totalCompletions,
        completionRate,
        last30DaysCompletions: completionsLast30Days,
        heatmapDates,
        heatmap
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverviewStats,
  getWeeklyStats,
  getHabitStats
};

