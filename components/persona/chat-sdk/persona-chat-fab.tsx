"use client";

import * as React from "react";
import { ChatCircleDotsIcon, XIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  PersonaChatView,
  type PersonaChatViewProps,
} from "./persona-chat-view";
import { McpAppSplitContext } from "./mcp-app-embed-context";

export interface PersonaChatFabProps
  extends Omit<PersonaChatViewProps, "layout" | "headerActions"> {
  /** Controlled open state. Omit to let the launcher manage it. */
  open?: boolean;
  /** @default false */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  launcherLabel?: string;
  /** Extra classes for the floating panel surface. */
  panelClassName?: string;
}

/**
 * The same full `PersonaChatView` (thread sidebar, voice, files/memory,
 * connectors, terminal, approvals, subagents) collapsed behind a floating
 * launcher. The panel is a compact card at the bottom-left on desktop and
 * full-screen on mobile. Its thread list starts collapsed and opens as a
 * drawer over the conversation, so the panel keeps its width; each launch
 * starts a fresh conversation while past ones stay in that list. Feature
 * dialogs keep their normal centered / sheet sizing so they aren't boxed in
 * by the floating panel.
 *
 * The view stays mounted while minimized so the closing animation isn't
 * empty; the remount key only changes on the next open.
 */
export function PersonaChatFab({
  open,
  defaultOpen = false,
  onOpenChange,
  launcherLabel = "Open chat assistant",
  panelClassName,
  title = "Assistant",
  className,
  ...chatProps
}: PersonaChatFabProps) {
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isOpen = isControlled ? open : uncontrolledOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  // The thread drawer starts closed on every launch and overlays the chat
  // instead of widening the panel.
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(true);

  const [hasMountedView, setHasMountedView] = React.useState(isOpen);
  if (isOpen && !hasMountedView) setHasMountedView(true);

  // Remount the chat on each open so the FAB always lands on a new thread.
  const [sessionKey, setSessionKey] = React.useState(0);
  const [wasOpen, setWasOpen] = React.useState(isOpen);
  // A full-screen MCP app turns the floating card into a split view: the
  // panel takes the viewport and the chat narrows to the left of the app.
  const [appSplit, setAppSplit] = React.useState(false);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setSessionKey((key) => key + 1);
      setSidebarCollapsed(true);
    }
    setAppSplit(false);
  }

  const panelId = React.useId();

  // Escape dismisses the drawer first, then the panel. A window-level listener
  // so it works even when focus isn't inside the panel yet.
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (!sidebarCollapsed) setSidebarCollapsed(true);
      else setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, sidebarCollapsed, setOpen]);

  return (
    <>
      <div
        id={panelId}
        role="dialog"
        aria-label={title}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          "fixed z-50 overflow-hidden border border-border bg-background text-foreground shadow-2xl ring-1 ring-foreground/5",
          appSplit
            ? "inset-0 h-dvh w-full"
            : "inset-0 h-dvh w-full sm:inset-auto sm:bottom-6 sm:left-6 sm:h-[min(88dvh,46rem)] sm:w-[min(94vw,26rem)]",
          "origin-bottom-left transition-[opacity,transform] duration-200 ease-out",
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-3 scale-[0.98] opacity-0",
          panelClassName
        )}
      >
        {hasMountedView && (
          <McpAppSplitContext.Provider value={{ split: appSplit, setSplit: setAppSplit }}>
            <PersonaChatView
              key={sessionKey}
              {...chatProps}
              title={title}
              layout="sidebar-main"
              threadListCollapsible
              threadListOverlay
              threadListCollapsed={sidebarCollapsed}
              onThreadListCollapsedChange={setSidebarCollapsed}
              headerActions={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Minimize chat"
                  onClick={() => setOpen(false)}
                >
                  <XIcon />
                </Button>
              }
              className={cn("h-full", className)}
            />
          </McpAppSplitContext.Provider>
        )}
      </div>

      {!isOpen && (
        <button
          type="button"
          aria-label={launcherLabel}
          aria-controls={panelId}
          aria-expanded={false}
          onClick={() => setOpen(true)}
          className="fixed bottom-4 left-4 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/25 ring-1 ring-foreground/10 transition-transform duration-150 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95 sm:bottom-6 sm:left-6"
        >
          <ChatCircleDotsIcon weight="fill" className="size-6" />
        </button>
      )}
    </>
  );
}
