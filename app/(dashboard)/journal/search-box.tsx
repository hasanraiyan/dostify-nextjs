"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";

const FIELD_CLASS =
  "h-10 w-full rounded-full border border-input bg-transparent pr-9 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** Plain GET form: Enter submits `?q=...`, no client state needed. */
export function SearchBox() {
  const q = useSearchParams().get("q") ?? "";
  return (
    <form action="/journal" method="get" role="search" className="relative">
      <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        // Remount when the URL's query changes so defaultValue follows it.
        key={q}
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Search"
        aria-label="Search journal"
        className={FIELD_CLASS}
      />
      {q && (
        <Link
          href="/journal"
          aria-label="Clear search"
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" />
        </Link>
      )}
    </form>
  );
}

/** Same field, inert, shown while the search params resolve. */
export function SearchBoxFallback() {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input disabled placeholder="Search" aria-label="Search journal" className={FIELD_CLASS} />
    </div>
  );
}
