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

/** 1 column on phones, 2 from `sm`, 3 from `xl`, 4 from `2xl`. */
const GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

export interface McpConnectionsListProps {
  connections: PersonaMcpConnection[];
  onConnect: (connection: PersonaMcpConnection) => void;
  onRevoke: (mcpId: string) => Promise<void>;
  justConnectedMcpId?: string | null;
  isLoading?: boolean;
  /** Customise how each connector is shown; defaults to what Persona sent. */
  resolveDisplay?: (connection: PersonaMcpConnection) => ConnectorDisplay;
}

/**
 * The user-mode MCPs as a responsive card grid (1 column on phones, 2 from
 * `sm`, 3 from `xl`), each with Connect / Reconnect / Disconnect. Buttons are
 * full width with a touch-sized height on phones.
 */
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

  if (isLoading && connections.length === 0) {
    return (
      <div className={GRID} aria-busy="true" role="status" aria-label="Loading connectors">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="skeleton-shimmer size-11 shrink-0 rounded-xl bg-muted" />
              <span className="skeleton-shimmer h-4 w-28 rounded-md bg-muted" />
            </div>
            <span className="skeleton-shimmer h-3 w-full rounded-md bg-muted" />
            <span className="skeleton-shimmer h-3 w-2/3 rounded-md bg-muted" />
            <span className="skeleton-shimmer mt-1 h-10 w-full rounded-full bg-muted sm:h-9" />
          </div>
        ))}
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-10 text-center">
        <PlugsIcon className="size-7 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No connectors are attached to this assistant.</p>
      </div>
    );
  }

  return (
    <>
      <ul className={GRID}>
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
                "flex min-w-0 flex-col gap-3 rounded-2xl border bg-card p-4 transition-colors",
                justConnected && "border-emerald-500/40 bg-emerald-500/5"
              )}
            >
              <div className="flex items-center gap-3">
                <ConnectorTile name={display.name} icon={display.icon} className="size-11 rounded-xl text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] leading-tight font-semibold">{display.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOTS[status])}
                    />
                    <span className="truncate">{STATUS_LABELS[status]}</span>
                    {justConnected && (
                      <span className="flex shrink-0 items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircleIcon weight="fill" className="size-3" />
                        just now
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* flex-1 keeps the button at the card's bottom edge across a row. */}
              <div className="flex flex-1 flex-col gap-1">
                {display.description && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{display.description}</p>
                )}
                {connection.lastError && needsReconnect && (
                  <p className="text-xs text-destructive">{connection.lastError}</p>
                )}
                {expiry && <p className="text-xs text-muted-foreground">{expiry}</p>}
              </div>

              {isConnected ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full rounded-full text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive sm:h-9"
                  disabled={revoking || revokingId !== null}
                  onClick={() => void handleRevoke(connection.mcpId)}
                >
                  {revoking && <Spinner className="size-3.5" />}
                  Disconnect
                </Button>
              ) : (
                <ConnectButton
                  connection={connection}
                  onConnect={onConnect}
                  className="h-10 w-full sm:h-9"
                />
              )}
            </li>
          );
        })}
      </ul>
      {error && <p className="pt-3 text-xs text-destructive">{error}</p>}
    </>
  );
}
