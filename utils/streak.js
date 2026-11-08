/**
 * Streak Calculation Utilities
 * 
 * Streak rules:
 * - currentStreak: Consecutive days completed ending today.
 *   If today's check-in has not been performed yet, streak is evaluated starting from yesterday.
 *   This ensures a user's streak is not broken midway through an active day before they get a chance to complete it.
 *   If neither today nor yesterday is completed, currentStreak is 0.
 * 
 * - longestStreak: Maximum consecutive run of days across the entire check-in history.
 * 
 * - Timezone: Defaults to 'Asia/Kolkata'. Accepts client-provided reference dates to avoid timezone discrepancies.
 */

const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata';

/**
 * Returns today's date formatted as "YYYY-MM-DD" in the specified timezone.
 *
 * @param {string} [timeZone=DEFAULT_TIMEZONE] - IANA timezone identifier (e.g., 'Asia/Kolkata')
 * @returns {string} Date string in "YYYY-MM-DD" format
 */
function getTodayDateString(timeZone = DEFAULT_TIMEZONE) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date());
  } catch {
    // Fallback if invalid timezone is supplied
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date());
  }
}

/**
 * Shifts a "YYYY-MM-DD" date string by a given number of days using UTC arithmetic
 * to prevent daylight saving time / local clock boundary distortions.
 *
 * @param {string} dateString - "YYYY-MM-DD"
 * @param {number} dayOffset - Number of days to add (positive) or subtract (negative)
 * @returns {string} Shifted date string in "YYYY-MM-DD" format
 */
function shiftDateString(dateString, dayOffset) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

/**
 * Calculates the exact integer day difference between two "YYYY-MM-DD" dates (date2 - date1).
 *
 * @param {string} dateStr1 - Earlier date string "YYYY-MM-DD"
 * @param {string} dateStr2 - Later date string "YYYY-MM-DD"
 * @returns {number} Days difference
 */
function getDaysDifference(dateStr1, dateStr2) {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((utc2 - utc1) / MS_PER_DAY);
}

/**
 * Calculates the current active streak.
 * 
 * Logic:
 * 1. Checks if today is completed -> count starts from today.
 * 2. If today is NOT completed, checks if yesterday was completed ->
 *    count starts from yesterday so the streak remains active until the day ends.
 * 3. Walks backwards day by day as long as dates exist in the check-in set.
 *
 * @param {string[]} checkInDates - Array of "YYYY-MM-DD" date strings
 * @param {string} [referenceDate] - Client-sent or server today date ("YYYY-MM-DD")
 * @returns {number} Current streak in days
 */
function calculateCurrentStreak(checkInDates = [], referenceDate = getTodayDateString()) {
  if (!checkInDates || checkInDates.length === 0) {
    return 0;
  }

  const dateSet = new Set(checkInDates);
  const yesterday = shiftDateString(referenceDate, -1);

  let cursorDate = null;
  if (dateSet.has(referenceDate)) {
    cursorDate = referenceDate;
  } else if (dateSet.has(yesterday)) {
    cursorDate = yesterday;
  } else {
    // Neither today nor yesterday was checked in -> streak is broken
    return 0;
  }

  let streak = 0;
  while (dateSet.has(cursorDate)) {
    streak += 1;
    cursorDate = shiftDateString(cursorDate, -1);
  }

  return streak;
}

/**
 * Calculates the longest streak (maximum consecutive days) ever achieved.
 *
 * Logic:
 * 1. Removes duplicates and sorts dates chronologically.
 * 2. Walks through sorted dates, checking if the consecutive step difference is exactly 1 day.
 * 3. Records and returns the maximum run length.
 *
 * @param {string[]} checkInDates - Array of "YYYY-MM-DD" date strings
 * @returns {number} Longest streak in days
 */
function calculateLongestStreak(checkInDates = []) {
  if (!checkInDates || checkInDates.length === 0) {
    return 0;
  }

  const uniqueSortedDates = Array.from(new Set(checkInDates)).sort();
  if (uniqueSortedDates.length === 1) {
    return 1;
  }

  let maxStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < uniqueSortedDates.length; i++) {
    const diff = getDaysDifference(uniqueSortedDates[i - 1], uniqueSortedDates[i]);
    if (diff === 1) {
      currentRun += 1;
    } else if (diff > 1) {
      currentRun = 1;
    }
    if (currentRun > maxStreak) {
      maxStreak = currentRun;
    }
  }

  return maxStreak;
}

/**
 * Computes both current and longest streaks together.
 *
 * @param {string[]} checkInDates - Array of "YYYY-MM-DD" date strings
 * @param {string} [referenceDate] - Client-sent or server today date ("YYYY-MM-DD")
 * @returns {{ currentStreak: number, longestStreak: number }}
 */
function calculateStreaks(checkInDates = [], referenceDate = getTodayDateString()) {
  const currentStreak = calculateCurrentStreak(checkInDates, referenceDate);
  const longestStreak = calculateLongestStreak(checkInDates);

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak)
  };
}

module.exports = {
  DEFAULT_TIMEZONE,
  getTodayDateString,
  shiftDateString,
  getDaysDifference,
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateStreaks
};

