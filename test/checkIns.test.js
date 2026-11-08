process.env.NODE_ENV = 'test';
process.env.DEFAULT_TIMEZONE = 'Asia/Kolkata';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');
const { toggleCheckIn, getHabitCheckIns } = require('../controllers/checkInController');

describe('Check-ins & Streaks Unit Tests', () => {
  const userId = 'user_123';
  const habitId = 'habit_777';

  let origHabitFindById, origCheckInFindOne, origCheckInCreate, origCheckInDeleteOne, origCheckInFind;

  beforeEach(() => {
    origHabitFindById = Habit.findById;
    origCheckInFindOne = CheckIn.findOne;
    origCheckInCreate = CheckIn.create;
    origCheckInDeleteOne = CheckIn.deleteOne;
    origCheckInFind = CheckIn.find;
  });

  afterEach(() => {
    Habit.findById = origHabitFindById;
    CheckIn.findOne = origCheckInFindOne;
    CheckIn.create = origCheckInCreate;
    CheckIn.deleteOne = origCheckInDeleteOne;
    CheckIn.find = origCheckInFind;
  });

  it('toggleCheckIn should create check-in when absent and update streak', async () => {
    const mockHabit = {
      _id: habitId,
      user: userId,
      title: 'Read Book',
      toObject: function () { return { _id: this._id, user: this.user, title: this.title }; }
    };
    Habit.findById = async () => mockHabit;

    // CheckIn does not exist
    CheckIn.findOne = async () => null;

    let createdCheckIn = null;
    CheckIn.create = async (doc) => {
      createdCheckIn = doc;
      return { _id: 'ci_new', ...doc };
    };

    // After creating, return the new date plus previous consecutive days
    CheckIn.find = async () => [
      { date: '2026-11-06' },
      { date: '2026-11-07' },
      { date: '2026-11-08' }
    ];

    const req = {
      user: { _id: userId },
      params: { id: habitId },
      body: { date: '2026-11-08' },
      query: { today: '2026-11-08' },
      headers: {}
    };

    let status = null, body = null;
    const res = {
      status(code) { status = code; return this; },
      json(data) { body = data; return this; }
    };

    await toggleCheckIn(req, res, err => { if (err) throw err; });

    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.checkedIn, true);
    assert.equal(createdCheckIn.date, '2026-11-08');
    assert.equal(body.data.currentStreak, 3);
    assert.equal(body.data.longestStreak, 3);
    assert.equal(body.data.habit.todayDone, true);
  });

  it('toggleCheckIn should remove check-in when present and update streak', async () => {
    const mockHabit = {
      _id: habitId,
      user: userId,
      title: 'Read Book',
      toObject: function () { return { _id: this._id, user: this.user, title: this.title }; }
    };
    Habit.findById = async () => mockHabit;

    // CheckIn already exists
    CheckIn.findOne = async () => ({
      _id: 'ci_existing_123',
      habit: habitId,
      date: '2026-11-08'
    });

    let deletedId = null;
    CheckIn.deleteOne = async (filter) => {
      deletedId = filter._id;
      return { deletedCount: 1 };
    };

    // After removing today's checkin, remaining is yesterday
    CheckIn.find = async () => [
      { date: '2026-11-07' }
    ];

    const req = {
      user: { _id: userId },
      params: { id: habitId },
      body: { date: '2026-11-08' },
      query: { today: '2026-11-08' },
      headers: {}
    };

    let status = null, body = null;
    const res = {
      status(code) { status = code; return this; },
      json(data) { body = data; return this; }
    };

    await toggleCheckIn(req, res, err => { if (err) throw err; });

    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.checkedIn, false);
    assert.equal(deletedId, 'ci_existing_123');
    // Today was uncompleted, but yesterday is done so currentStreak is 1
    assert.equal(body.data.currentStreak, 1);
    assert.equal(body.data.habit.todayDone, false);
  });

  it('getHabitCheckIns should return check-ins in range', async () => {
    Habit.findById = async () => ({
      _id: habitId,
      user: userId
    });

    let queriedFilter = null;
    CheckIn.find = (filter) => {
      queriedFilter = filter;
      return {
        sort: async () => [
          { date: '2026-11-01' },
          { date: '2026-11-02' }
        ]
      };
    };

    const req = {
      user: { _id: userId },
      params: { id: habitId },
      query: { from: '2026-11-01', to: '2026-11-05' }
    };

    let status = null, body = null;
    const res = {
      status(code) { status = code; return this; },
      json(data) { body = data; return this; }
    };

    await getHabitCheckIns(req, res, err => { if (err) throw err; });

    assert.equal(status, 200);
    assert.equal(body.count, 2);
    assert.deepEqual(body.data.dates, ['2026-11-01', '2026-11-02']);
    assert.equal(queriedFilter.date.$gte, '2026-11-01');
    assert.equal(queriedFilter.date.$lte, '2026-11-05');
  });
});

