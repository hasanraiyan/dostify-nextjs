"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MessageMarkdown } from "./message-markdown";
import type { PersonaMessage } from "@personaai/react";

function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

/**
 * One reasoning/thinking block, adapted from the old dashboard's
 * ReasoningBubble (itself from JimLiu/claude-agent-kit, MIT): an italic
 * collapsible header that auto-opens while the block is streaming and
 * auto-collapses once the backend stamps a duration, unless the user toggles
 * it. The thought text renders muted below a hairline so the final answer
 * stays the visual focus.
 */
function ReasoningBlock({
  reasoning,
  className,
}: {
  reasoning: PersonaMessage;
  className?: string;
}) {
  const isStreaming = !!reasoning.isStreaming;

  // Derive open state from the live stream unless the user flips it manually;
  // manualOpen starts null so the first render follows isStreaming.
  const [manualOpen, setManualOpen] = React.useState<boolean | null>(null);
  const open = manualOpen ?? isStreaming;

  // Live "Thought · Ns" label while a block is still streaming. PersonaMessage
  // carries no started-at timestamp, so this clocks from first render instead
  // of the block's real open time — close enough for a live ticker, and
  // finished blocks just show "Thought" with no duration (the SDK doesn't
  // stamp one).
  const [mountedAt] = React.useState(() => Date.now());
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!isStreaming) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [isStreaming]);

  const liveElapsed = formatElapsed(Math.max(0, now - mountedAt));
  const doneElapsed: string | null = null;

  const hasContent = !!reasoning.content?.trim();
  const headerLabel = hasContent
    ? `Thoughts${doneElapsed ? ` for ${doneElapsed}` : ""}`
    : "Thinking";

  return (
    <div
      className={cn(
        "max-w-full text-muted-foreground select-text",
        !open && "-mb-0.5",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setManualOpen(!open)}
        aria-expanded={open}
        className="group flex cursor-pointer items-center py-0.5 text-xs font-medium text-foreground/90 transition-colors hover:text-foreground select-none focus-visible:outline-none"
      >
        <span className="text-xs font-medium text-foreground/90 group-hover:text-foreground transition-colors">
          {isStreaming ? (
            <span className="inline-flex items-center gap-1">
              <span>Thinking</span>
              <span className="animate-pulse">…</span>
            </span>
          ) : (
            headerLabel
          )}
        </span>
      </button>

      {open ? (
        <div className="mt-1 text-[11px] text-muted-foreground/80 leading-relaxed">
          {hasContent ? (
            <MessageMarkdown
              muted
              content={reasoning.content}
              className="text-[11px] leading-relaxed [&_p]:my-1.5"
            />
          ) : (
            <span className="text-[11px] text-muted-foreground/70">
              {isStreaming ? `Started ${liveElapsed} ago` : "No reasoning captured."}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}

export { ReasoningBlock };
