"use client";

import * as React from "react";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { McpConnectionNotice } from "@/components/persona/chat-sdk/mcp-connection-notice";
import { McpConnectionsList } from "@/components/persona/chat-sdk/mcp-connections-list";
import { useMcpConnect } from "@/components/persona/chat-sdk/use-mcp-connect";
import { AGENTS } from "@/app/agents";
import { resolveConnector } from "@/lib/dostify/connector-meta";
import { cn } from "@/lib/utils";

/** How long a success notice stays before clearing itself; failures stay until dismissed. */
const SUCCESS_NOTICE_MS = 8000;

type Filter = "all" | "connected" | "not-connected";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "connected", label: "Connected" },
  { value: "not-connected", label: "Not connected" },
];

const isConnected = (c: { connected?: boolean; status?: string }) =>
  c.connected === true || c.status === "connected";

export function ConnectorsView() {
  const {
    connections,
    unconnected,
    disconnect,
    isLoading,
    error,
    connect,
    notice,
    dismissNotice,
  } = useMcpConnect({ agentId: AGENTS[0].agentId });

  // Dev only: print exactly what the API returned, so the UI can be designed
  // (or hardcoded) against the real shape. The consent URL is reduced to its
  // origin and path because its query carries OAuth state.
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production" || isLoading) return;
    const safe = connections.map(({ authorizeUrl, ...rest }) => {
      let authorize: string | null = null;
      if (authorizeUrl) {
        try {
          const u = new URL(authorizeUrl);
          authorize = `${u.origin}${u.pathname} (+query hidden)`;
        } catch {
          authorize = "(unparseable URL)";
        }
      }
      return { ...rest, authorizeUrl: authorize };
    });
    console.groupCollapsed(
      `[connectors] ${connections.length} attached, ${unconnected.length} not connected` +
        (error ? ` — ERROR: ${error.message}` : ""),
    );
    if (error) console.error("[connectors] fetch error:", error);
    if (safe.length) console.table(safe);
    console.log("[connectors] raw JSON:", JSON.stringify(safe, null, 2));
    console.log("[connectors] pending OAuth notice:", notice);
    console.groupEnd();
  }, [connections, unconnected.length, isLoading, error, notice]);

  React.useEffect(() => {
    if (notice?.kind !== "success") return;
    const timer = setTimeout(dismissNotice, SUCCESS_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice, dismissNotice]);

  const connected = connections.length - unconnected.length;

  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");

  const q = query.trim().toLowerCase();
  const visible = connections.filter((c) => {
    if (filter === "connected" && !isConnected(c)) return false;
    if (filter === "not-connected" && isConnected(c)) return false;
    if (!q) return true;
    const display = resolveConnector(c);
    return [display.name, c.name, display.description].some((t) =>
      t?.toLowerCase().includes(q),
    );
  });
  const counts: Record<Filter, number> = {
    all: connections.length,
    connected,
    "not-connected": unconnected.length,
  };

  const [searchOpen, setSearchOpen] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const openSearch = () => {
    setSearchOpen(true);
    // Wait for the field to mount, then focus it (opens the keyboard on phones).
    requestAnimationFrame(() => searchRef.current?.focus());
  };
  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  /* iOS-style search field: soft fill, no border. */
  const searchField = (
    <div className="relative min-w-0 flex-1">
      <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={searchRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search"
        aria-label="Search connectors"
        className="h-9 w-full rounded-[10px] bg-muted/70 pr-8 pl-8 text-base outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40 sm:text-[15px] [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setQuery("")}
          className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-muted-foreground/40 text-background"
        >
          <XIcon weight="bold" className="size-3" />
        </button>
      )}
    </div>
  );

  const hasConnectors = connections.length > 0;

  return (
    <div className="flex w-full flex-col gap-4 pb-12">
      <header className="flex flex-col gap-1">
        {/* Mobile: the title row swaps to the search field (icon first, like iOS / ChatGPT). */}
        <div className="flex h-11 items-center gap-2">
          {searchOpen ? (
            <>
              {searchField}
              <button
                type="button"
                onClick={closeSearch}
                className="shrink-0 px-1 text-[17px] text-primary active:opacity-60"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <h1 className="font-heading text-[28px] leading-none font-bold tracking-tight sm:text-[34px]">
                Connectors
              </h1>
              {hasConnectors && (
                <button
                  type="button"
                  aria-label="Search connectors"
                  onClick={openSearch}
                  className="ml-auto flex size-9 md:hidden items-center justify-center rounded-full bg-muted/70 text-foreground active:scale-95"
                >
                  <MagnifyingGlassIcon className="size-[18px]" />
                </button>
              )}
              {/* Desktop keeps the field in view the whole time. */}
              {hasConnectors && <div className="ml-auto hidden w-64 md:flex">{searchField}</div>}
            </>
          )}
        </div>
        <p className="text-[15px] text-muted-foreground">
          Connect your accounts so Dostify can use them for you.
          {hasConnectors && (
            <span className="whitespace-nowrap"> {connected} of {connections.length} connected.</span>
          )}
        </p>
      </header>

      {hasConnectors && (
        /* iOS segmented control: a soft track with a raised selected segment. */
        <div
          role="radiogroup"
          aria-label="Filter connectors"
          className="grid grid-cols-3 rounded-[10px] bg-muted/70 p-0.5 sm:inline-grid sm:self-start"
        >
          {FILTERS.map(({ value, label }) => {
            const active = filter === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setFilter(value)}
                className={cn(
                  "h-8 rounded-[8px] px-3 text-[13px] font-medium whitespace-nowrap transition-all sm:px-5",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label} <span className="tabular-nums opacity-60">{counts[value]}</span>
              </button>
            );
          })}
        </div>
      )}

      {notice && (
        <McpConnectionNotice notice={notice} onDismiss={dismissNotice} className="rounded-xl" />
      )}

      {connections.length > 0 && visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No connectors match{q ? ` “${query.trim()}”` : " this filter"}.
        </p>
      ) : (
        <McpConnectionsList
          connections={visible}
          isLoading={isLoading}
          onConnect={connect}
          onRevoke={disconnect}
          resolveDisplay={resolveConnector}
          justConnectedMcpId={notice?.kind === "success" ? notice.mcpId : undefined}
        />
      )}
    </div>
  );
}
