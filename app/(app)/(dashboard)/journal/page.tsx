import type { Metadata } from "next";
import Link from "next/link";
import { JournalPanel } from "@/components/dostify/journal-panel";

export const metadata: Metadata = { title: "Journal — Dostify" };

export default function JournalPage() {
  return (
    <>
      {/* Phones have no permanent sidebar, so show the list here. */}
      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        <JournalPanel />
      </div>
      {/* Laptops: the list is in the sidebar, so this pane is a prompt. */}
      <div className="hidden flex-1 flex-col items-center justify-center gap-3 p-6 text-center md:flex">
        <p className="text-sm text-muted-foreground">Select an entry, or start a new one.</p>
        <Link
          href="/journal/new"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          New entry
        </Link>
      </div>
    </>
  );
}
