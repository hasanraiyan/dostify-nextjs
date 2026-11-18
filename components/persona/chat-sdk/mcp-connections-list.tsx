"use client";

import * as React from "react";
import { CheckCircleIcon, PlugsIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { PersonaMcpConnection } from "@personaai/react";
import { ConnectButton, ConnectorTile, type ConnectorDisplay } from "./connector-ui";

export type { ConnectorDisplay };

type McpStatus = NonNullable<PersonaMcpConnection["status"]>;

const STATUS_LABELS: Record<McpStatus, string> = {
  connected: "Connected",
  expired: "Expired",
  needs_auth: "Needs auth",
  not_connected: "Not connected",
};

const STATUS_DOTS: Record<McpStatus, string> = {
  connected: "bg-emerald-500",
  expired: "bg-destructive",
  needs_auth: "bg-destructive",
  not_connected: "bg-muted-foreground/50",
};

/** Backends predating `status` only send the boolean — derive the finer state. */
function statusOf(connection: PersonaMcpConnection): McpStatus {
  return connection.status ?? (connection.connected ? "connected" : "not_connected");
}

/** Short, locale-aware "expires" hint for connectors with a token lifetime. */
function formatExpiry(expiresAt: string | null | undefined) {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return null;
  return `Expires ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

export interface McpConnectionsListProps {
  connections: PersonaMcpConnection[];
  onConnect: (connection: PersonaMcpConnection) => void;
  onRevoke: (mcpId: string) => Promise<void>;
  justConnectedMcpId?: string | null;
  isLoading?: boolean;
  /** Customise how each connector is shown; defaults to what Persona sent. */
  resolveDisplay?: (connection: PersonaMcpConnection) => ConnectorDisplay;
}

/** One row per user-mode MCP with Connect / Reconnect / Disconnect. Used by the dialog and the Connectors page. */
export function McpConnectionsList({
  connections,
  onConnect,
  onRevoke,
  justConnectedMcpId,
  isLoading,
  resolveDisplay,
}: McpConnectionsListProps) {
  const [revokingId, setRevokingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleRevoke = React.useCallback(
    async (mcpId: string) => {
      setRevokingId(mcpId);
      setError(null);
      try {
        await onRevoke(mcpId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to revoke access.");
      } finally {
        setRevokingId(null);
      }
    },
    [onRevoke]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {isLoading && connections.length === 0 ? (
        <ul className="divide-y divide-border" aria-busy="true">
          {[0, 1].map((i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="size-8 shrink-0 animate-pulse border border-border bg-muted/60" />
              <div className="flex flex-1 flex-col gap-1.5">
                <span className="h-3 w-32 animate-pulse bg-muted" />
                <span className="h-2.5 w-48 animate-pulse bg-muted/70" />
              </div>
            </li>
          ))}
        </ul>
      ) : connections.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <PlugsIcon className="size-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            No connectors are attached to this assistant.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {connections.map((connection) => {
            const status = statusOf(connection);
            const isConnected = status === "connected";
            const needsReconnect = status === "needs_auth" || status === "expired";
            const revoking = revokingId === connection.mcpId;
            const justConnected = justConnectedMcpId === connection.mcpId;
            const expiry = isConnected ? formatExpiry(connection.expiresAt) : null;
            const display: ConnectorDisplay = resolveDisplay?.(connection) ?? {
              name: connection.name,
              description: connection.description,
            };
            return (
              <li
                key={connection.mcpId}
                className={cn(
                  "flex items-start justify-between gap-3 px-4 py-3 transition-colors",
                  justConnected && "bg-emerald-500/5"
                )}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <ConnectorTile name={display.name} icon={display.icon} />
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate text-sm font-medium">{display.name}</span>
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span
                          aria-hidden="true"
                          className={cn("size-1.5 rounded-full", STATUS_DOTS[status])}
                        />
                        {STATUS_LABELS[status]}
                        {justConnected && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircleIcon weight="fill" className="size-3" />
                            just now
                          </span>
                        )}
                      </span>
                    </div>
                    {display.description && (
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {display.description}
                      </span>
                    )}
                    {connection.lastError && needsReconnect && (
                      <span className="text-xs text-destructive">{connection.lastError}</span>
                    )}
                    {expiry && (
                      <span className="text-[11px] text-muted-foreground">{expiry}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center self-center">
                  {isConnected ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 rounded-full px-4 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                      disabled={revoking || revokingId !== null}
                      onClick={() => void handleRevoke(connection.mcpId)}
                    >
                      {revoking && <Spinner className="size-3.5" />}
                      Disconnect
                    </Button>
                  ) : (
                    <ConnectButton connection={connection} onConnect={onConnect} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {error && <p className="px-4 pb-3 text-xs text-destructive">{error}</p>}
    </div>
  );
}
