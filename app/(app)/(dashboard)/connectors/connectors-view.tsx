"use client";

import * as React from "react";
import { McpConnectionNotice } from "@/components/persona/chat-sdk/mcp-connection-notice";
import { McpConnectionsList } from "@/components/persona/chat-sdk/mcp-connections-list";
import { useMcpConnect } from "@/components/persona/chat-sdk/use-mcp-connect";
import { AGENTS } from "@/app/agents";
import { resolveConnector } from "@/lib/dostify/connector-meta";

/** How long a success notice stays before clearing itself; failures stay until dismissed. */
const SUCCESS_NOTICE_MS = 8000;

export function ConnectorsView() {
  const { connections, unconnected, disconnect, isLoading, error, connect, notice, dismissNotice } =
    useMcpConnect({ agentId: AGENTS[0].agentId });

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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Connectors</h1>
        <p className="text-sm text-muted-foreground">
          Connect your accounts so Dostify can use them for you.
          {connections.length > 0 && ` ${connected} of ${connections.length} connected.`}
        </p>
      </div>

      {notice && <McpConnectionNotice notice={notice} onDismiss={dismissNotice} className="rounded-xl" />}

      <div className="overflow-hidden rounded-2xl border bg-card">
        <McpConnectionsList
          connections={connections}
          isLoading={isLoading}
          onConnect={connect}
          onRevoke={disconnect}
          resolveDisplay={resolveConnector}
          justConnectedMcpId={notice?.kind === "success" ? notice.mcpId : undefined}
        />
      </div>
    </div>
  );
}
