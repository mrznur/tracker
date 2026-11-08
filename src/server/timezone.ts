/**
 * Shared timezone helpers for overdue/due-today logic.
 * All date comparisons use APP_TIMEZONE (default: Asia/Dhaka).
 */

export function getAppTimezone(): string {
  return process.env.APP_TIMEZONE ?? 'Asia/Dhaka';
}

/**
 * Returns today's date as a Date object at midnight in APP_TIMEZONE.
 * Use this for all overdue/due-today comparisons.
 */
export function getTodayInAppTimezone(): Date {
  const tz = getAppTimezone();
  const now = new Date();
  // Format today's date in the target timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [year, month, day] = formatter.format(now).split('-').map(Number);
  // Return as UTC midnight of that calendar date
  return new Date(Date.UTC(year!, month! - 1, day!));
}

/**
 * Returns true if the loan is overdue:
 * returned_at is NULL and due_date < today (calendar day in APP_TIMEZONE)
 */
export function isOverdue(dueDate: Date, returnedAt: Date | null): boolean {
  if (returnedAt !== null) return false;
  const today = getTodayInAppTimezone();
  // Normalize dueDate to midnight UTC of its calendar day in APP_TIMEZONE
  const dueDateNormalized = normalizeDateToTimezone(dueDate);
  return dueDateNormalized < today;
}

/**
 * Returns true if the loan is due today (calendar day in APP_TIMEZONE)
 */
export function isDueToday(dueDate: Date, returnedAt: Date | null): boolean {
  if (returnedAt !== null) return false;
  const today = getTodayInAppTimezone();
  const dueDateNormalized = normalizeDateToTimezone(dueDate);
  return dueDateNormalized.getTime() === today.getTime();
}

/**
 * Normalize a Date to midnight UTC of its calendar date in APP_TIMEZONE.
 */
export function normalizeDateToTimezone(date: Date): Date {
  const tz = getAppTimezone();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [year, month, day] = formatter.format(date).split('-').map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}

/**
 * Get the start of today in APP_TIMEZONE as a Date (midnight UTC of today's calendar date)
 */
export function getStartOfTodayUTC(): Date {
  return getTodayInAppTimezone();
}

/**
 * Prisma WHERE clause fragment for overdue loans
 */
export function overdueWhereClause() {
  const today = getTodayInAppTimezone();
  return {
    returnedAt: null,
    dueDate: { lt: today }
  };
}
