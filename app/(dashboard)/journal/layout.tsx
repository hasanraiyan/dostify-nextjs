import { Suspense } from "react";
import type { ReactNode } from "react";
import { EntriesSkeleton } from "./entries-skeleton";
import { JournalShell } from "./journal-shell";
import { ListData } from "./list-data";

export default function JournalLayout({ children }: { children: ReactNode }) {
  return (
    // The shell reads the pathname, which is request-time data, so it needs a boundary.
    <Suspense fallback={<EntriesSkeleton />}>
      <JournalShell
        list={
          <Suspense fallback={<EntriesSkeleton />}>
            <ListData />
          </Suspense>
        }
      >
        {children}
      </JournalShell>
    </Suspense>
  );
}
