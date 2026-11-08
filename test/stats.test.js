process.env.NODE_ENV = 'test';
process.env.DEFAULT_TIMEZONE = 'Asia/Kolkata';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');
const {
  getOverviewStats,
  getWeeklyStats,
  getHabitStats
} = require('../controllers/statsController');

describe('Stats Controller Unit Tests', () => {
  const userId = 'user_stats_1';
  const habitId1 = 'habit_stats_1';
  const habitId2 = 'habit_stats_2';

  let origHabitFind, origHabitFindById, origCheckInFind;

  beforeEach(() => {
    origHabitFind = Habit.find;
    origHabitFindById = Habit.findById;
    origCheckInFind = CheckIn.find;
  });

  afterEach(() => {
    Habit.find = origHabitFind;
    Habit.findById = origHabitFindById;
    CheckIn.find = origCheckInFind;
  });

  it('getOverviewStats should compute totalHabits, completedToday, todayPercentage, and longestStreak', async () => {
    const mockHabits = [
      { _id: habitId1, user: userId, isArchived: false },
      { _id: habitId2, user: userId, isArchived: false }
    ];
    Habit.find = async () => mockHabits;

    // CheckIns: habit 1 done today (2026-11-08) and yesterday (2026-11-07), habit 2 done yesterday only
    CheckIn.find = async () => [
      { habit: habitId1, date: '2026-11-07' },
      { habit: habitId1, date: '2026-11-08' },
      { habit: habitId2, date: '2026-11-07' }
    ];

    const req = {
      user: { _id: userId },
      query: { today: '2026-11-08' },
      headers: {}
    };

    let status = null, body = null;
    const res = {
      status(code) { status = code; return this; },
      json(data) { body = data; return this; }
    };

    await getOverviewStats(req, res, err => { if (err) throw err; });

    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.totalHabits, 2);
    assert.equal(body.data.completedToday, 1); // Only habit 1 was done today
    assert.equal(body.data.todayPercentage, 50); // 1 out of 2 = 50%
    assert.equal(body.data.longestStreak, 2);
  });

  it('getWeeklyStats should return array of last 7 days with completion counts', async () => {
    Habit.find = async () => [
      { _id: habitId1, user: userId },
      { _id: habitId2, user: userId }
    ];

    // CheckIns in the past 7 days
    CheckIn.find = async () => [
      { date: '2026-11-08' },
      { date: '2026-11-08' },
      { date: '2026-11-07' }
    ];

    const req = {
      user: { _id: userId },
      query: { today: '2026-11-08' },
      headers: {}
    };

    let status = null, body = null;
    const res = {
      status(code) { status = code; return this; },
      json(data) { body = data; return this; }
    };

    await getWeeklyStats(req, res, err => { if (err) throw err; });

    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.weekly.length, 7);

    const todayEntry = body.data.weekly.find(d => d.date === '2026-11-08');
    assert.ok(todayEntry);
    assert.equal(todayEntry.completed, 2);
    assert.equal(todayEntry.total, 2);

    const yesterdayEntry = body.data.weekly.find(d => d.date === '2026-11-07');
    assert.equal(yesterdayEntry.completed, 1);
    assert.equal(yesterdayEntry.total, 2);
  });

  it('getHabitStats should calculate 30-day completionRate and 90-day heatmap', async () => {
    Habit.findById = async () => ({
      _id: habitId1,
      user: userId,
      title: 'Guitar Practice'
    });

    // 15 completions in the last 30 days
    const checkInDocs = [];
    for (let i = 0; i < 15; i++) {
      // Dates from today going backwards
      const day = String(8 - (i % 8)).padStart(2, '0');
      checkInDocs.push({ date: `2026-11-${day}` });
    }

    CheckIn.find = () => ({
      sort: async () => checkInDocs
    });

    const req = {
      user: { _id: userId },
      params: { id: habitId1 },
      query: { today: '2026-11-08' },
      headers: {}
    };

    let status = null, body = null;
    const res = {
      status(code) { status = code; return this; },
      json(data) { body = data; return this; }
    };

    await getHabitStats(req, res, err => { if (err) throw err; });

    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.title, 'Guitar Practice');
    assert.equal(body.data.heatmap.length, 90); // Exactly 90 days of heatmap data
    assert.ok(body.data.completionRate >= 0 && body.data.completionRate <= 100);
    assert.ok(Array.isArray(body.data.heatmapDates));
  });
});

