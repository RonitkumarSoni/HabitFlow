/**
 * Date and Time utilities for HabitFlow
 */

/**
 * Returns today's date formatted as YYYY-MM-DD in the device's local timezone.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a human-friendly display date, e.g. "Sunday, 8 November"
 */
export function getFriendlyDate(d: Date = new Date()): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Returns an appropriate greeting based on local time.
 */
export function getGreeting(userName?: string): string {
  const hour = new Date().getHours();
  let greet = 'Good morning';
  if (hour >= 12 && hour < 17) {
    greet = 'Good afternoon';
  } else if (hour >= 17) {
    greet = 'Good evening';
  }
  return userName ? `${greet}, ${userName.split(' ')[0]}` : greet;
}

/**
 * Formats 24h "HH:mm" time string into 12h "7:30 AM" format
 */
export function formatTime12h(timeStr?: string | null): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Calculates day difference between two YYYY-MM-DD dates
 */
export function diffDays(dateStr1: string, dateStr2: string): number {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

