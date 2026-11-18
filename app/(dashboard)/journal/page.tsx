import { Suspense } from "react";
import type { Metadata } from "next";
import { EntriesSkeleton } from "./entries-skeleton";
import { EntryForm } from "./entry-form";
import { EntryList } from "./entry-list";

export const metadata: Metadata = { title: "Journal — Dostify" };

export default function JournalPage() {
  return (
    <>
      <h1 className="font-heading text-2xl font-semibold">Journal</h1>
      <EntryForm />
      <Suspense fallback={<EntriesSkeleton />}>
        <EntryList />
      </Suspense>
    </>
  );
}
