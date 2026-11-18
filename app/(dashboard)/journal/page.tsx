import { Suspense } from "react";
import type { Metadata } from "next";
import { EntriesSkeleton } from "./entries-skeleton";
import { EntryForm } from "./entry-form";
import { EntryList } from "./entry-list";
import { SearchBox, SearchBoxFallback } from "./search-box";

export const metadata: Metadata = { title: "Journal — Dostify" };

export default function JournalPage({ searchParams }: PageProps<"/journal">) {
  return (
    <>
      <h1 className="font-heading text-2xl font-semibold">Journal</h1>
      <EntryForm />
      <Suspense fallback={<SearchBoxFallback />}>
        <SearchBox />
      </Suspense>
      <Suspense fallback={<EntriesSkeleton />}>
        <EntryList searchParams={searchParams as Promise<{ q?: string }>} />
      </Suspense>
    </>
  );
}
