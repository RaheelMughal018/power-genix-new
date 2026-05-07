/**
 * Format a date string (YYYY-MM-DD) for display without timezone shift.
 * new Date("2026-05-05") parses as UTC midnight, which shows as previous day
 * in timezones ahead of UTC. This splits the string to avoid that.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('T')[0].split('-');
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString();
}

/**
 * Convert a Date object to YYYY-MM-DD string using LOCAL timezone.
 * Replaces `d.toISOString().split('T')[0]` which uses UTC and shifts dates
 * in timezones ahead of UTC (e.g. midnight local in GMT+5 = previous day UTC).
 */
export function toLocalISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string into a Date in LOCAL timezone.
 * Replaces `new Date(dateStr)` which parses date-only strings as UTC.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('T')[0].split('-');
  return new Date(Number(year), Number(month) - 1, Number(day));
}
