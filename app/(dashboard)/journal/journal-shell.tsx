"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Two panes on laptops (list | editor). On phones only one shows at a time:
 * the list at /journal, the editor at /journal/<id> and /journal/new.
 */
export function JournalShell({
  list,
  children,
}: {
  list: React.ReactNode;
  children: React.ReactNode;
}) {
  const onList = usePathname() === "/journal";
  return (
    <div className="grid h-[calc(100dvh-6.5rem)] min-h-96 md:h-[calc(100dvh-2rem)] gap-4 md:grid-cols-[20rem_minmax(0,1fr)]">
      <aside
        className={cn(
          "min-h-0 flex-col overflow-hidden rounded-2xl border bg-card",
          onList ? "flex" : "hidden md:flex",
        )}
      >
        {list}
      </aside>
      <section
        className={cn(
          "min-h-0 flex-col overflow-hidden rounded-2xl border bg-card",
          onList ? "hidden md:flex" : "flex",
        )}
      >
        {children}
      </section>
    </div>
  );
}
