"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircleIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { PersonaMcpConnection } from "@personaai/react";
import { ConnectButton, ConnectorTile, type ConnectorDisplay } from "./connector-ui";
import type { McpConnectionNotice as McpConnectionNoticeState } from "./use-persona-chat-widget";

const STATUS_HINTS: Partial<Record<NonNullable<PersonaMcpConnection["status"]>, string>> = {
  needs_auth: "Access was revoked or expired",
  expired: "Your sign-in expired",
  not_connected: "Connect your account to use its tools",
};

/**
 * User-mode MCP connectors this end user hasn't connected. Their tools are
 * dropped from the Agent's toolset server-side, so without this banner the
 * capability just silently isn't there. Connect/Reconnect hands off to
 * `onConnect`, which redirects to the provider's consent page; the backend's
 * OAuth callback returns here, which remounts the page and refetches
 * connection state.
 *
 * Compact on purpose: it sits above the composer. A plain "not connected yet"
 * nudge can be dismissed for the session; a "tools were skipped" warning can't.
 */
export function McpConnectBanner({
  connections,
  blockedMcpIds,
  onConnect,
  resolveDisplay,
  manageHref,
  className,
}: {
  connections: PersonaMcpConnection[];
  /** Ids the last run actually dropped tools for (the `mcp_auth_required` event). */
  blockedMcpIds?: ReadonlySet<string>;
  onConnect: (connection: PersonaMcpConnection) => void;
  /** Friendly name / icon for a connector; defaults to Persona's raw data. */
  resolveDisplay?: (connection: PersonaMcpConnection) => ConnectorDisplay;
  /** Where "Manage" goes, e.g. a connectors page. Omit to hide the link. */
  manageHref?: string;
  className?: string;
}) {
  const [dismissed, setDismissed] = React.useState(false);
  if (connections.length === 0) return null;
  const blocked = connections.some((c) => blockedMcpIds?.has(c.mcpId));
  if (dismissed && !blocked) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("overflow-hidden rounded-2xl border border-border bg-card text-xs", className)}
    >
      {(blocked || connections.length > 1 || manageHref) && (
        <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
          <span
            className={cn(
              "flex items-center gap-1.5 font-medium",
              blocked ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {blocked && <WarningCircleIcon weight="fill" className="size-3.5 shrink-0" />}
            {blocked
              ? "Some tools were skipped in this reply"
              : connections.length > 1
                ? `${connections.length} accounts to connect`
                : "Connect an account"}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {manageHref && (
              <Link
                href={manageHref}
                className="rounded-full px-2 py-0.5 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Manage
              </Link>
            )}
            {!blocked && (
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setDismissed(true)}
                className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </span>
        </div>
      )}
      <ul className="flex flex-col gap-1 p-2">
        {connections.map((c) => {
          const display = resolveDisplay?.(c) ?? { name: c.name, description: c.description };
          const hint = STATUS_HINTS[c.status ?? "not_connected"];
          return (
            <li key={c.mcpId} className="flex items-center gap-3 rounded-xl px-1.5 py-1">
              <ConnectorTile name={display.name} icon={display.icon} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{display.name}</span>
                {hint && <span className="truncate text-[11px] text-muted-foreground">{hint}</span>}
              </span>
              <ConnectButton connection={c} onConnect={onConnect} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The confirmation for an OAuth round trip: the return used to be completely
 * silent — same page, no change — so users couldn't tell a successful connect
 * from a cancelled one. Success clears itself after a few seconds; failures
 * stay until dismissed because they need acting on.
 */
export function McpConnectionNotice({
  notice,
  onDismiss,
  className,
}: {
  notice: McpConnectionNoticeState;
  onDismiss: () => void;
  className?: string;
}) {
  const success = notice.kind === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-2.5 border px-3 py-2.5 text-xs",
        success
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-destructive/30 bg-destructive/10",
        className
      )}
    >
      {success ? (
        <CheckCircleIcon weight="fill" className="mt-px size-4 shrink-0 text-emerald-500" />
      ) : (
        <WarningCircleIcon weight="fill" className="mt-px size-4 shrink-0 text-destructive" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "font-medium",
            success ? "text-emerald-700 dark:text-emerald-300" : "text-destructive"
          )}
        >
          {success ? `Connected to ${notice.name}` : `Couldn't connect to ${notice.name}`}
        </span>
        <span
          className={cn(
            success
              ? "text-emerald-700/80 dark:text-emerald-300/80"
              : "text-destructive/80"
          )}
        >
          {success
            ? "Its tools are ready to use in your next message."
            : notice.message ?? "The connection wasn't completed. You can try again."}
        </span>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="-mr-1 -mt-1 flex size-6 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  );
}
