/**
 * Returns a date in YYYY-MM-DD format using LOCAL timezone.
 *
 * IMPORTANT: Do NOT use .toISOString().split("T")[0] for "today" calculations!
 * That converts to UTC first, causing timezone issues (e.g., 8pm EST becomes next day in UTC).
 *
 * @param date - Date object (defaults to now)
 * @returns Date string in YYYY-MM-DD format
 */
export function getLocalDateString(date: Date = new Date()): string {
  // 'en-CA' locale returns YYYY-MM-DD format in local timezone
  return date.toLocaleDateString("en-CA");
}

/**
 * Returns a date N days ago in YYYY-MM-DD format using LOCAL timezone.
 *
 * @param days - Number of days ago
 * @returns Date string in YYYY-MM-DD format
 */
export function getLocalDateStringDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getLocalDateString(date);
}

/**
 * Returns a date N years ago in YYYY-MM-DD format using LOCAL timezone.
 *
 * @param years - Number of years ago
 * @returns Date string in YYYY-MM-DD format
 */
export function getLocalDateStringYearsAgo(years: number): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return getLocalDateString(date);
}
