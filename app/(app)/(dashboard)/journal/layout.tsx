import type { ReactNode } from "react";

/** The entries list lives in the app sidebar; this is just the editor's card. */
export default function JournalLayout({ children }: { children: ReactNode }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-card">
      {children}
    </section>
  );
}
