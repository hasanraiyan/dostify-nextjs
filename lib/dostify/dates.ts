const TIME_ZONE = 'Asia/Kolkata'
const DAY_MS = 24 * 60 * 60 * 1000

/** Calendar day (YYYY-MM-DD) in the user's timezone (IST for now). */
export function dayKey(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: TIME_ZONE })
}

/** "Today", "Yesterday", or e.g. "14 Nov 2026" for the day `date` falls on. */
export function dayLabel(date: Date, now: Date = new Date()): string {
  const key = dayKey(date)
  if (key === dayKey(now)) return 'Today'
  if (key === dayKey(new Date(now.getTime() - DAY_MS))) return 'Yesterday'
  return date.toLocaleDateString('en-IN', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** "9:41 pm" in the user's timezone. */
export function timeLabel(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    timeZone: TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  })
}
