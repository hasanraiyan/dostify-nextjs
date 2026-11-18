'use server'

import { getCurrentDbUser } from '@/lib/dostify/current-user'
import { dayKey, dayLabel, timeLabel } from '@/lib/dostify/dates'
import { listEntries } from '@/lib/dostify/journal'
import type { JournalListEntry } from '@/lib/dostify/journal-types'

/** The signed-in user's entries (newest first) for the sidebar list. */
export async function listJournalEntries(): Promise<JournalListEntry[]> {
  const user = await getCurrentDbUser()
  if (!user) return []
  const rows = await listEntries(user.id)
  const now = new Date()
  return rows.map((e) => ({
    id: e.id,
    text: e.text,
    pinned: e.pinned,
    time: timeLabel(e.createdAt),
    dayKey: dayKey(e.createdAt),
    dayLabel: dayLabel(e.createdAt, now),
  }))
}
