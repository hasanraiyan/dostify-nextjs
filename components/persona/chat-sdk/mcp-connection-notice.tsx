"use client";

import * as React from "react";
import { CheckCircleIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { McpConnectionNotice as McpConnectionNoticeState } from "./use-mcp-connect";

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
