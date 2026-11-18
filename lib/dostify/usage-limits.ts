/**
 * Free plan, per calendar month (IST). Change the numbers here only.
 * Voice is counted in seconds.
 */
export const FREE_MONTHLY_MESSAGES = 50;
export const FREE_MONTHLY_VOICE_SECONDS = 30 * 60; // 30 minutes

/** A call reported as still open counts for at most this long (Persona caps a call at 15 min). */
export const MAX_CALL_SECONDS = 15 * 60;

/** "YYYY-MM" in India time, the key the monthly counters reset on. */
export function monthKeyIST(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  return `${y}-${m}`;
}

/** Start of that IST month as a UTC instant (IST is UTC+5:30, no DST). */
export function monthStartIST(month: string): Date {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1, 0, 0, 0) - (5 * 60 + 30) * 60 * 1000);
}
