import { getCurrentDbUser } from "@/lib/dostify/current-user";
import { dayKey, dayLabel, timeLabel } from "@/lib/dostify/dates";
import { listEntries } from "@/lib/dostify/journal";
import { EntryCard } from "./entry-card";

type Entry = Awaited<ReturnType<typeof listEntries>>[number];

/**
 * The user's entries: pinned ones first, then grouped by day (Aaj, Kal, then
 * dates), newest first. With a search query, matches only.
 */
export async function EntryList({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() || undefined;

  const user = await getCurrentDbUser();
  const entries = user ? await listEntries(user.id, { query }) : [];

  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        {query ? "Kuch nahi mila." : "Abhi koi entry nahi hai."}
      </p>
    );
  }

  const now = new Date();
  const groups: { key: string; label: string; items: Entry[] }[] = [];
  const pinned = entries.filter((e) => e.pinned);
  if (pinned.length) groups.push({ key: "pinned", label: "Pinned", items: pinned });
  for (const entry of entries.filter((e) => !e.pinned)) {
    const key = dayKey(entry.createdAt);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(entry);
    else groups.push({ key, label: dayLabel(entry.createdAt, now), items: [entry] });
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <section key={g.key} className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {g.label}
          </h2>
          <ul className="flex flex-col gap-2">
            {g.items.map((e) => (
              <li key={e.id}>
                <EntryCard
                  entry={{ id: e.id, text: e.text, pinned: e.pinned, time: timeLabel(e.createdAt) }}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
