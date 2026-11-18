import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Journal — Dostify" };

/** Laptop-only placeholder for the right pane; on phones the list shows instead. */
export default function JournalPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm text-muted-foreground">Select an entry, or start a new one.</p>
      <Link
        href="/journal/new"
        className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        New entry
      </Link>
    </div>
  );
}
