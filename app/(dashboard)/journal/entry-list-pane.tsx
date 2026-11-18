"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MagnifyingGlassIcon, PencilSimpleLineIcon, PushPinIcon, XIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { splitText } from "./entry-text";

export interface ListEntry {
  id: string;
  text: string;
  pinned: boolean;
  time: string;
  dayKey: string;
  dayLabel: string;
}

type Group = { key: string; label: string; items: ListEntry[] };

/** Pinned first, then by day. `entries` arrive newest first. */
function group(entries: ListEntry[]): Group[] {
  const groups: Group[] = [];
  const pinned = entries.filter((e) => e.pinned);
  if (pinned.length) groups.push({ key: "pinned", label: "Pinned", items: pinned });
  for (const e of entries.filter((x) => !x.pinned)) {
    const last = groups[groups.length - 1];
    if (last?.key === e.dayKey) last.items.push(e);
    else groups.push({ key: e.dayKey, label: e.dayLabel, items: [e] });
  }
  return groups;
}

export function EntryListPane({ entries }: { entries: ListEntry[] }) {
  const pathname = usePathname();
  const [query, setQuery] = React.useState("");

  const q = query.trim().toLowerCase();
  const visible = q ? entries.filter((e) => e.text.toLowerCase().includes(q)) : entries;
  const groups = group(visible);

  return (
    <>
      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-heading text-xl font-semibold">Journal</h1>
          <Link
            href="/journal/new"
            aria-label="New entry"
            className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
          >
            <PencilSimpleLineIcon className="size-4" />
          </Link>
        </div>
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search journal"
            className="h-9 w-full rounded-full border border-input bg-transparent pr-8 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>
      </div>

      <nav aria-label="Journal entries" className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {groups.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            {q ? "No matching entries." : "No entries yet."}
          </p>
        ) : (
          groups.map((g) => (
            <section key={g.key} className="mb-3">
              <h2 className="px-2 py-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {g.label}
              </h2>
              <ul className="flex flex-col gap-0.5">
                {g.items.map((e) => {
                  const { title, body } = splitText(e.text);
                  const href = `/journal/${e.id}`;
                  const active = pathname === href;
                  return (
                    <li key={e.id}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex flex-col gap-0.5 rounded-xl px-3 py-2 transition-colors",
                          active ? "bg-primary/15" : "hover:bg-muted",
                        )}
                      >
                        <span className="truncate text-sm font-semibold">{title || "New entry"}</span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {e.pinned && <PushPinIcon weight="fill" className="size-3 shrink-0 text-primary" />}
                          <span className="shrink-0">{e.time}</span>
                          {body && <span className="truncate">{body.replace(/\s+/g, " ")}</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </nav>
    </>
  );
}
