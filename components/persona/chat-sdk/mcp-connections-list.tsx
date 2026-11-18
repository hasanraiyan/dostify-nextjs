"use client";

import * as React from "react";
import { CheckCircleIcon, PlugsIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { PersonaMcpConnection } from "@personaai/react";
import {
  ConnectButton,
  ConnectorTile,
  type ConnectorDisplay,
} from "./connector-ui";

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
  return (
    connection.status ?? (connection.connected ? "connected" : "not_connected")
  );
}

/** Short, locale-aware "expires" hint for connectors with a token lifetime. */
function formatExpiry(expiresAt: string | null | undefined) {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return null;
  return `Expires ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

/**
 * Phones: iOS "inset grouped" list (one rounded card, rows split by hairlines).
 * From `md`: a card grid (2 columns, 3 from `xl`, 4 from `2xl`).
 */
const GROUP =
  "divide-y divide-border/70 overflow-hidden rounded-2xl border bg-card md:grid md:grid-cols-2 md:gap-3 md:divide-y-0 md:overflow-visible md:rounded-none md:border-0 md:bg-transparent xl:grid-cols-3 2xl:grid-cols-4";

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
        setError(
          err instanceof Error ? err.message : "Failed to revoke access.",
        );
      } finally {
        setRevokingId(null);
      }
    },
    [onRevoke],
  );

  if (isLoading && connections.length === 0) {
    return (
      <div
        className={GROUP}
        aria-busy="true"
        role="status"
        aria-label="Loading connectors"
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <span className="skeleton-shimmer size-12 shrink-0 rounded-[11px] bg-muted" />
            <div className="flex flex-1 flex-col gap-2">
              <span className="skeleton-shimmer h-4 w-28 rounded-md bg-muted" />
              <span className="skeleton-shimmer h-3 w-44 max-w-full rounded-md bg-muted" />
            </div>
            <span className="skeleton-shimmer h-8 w-20 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-10 text-center">
        <PlugsIcon className="size-7 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No connectors are attached to this assistant.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className={GROUP}>
        {connections.map((connection) => {
          const status = statusOf(connection);
          const isConnected = status === "connected";
          const needsReconnect =
            status === "needs_auth" || status === "expired";
          const revoking = revokingId === connection.mcpId;
          const justConnected = justConnectedMcpId === connection.mcpId;
          const expiry = isConnected
            ? formatExpiry(connection.expiresAt)
            : null;
          const display: ConnectorDisplay = resolveDisplay?.(connection) ?? {
            name: connection.name,
            description: connection.description,
          };
          return (
            <li
              key={connection.mcpId}
              className={cn(
                "flex min-w-0 items-center gap-3 px-4 py-3 transition-colors md:flex-col md:items-stretch md:rounded-2xl md:border md:bg-card md:p-4",
                justConnected && "bg-emerald-500/5",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 md:items-start">
                <ConnectorTile
                  name={display.name}
                  icon={display.icon}
                  className="size-12 shrink-0 rounded-[11px] text-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px] leading-snug font-medium tracking-[-0.01em]">
                    {display.name}
                  </p>
                  {display.description && (
                    <p className="line-clamp-1 text-[13px] leading-snug text-muted-foreground md:line-clamp-3">
                      {display.description}
                    </p>
                  )}
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        STATUS_DOTS[status],
                      )}
                    />
                    <span className="truncate">
                      {STATUS_LABELS[status]}
                      {expiry ? ` · ${expiry}` : ""}
                    </span>
                    {justConnected && (
                      <span className="flex shrink-0 items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircleIcon weight="fill" className="size-3" />
                        just now
                      </span>
                    )}
                  </p>
                  {connection.lastError && needsReconnect && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-destructive">
                      {connection.lastError}
                    </p>
                  )}
                </div>
              </div>

              {isConnected ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 shrink-0 rounded-full bg-muted px-4 text-[13px] md:h-9 md:w-full font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                  className="shrink-0 bg-primary/10 text-[13px] md:h-9 md:w-full font-semibold text-primary shadow-none hover:bg-primary/20"
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
