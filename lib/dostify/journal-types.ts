/** One row in the journal list, pre-formatted on the server. */
export interface JournalListEntry {
  id: string
  text: string
  pinned: boolean
  time: string
  dayKey: string
  dayLabel: string
}
