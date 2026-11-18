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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Connectors</h1>
          <p className="text-sm text-muted-foreground">
            Connect your accounts so Dostify can use them for you.
            {connections.length > 0 &&
              ` ${connected} of ${connections.length} connected.`}
          </p>
        </div>
        {connections.length > 0 && (
          <div className="relative w-full sm:max-w-60">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search connectors"
              aria-label="Search connectors"
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
        )}
      </div>

      {connections.length > 0 && (
        <div
          role="radiogroup"
          aria-label="Filter connectors"
          className="flex flex-wrap gap-2"
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
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {label}{" "}
                <span className="tabular-nums opacity-70">{counts[value]}</span>
              </button>
            );
          })}
        </div>
      )}

      {notice && (
        <McpConnectionNotice
          notice={notice}
          onDismiss={dismissNotice}
          className="rounded-xl"
        />
      )}

      <div className="overflow-hidden rounded-2xl border bg-card">
        {connections.length > 0 && visible.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No connectors match{q ? ` “${query.trim()}”` : " this filter"}.
          </p>
        ) : (
          <McpConnectionsList
            connections={visible}
            isLoading={isLoading}
            onConnect={connect}
            onRevoke={disconnect}
            resolveDisplay={resolveConnector}
            justConnectedMcpId={
              notice?.kind === "success" ? notice.mcpId : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
