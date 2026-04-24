/**
 * Arizona timezone utility.
 *
 * Arizona (America/Phoenix) does NOT observe daylight saving time.
 * It is always UTC-7 (MST) year-round.
 *
 * All server-side "today" calculations should use these helpers
 * instead of raw `new Date()` to avoid UTC date drift on Vercel.
 */

const ARIZONA_TZ = "America/Phoenix";

/**
 * Get the current date in Arizona timezone as YYYY-MM-DD.
 *
 * Uses Intl.DateTimeFormat with `en-CA` locale (which formats as YYYY-MM-DD)
 * and the America/Phoenix timezone to get the correct calendar date regardless
 * of server timezone.
 */
export function getArizonaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ARIZONA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Get tomorrow's date in Arizona timezone as YYYY-MM-DD.
 */
export function getArizonaTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  // Edge case: if it's 11 PM UTC and Arizona is still "today",
  // adding a day to UTC might skip ahead. Instead, parse Arizona today and add 1.
  const todayStr = getArizonaToday();
  const d = new Date(todayStr + "T12:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

/**
 * Get the current Date object adjusted to represent Arizona midnight.
 * Useful for date arithmetic (e.g., "3 days ago", "next week").
 *
 * Returns a Date set to noon UTC on the Arizona "today" date,
 * so that toISOString().split('T')[0] gives the correct YYYY-MM-DD.
 */
export function getArizonaDateObj(): Date {
  const todayStr = getArizonaToday();
  return new Date(todayStr + "T12:00:00Z");
}

/**
 * Convert a Date offset from Arizona today to YYYY-MM-DD string.
 * Example: arizonaDateOffset(7) = 7 days from Arizona today.
 */
export function arizonaDateOffset(days: number): string {
  const d = getArizonaDateObj();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/**
 * Resolve a client-supplied date string, falling back to Arizona today.
 * Use this in API routes that accept an optional clientDate query param.
 */
export function resolveClientDate(clientDate: string | null | undefined): string {
  if (clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)) {
    return clientDate;
  }
  return getArizonaToday();
}
