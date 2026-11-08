process.env.NODE_ENV = 'test';
process.env.DEFAULT_TIMEZONE = 'Asia/Kolkata';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');
const {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  archiveHabit
} = require('../controllers/habitController');

describe('Habits CRUD & Ownership Unit Tests', () => {
  const userId = 'user_abc_123';
  const otherUserId = 'user_other_999';

  let origHabitCreate, origHabitFind, origHabitFindById, origHabitFindByIdAndDelete;
  let origCheckInFind, origCheckInDeleteMany;

  beforeEach(() => {
    origHabitCreate = Habit.create;
    origHabitFind = Habit.find;
    origHabitFindById = Habit.findById;
    origHabitFindByIdAndDelete = Habit.findByIdAndDelete;
    origCheckInFind = CheckIn.find;
    origCheckInDeleteMany = CheckIn.deleteMany;
  });

  afterEach(() => {
    Habit.create = origHabitCreate;
    Habit.find = origHabitFind;
    Habit.findById = origHabitFindById;
    Habit.findByIdAndDelete = origHabitFindByIdAndDelete;
    CheckIn.find = origCheckInFind;
    CheckIn.deleteMany = origCheckInDeleteMany;
  });

  it('createHabit should associate habit with user and set default streaks', async () => {
    Habit.create = async (payload) => ({
      _id: 'habit_1',
      ...payload,
      toObject: () => ({ _id: 'habit_1', ...payload })
    });

    const req = {
      user: { _id: userId },
      body: {
        title: 'Morning Meditation',
        description: '15 mins mindfulness',
        color: '#10B981',
        icon: 'meditation'
      },
      query: { today: '2026-11-08' },
      headers: {}
    };

    let status = null, body = null;
    const res = {
      status(code) { status = code; return this; },
      json(data) { body = data; return this; }
    };

    await createHabit(req, res, err => { if (err) throw err; });

    assert.equal(status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.habit.title, 'Morning Meditation');
    assert.equal(body.data.habit.todayDone, false);
    assert.equal(body.data.habit.currentStreak, 0);
  });

  it('getHabits should calculate todayDone and currentStreak for each habit', async () => {
    const mockHabits = [
      {
        _id: 'habit_1',
        user: userId,
        title: 'Daily Workout',
        toObject: function () { return { _id: this._id, user: this.user, title: this.title }; }
      },
      {
        _id: 'habit_2',
        user: userId,
        title: 'Drink 2L Water',
        toObject: function () { return { _id: this._id, user: this.user, title: this.title }; }
      }
    ];

    Habit.find = () => ({
      sort: async () => mockHabits
    });

    // Mock check-ins: habit_1 has checkins for 2026-11-07 and 2026-11-08 (todayDone=true, streak=2)
    // habit_2 has checkin for 2026-11-06 only (todayDone=false, streak=0)
    CheckIn.find = async () => [
      { habit: 'habit_1', date: '2026-11-07' },
      { habit: 'habit_1', date: '2026-11-08' },
      { habit: 'habit_2', date: '2026-11-06' }
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

    await getHabits(req, res, err => { if (err) throw err; });

    assert.equal(status, 200);
    assert.equal(body.count, 2);

    const habit1 = body.data.habits.find(h => h._id === 'habit_1');
    const habit2 = body.data.habits.find(h => h._id === 'habit_2');

    assert.equal(habit1.todayDone, true);
    assert.equal(habit1.currentStreak, 2);

    assert.equal(habit2.todayDone, false);
    assert.equal(habit2.currentStreak, 0);
  });

  it('getHabitById should return 403 if habit belongs to another user', async () => {
    Habit.findById = async () => ({
      _id: 'habit_999',
      user: otherUserId
    });

    const req = {
      user: { _id: userId },
      params: { id: 'habit_999' },
      headers: {},
      query: {}
    };

    let nextError = null;
    await getHabitById(req, {}, err => { nextError = err; });

    assert.ok(nextError);
    assert.equal(nextError.statusCode, 403);
    assert.match(nextError.message, /Not authorized/);
  });

  it('updateHabit should update fields and enforce ownership', async () => {
    let saved = false;
    const mockHabit = {
      _id: 'habit_1',
      user: userId,
      title: 'Old Title',
      description: 'Old Desc',
      save: async () => { saved = true; },
      toObject: function () {
        return { _id: this._id, user: this.user, title: this.title, description: this.description };
      }
    };

    Habit.findById = async () => mockHabit;
    CheckIn.find = async () => [];

    const req = {
      user: { _id: userId },
      params: { id: 'habit_1' },
      body: { title: 'Updated Title', description: 'Updated Desc' },
      query: { today: '2026-11-08' },
      headers: {}
    };

    let status = null, body = null;
    const res = {
      status(code) { status = code; return this; },
      json(data) { body = data; return this; }
    };

    await updateHabit(req, res, err => { if (err) throw err; });

    assert.equal(status, 200);
    assert.equal(mockHabit.title, 'Updated Title');
    assert.equal(saved, true);
  });

  it('deleteHabit should delete the habit and cascade delete all its check-ins', async () => {
    let deletedHabitId = null;
    let deletedCheckInFilter = null;

    Habit.findById = async () => ({
      _id: 'habit_1',
      user: userId
    });
    CheckIn.deleteMany = async (filter) => {
      deletedCheckInFilter = filter;
      return { deletedCount: 15 };
    };
    Habit.findByIdAndDelete = async (id) => {
      deletedHabitId = id;
      return { _id: id };
    };

    const req = {
      user: { _id: userId },
      params: { id: 'habit_1' }
    };

    let status = null, body = null;
    const res = {
      status(code) { status = code; return this; },
      json(data) { body = data; return this; }
    };

    await deleteHabit(req, res, err => { if (err) throw err; });

    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(deletedHabitId, 'habit_1');
    assert.equal(deletedCheckInFilter.habit, 'habit_1');
    assert.equal(body.data.deletedCheckInsCount, 15);
  });

  it('archiveHabit should toggle isArchived state', async () => {
    let saved = false;
    const mockHabit = {
      _id: 'habit_1',
      user: userId,
      isArchived: false,
      save: async () => { saved = true; },
      toObject: function () { return { _id: this._id, isArchived: this.isArchived }; }
    };

    Habit.findById = async () => mockHabit;

    const req = {
      user: { _id: userId },
      params: { id: 'habit_1' },
      body: {} // Empty body -> toggle
    };

    let status = null, body = null;
    const res = {
      status(code) { status = code; return this; },
      json(data) { body = data; return this; }
    };

    await archiveHabit(req, res, err => { if (err) throw err; });

    assert.equal(status, 200);
    assert.equal(mockHabit.isArchived, true);
    assert.equal(saved, true);
  });
});

