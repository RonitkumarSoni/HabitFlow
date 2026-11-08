const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  getTodayDateString,
  shiftDateString,
  getDaysDifference,
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateStreaks
} = require('../utils/streak');

describe('Streak Utility Pure Functions', () => {
  it('should format today date string in YYYY-MM-DD format', () => {
    const today = getTodayDateString('Asia/Kolkata');
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('should shift dates accurately across months and leap years', () => {
    assert.equal(shiftDateString('2026-11-08', -1), '2026-11-07');
    assert.equal(shiftDateString('2026-03-01', -1), '2026-02-28');
    assert.equal(shiftDateString('2024-03-01', -1), '2024-02-29'); // Leap year
    assert.equal(shiftDateString('2026-01-01', -1), '2025-12-31');
    assert.equal(shiftDateString('2026-11-08', 5), '2026-11-13');
  });

  it('should compute day differences correctly', () => {
    assert.equal(getDaysDifference('2026-11-01', '2026-11-02'), 1);
    assert.equal(getDaysDifference('2026-11-01', '2026-11-05'), 4);
    assert.equal(getDaysDifference('2026-11-05', '2026-11-01'), -4);
  });

  describe('Current Streak calculation', () => {
    const refDate = '2026-11-08';

    it('should return 0 when checkIns is empty', () => {
      assert.equal(calculateCurrentStreak([], refDate), 0);
    });

    it('should count streak starting from today if today is done', () => {
      const dates = ['2026-11-06', '2026-11-07', '2026-11-08'];
      assert.equal(calculateCurrentStreak(dates, refDate), 3);
    });

    it('should preserve streak from yesterday if today is not done yet', () => {
      // Today is 2026-11-08, user did 06 and 07
      const dates = ['2026-11-06', '2026-11-07'];
      assert.equal(calculateCurrentStreak(dates, refDate), 2);
    });

    it('should return 0 if neither today nor yesterday was done', () => {
      // Last done was 2 days ago (2026-11-06)
      const dates = ['2026-11-04', '2026-11-05', '2026-11-06'];
      assert.equal(calculateCurrentStreak(dates, refDate), 0);
    });

    it('should handle single check-in today', () => {
      assert.equal(calculateCurrentStreak(['2026-11-08'], refDate), 1);
    });

    it('should handle single check-in yesterday', () => {
      assert.equal(calculateCurrentStreak(['2026-11-07'], refDate), 1);
    });

    it('should break correctly when there is a missing day in between', () => {
      const dates = ['2026-11-04', '2026-11-05', '2026-11-07', '2026-11-08']; // Missing 2026-11-06
      assert.equal(calculateCurrentStreak(dates, refDate), 2);
    });
  });

  describe('Longest Streak calculation', () => {
    it('should return 0 for empty array', () => {
      assert.equal(calculateLongestStreak([]), 0);
    });

    it('should return 1 for single check-in', () => {
      assert.equal(calculateLongestStreak(['2026-10-01']), 1);
    });

    it('should calculate longest consecutive run across all past dates', () => {
      const dates = [
        '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', // 5 days
        '2026-10-10', '2026-10-11', // 2 days
        '2026-11-06', '2026-11-07', '2026-11-08' // 3 days
      ];
      assert.equal(calculateLongestStreak(dates), 5);
    });

    it('should handle duplicate and unsorted dates', () => {
      const dates = [
        '2026-10-03', '2026-10-01', '2026-10-02', '2026-10-02', '2026-10-01'
      ];
      assert.equal(calculateLongestStreak(dates), 3);
    });
  });

  describe('calculateStreaks combination', () => {
    it('should return both current and longest streaks', () => {
      const dates = ['2026-11-07', '2026-11-08'];
      const result = calculateStreaks(dates, '2026-11-08');
      assert.deepEqual(result, { currentStreak: 2, longestStreak: 2 });
    });
  });
});

