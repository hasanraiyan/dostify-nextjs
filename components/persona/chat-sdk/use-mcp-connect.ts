"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMcpConnections, type PersonaMcpConnection } from "@personaai/react";

/**
 * The OAuth consent flow leaves the app entirely and comes back to the same
 * URL, so the only way to know we just returned from a connector is a marker
 * that survives the round trip. sessionStorage (not a query param) keeps the
 * URL clean and survives the provider's redirect back to `returnTo`.
 */
const PENDING_MCP_CONNECT_KEY = "persona:mcp-pending-connect";
/** A marker older than this is from an abandoned attempt, not this return. */
const PENDING_MCP_CONNECT_MAX_AGE_MS = 3 * 60 * 1000;

/**
 * The provider's callback can redirect back before the backend has finished
 * storing the grant, so the return check polls instead of trusting the first
 * read (which used to report "Couldn't connect" while the connection was in
 * fact succeeding). Delays are cumulative, ~13s worst case.
 */
const MCP_CONNECT_POLL_DELAYS_MS = [0, 800, 1500, 2500, 3500, 5000];

interface PendingMcpConnect {
  mcpId: string;
  name: string;
  at: number;
}

/** What to tell the user after returning from a connector's consent screen. */
export interface McpConnectionNotice {
  kind: "success" | "error";
  mcpId: string;
  name: string;
  /** Failure reason from the provider (`lastError`) or a generic fallback. */
  message?: string;
}

function mcpStatusOf(connection: PersonaMcpConnection | undefined) {
  if (!connection) return "not_connected" as const;
  return connection.status ?? (connection.connected ? "connected" : "not_connected");
}

/**
 * `connected` is authoritative; `status` can lag it by a beat right after the
 * OAuth callback, so trusting `status` alone produced false failures.
 */
function isMcpConnected(connection: PersonaMcpConnection | undefined) {
  return connection?.connected === true || mcpStatusOf(connection) === "connected";
}

/**
 * A user's connectors (per-user OAuth MCPs attached to the agent) plus the
 * connect-and-return flow. Used by the chat and by the Connectors page, so
 * connecting from either place reports its outcome the same way.
 */
export function useMcpConnect({ agentId }: { agentId?: string }) {
  const {
    connections,
    unconnected,
    disconnect,
    isDisconnecting,
    isLoading,
    refetch,
  } = useMcpConnections({ agentId });

  // The consent flow is a full-page redirect, so "connect" is just: remember
  // which connector we left for, then hand the browser to the provider. The
  // confirmation is produced when the page remounts (effect below).
  const connect = useCallback((connection: PersonaMcpConnection) => {
    if (!connection.authorizeUrl) return;
    try {
      const pending: PendingMcpConnect = {
        mcpId: connection.mcpId,
        name: connection.name,
        at: Date.now(),
      };
      sessionStorage.setItem(PENDING_MCP_CONNECT_KEY, JSON.stringify(pending));
    } catch {
      // Storage unavailable (private mode): the redirect still works, we just
      // can't confirm it when they come back.
    }
    window.location.assign(connection.authorizeUrl);
  }, []);

  const [notice, setNotice] = useState<McpConnectionNotice | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);

  // Self-healing failure notice: if the grant lands just after the poll window
  // (slow provider callback, or consent finished in another tab), the live
  // connection state wins over the stored failure — derived rather than
  // written back through an effect so it flips the moment a refetch sees it.
  const liveNotice = useMemo<McpConnectionNotice | null>(() => {
    if (notice?.kind !== "error") return notice;
    const connection = connections.find((c) => c.mcpId === notice.mcpId);
    if (!isMcpConnected(connection)) return notice;
    return {
      kind: "success",
      mcpId: notice.mcpId,
      name: connection?.name || notice.name,
    };
  }, [notice, connections]);

  // On remount after the provider's callback, re-read connection state and
  // report the outcome — otherwise the return is silent and the user can't
  // tell a successful connect from a cancelled or failed one.
  useEffect(() => {
    let target: PendingMcpConnect;
    try {
      const raw = sessionStorage.getItem(PENDING_MCP_CONNECT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<PendingMcpConnect> | null;
      if (!parsed || typeof parsed.mcpId !== "string") {
        sessionStorage.removeItem(PENDING_MCP_CONNECT_KEY);
        return;
      }
      if (typeof parsed.at !== "number" || Date.now() - parsed.at > PENDING_MCP_CONNECT_MAX_AGE_MS) {
        sessionStorage.removeItem(PENDING_MCP_CONNECT_KEY);
        return;
      }
      target = {
        mcpId: parsed.mcpId,
        name: typeof parsed.name === "string" ? parsed.name : "",
        at: parsed.at,
      };
    } catch {
      return;
    }

    let cancelled = false;
    void (async () => {
      // Poll rather than judging on the first read: the callback often beats
      // the backend's write, which made a successful connect look like a
      // failure. Break out as soon as the connection is actually there.
      let connection: PersonaMcpConnection | undefined;
      let connected = false;
      for (const delay of MCP_CONNECT_POLL_DELAYS_MS) {
        if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
        if (cancelled) return;
        try {
          const items = await refetch();
          if (cancelled) return;
          connection = items.find((c) => c.mcpId === target.mcpId);
          connected = isMcpConnected(connection);
        } catch {
          // A transient fetch error shouldn't abort the whole poll window.
          connected = false;
        }
        if (connected) break;
      }

      setNotice(
        connected
          ? { kind: "success", mcpId: target.mcpId, name: connection?.name || target.name }
          : {
              kind: "error",
              mcpId: target.mcpId,
              name: connection?.name || target.name,
              message:
                connection?.lastError ??
                "The connection wasn't completed. You can try again.",
            }
      );
      // Only clear after reporting, so a cancelled pass (StrictMode's
      // mount/unmount/mount) doesn't lose the marker for the next one.
      try {
        sessionStorage.removeItem(PENDING_MCP_CONNECT_KEY);
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [refetch]);

  return {
    connections,
    unconnected,
    disconnect,
    isDisconnecting,
    isLoading,
    refetch,
    connect,
    notice: liveNotice,
    dismissNotice,
  };
}
