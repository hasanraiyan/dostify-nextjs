import { getCurrentDbUser } from "@/lib/dostify/current-user";
import { dayKey, dayLabel, timeLabel } from "@/lib/dostify/dates";
import { listEntries } from "@/lib/dostify/journal";
import { EntryListPane } from "./entry-list-pane";

/** Loads the user's entries and hands them to the (client-side searchable) list. */
export async function ListData() {
  const user = await getCurrentDbUser();
  const rows = user ? await listEntries(user.id) : [];
  const now = new Date();
  return (
    <EntryListPane
      entries={rows.map((e) => ({
        id: e.id,
        text: e.text,
        pinned: e.pinned,
        time: timeLabel(e.createdAt),
        dayKey: dayKey(e.createdAt),
        dayLabel: dayLabel(e.createdAt, now),
      }))}
    />
  );
}
