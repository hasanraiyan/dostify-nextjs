"use client";

import * as React from "react";
import {
  ArrowSquareOutIcon,
  CheckCircleIcon,
  KeyIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PersonaMcpConnection } from "@personaai/react";
import type { McpConnectionNotice as McpConnectionNoticeState } from "./use-persona-chat-widget";

const STATUS_HINTS: Partial<Record<NonNullable<PersonaMcpConnection["status"]>, string>> = {
  needs_auth: "Access was revoked or expired",
  expired: "Your sign-in expired",
  not_connected: "Hasn't been connected yet",
};

/**
 * User-mode MCP connectors this end user hasn't connected. Their tools are
 * dropped from the Agent's toolset server-side, so without this banner the
 * capability just silently isn't there. Connect/Reconnect hands off to
 * `onConnect`, which redirects to the provider's consent page; the backend's
 * OAuth callback returns here, which remounts the page and refetches
 * connection state.
 */
export function McpConnectBanner({
  connections,
  blockedMcpIds,
  onConnect,
  className,
}: {
  connections: PersonaMcpConnection[];
  /** Ids the last run actually dropped tools for (the `mcp_auth_required` event). */
  blockedMcpIds?: ReadonlySet<string>;
  onConnect: (connection: PersonaMcpConnection) => void;
  className?: string;
}) {
  if (connections.length === 0) return null;
  const blocked = connections.some((c) => blockedMcpIds?.has(c.mcpId));

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card text-xs",
        className
      )}
    >
      <div className="flex items-start gap-2.5 border-b border-border/70 bg-muted/30 px-3 py-2.5">
        <span className="mt-px flex size-6 shrink-0 items-center justify-center border border-border bg-background text-muted-foreground">
          <KeyIcon className="size-3.5" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-semibold text-foreground">
            {blocked ? "Some tools were skipped in this reply" : "Connect accounts to unlock more tools"}
          </span>
          <span className="text-muted-foreground">
            {blocked
              ? "This assistant can't use these tools until you connect your account."
              : "This assistant has tools it can only use after you connect your account."}
          </span>
        </div>
      </div>
      <ul className="divide-y divide-border/70">
        {connections.map((c) => {
          const hint = STATUS_HINTS[c.status ?? "not_connected"];
          const needsReconnect = c.status === "needs_auth" || c.status === "expired";
          return (
            <li key={c.mcpId} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-foreground">{c.name}</span>
                {hint && <span className="truncate text-[11px] text-muted-foreground">{hint}</span>}
              </span>
              <Button
                type="button"
                size="sm"
                variant={needsReconnect ? "default" : "outline"}
                disabled={!c.authorizeUrl}
                onClick={() => onConnect(c)}
              >
                {needsReconnect ? "Reconnect" : "Connect"}
                <ArrowSquareOutIcon className="size-3" />
              </Button>
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
