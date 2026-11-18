"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/*
 * A small, honest picture of the journal in three views (write, search, ask
 * Dostify), in the same dark panel style as the hero. The text is sample copy.
 */

const TABS = [
  { id: "write", label: "Write", file: "Journal / New entry" },
  { id: "search", label: "Search", file: "Journal / Search “friday”" },
  { id: "ask", label: "Ask Dostify", file: "Chat" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Row({ title, meta, pinned }: { title: string; meta: string; pinned?: boolean }) {
  return (
    <li className="flex items-center justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
      <span className="min-w-0 truncate text-[15px] text-white">
        {pinned && <span className="mr-2 text-primary">Pinned</span>}
        {title}
      </span>
      <span className="shrink-0 text-[13px] text-[#B5A79F]">{meta}</span>
    </li>
  );
}

function Panel({ id }: { id: TabId }) {
  if (id === "write") {
    return (
      <div className="px-5 pt-4 pb-6 sm:px-6">
        <p className="font-heading text-2xl font-bold text-white">Physics test kal</p>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-[#D8CCC4]">
          Motion pehle, phir thermodynamics. Last mein 20 minute ka revision. Agar neend aaye to subah
          5 baje uthna hai.
        </p>
        <p className="mt-5 text-[13px] text-[#B5A79F]">Saved as you type.</p>
      </div>
    );
  }
  if (id === "search") {
    return (
      <ul className="px-5 pb-3 sm:px-6">
        <Row title="Group project went well" meta="Friday, 8:12 pm" />
        <Row title="Things I am proud of" meta="Pinned" pinned />
        <Row title="Friday plan with Riya" meta="Last week" />
      </ul>
    );
  }
  return (
    <div className="flex flex-col gap-3 px-5 pt-4 pb-6 sm:px-6">
      <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#F6EFE9] px-4 py-2.5 text-[15px] text-[#241914]">
        Find what I wrote about the group project.
      </p>
      <p className="max-w-[92%] rounded-2xl rounded-bl-md bg-white/[0.07] px-4 py-3 text-[15px] leading-relaxed text-[#F7F1EC]">
        Found it. On Friday you wrote “Group project went well”: everyone finished their part on time.
        Want me to open it?
      </p>
    </div>
  );
}

export function JournalShowcase() {
  const [tab, setTab] = React.useState<TabId>("write");
  const current = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div className="min-w-0 overflow-hidden rounded-[18px] bg-[#1B1411]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <div role="tablist" aria-label="Journal examples" className="flex min-w-0 gap-1 overflow-x-auto [scrollbar-width:none]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-[14px] whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                tab === t.id ? "bg-white/10 text-white" : "text-[#B5A79F] hover:text-white",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="px-5 pt-4 text-[13px] text-[#9B8D85] sm:px-6">{current.file}</div>
      <div role="tabpanel" className="min-h-[15rem]">
        <Panel id={tab} />
      </div>
    </div>
  );
}
