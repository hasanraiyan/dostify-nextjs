"use client";

import * as React from "react";
import {
  DotsThreeVerticalIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import type { PersonaThread } from "@personaai/react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ThreadListBodyProps {
  threads: PersonaThread[];
  loading: boolean;
  /** Loading has taken suspiciously long: offer a retry. */
  stalled: boolean;
  onRetry: () => void;
  activeThreadId?: string;
  onSelect: (threadId: string) => void;
  /** Called when the thread being deleted is the open one. */
  onActiveThreadDeleted: () => void;
  renameThread: (threadId: string, title: string) => Promise<unknown>;
  deleteThread: (threadId: string) => Promise<unknown>;
}

/**
 * The chat list: search, rows with rename/delete, loading skeleton. Shared by
 * the chat view's own sidebar and the app-wide sidebar.
 */
export function ThreadListBody({
  threads,
  loading,
  stalled,
  onRetry,
  activeThreadId,
  onSelect,
  onActiveThreadDeleted,
  renameThread,
  deleteThread,
}: ThreadListBodyProps) {
  const [renamingThreadId, setRenamingThreadId] = React.useState<string | null>(null);
  const [renameDraft, setRenameDraft] = React.useState("");
  // Escape unmounts the input, which also fires onBlur — skip the commit then.
  const renameCancelledRef = React.useRef(false);

  // Rows reflect these immediately while the request runs; the SDK patches
  // `threads` on success, and dropping the override is a no-op rollback on
  // failure because `threads` still holds the previous title.
  const [titleOverrides, setTitleOverrides] = React.useState<Record<string, string>>({});
  const [pendingDeleteIds, setPendingDeleteIds] = React.useState<ReadonlySet<string>>(new Set());
  const [threadSearch, setThreadSearch] = React.useState("");

  const displayThreads = React.useMemo(
    () =>
      threads
        .filter((t) => !pendingDeleteIds.has(t._id))
        .map((t) => (titleOverrides[t._id] ? { ...t, title: titleOverrides[t._id] } : t)),
    [threads, pendingDeleteIds, titleOverrides]
  );
  const filteredThreads = React.useMemo(() => {
    if (!threadSearch.trim()) return displayThreads;
    const q = threadSearch.toLowerCase();
    return displayThreads.filter((t) => (t.title || "New chat").toLowerCase().includes(q));
  }, [displayThreads, threadSearch]);

  const startRename = (threadId: string, currentTitle?: string) => {
    renameCancelledRef.current = false;
    setRenameDraft(currentTitle ?? "");
    setRenamingThreadId(threadId);
  };

  const commitRename = () => {
    const threadId = renamingThreadId;
    if (!threadId) return;
    setRenamingThreadId(null);
    if (renameCancelledRef.current) {
      renameCancelledRef.current = false;
      return;
    }
    const title = renameDraft.trim();
    // Compare with what the row shows, so retyping the pending title is a no-op.
    const current = displayThreads.find((t) => t._id === threadId);
    if (!title || title === (current?.title ?? "")) return;
    setTitleOverrides((prev) => ({ ...prev, [threadId]: title }));
    void renameThread(threadId, title)
      .catch(() => {})
      .finally(() => {
        setTitleOverrides((prev) => {
          if (prev[threadId] !== title) return prev; // a newer rename owns it
          const next = { ...prev };
          delete next[threadId];
          return next;
        });
      });
  };

  const cancelRename = () => {
    renameCancelledRef.current = true;
    setRenamingThreadId(null);
  };

  const deleteThreadOptimistically = (threadId: string) => {
    setPendingDeleteIds((prev) => new Set(prev).add(threadId));
    void deleteThread(threadId)
      .catch(() => {})
      .finally(() => {
        setPendingDeleteIds((prev) => {
          if (!prev.has(threadId)) return prev;
          const next = new Set(prev);
          next.delete(threadId);
          return next;
        });
      });
  };

  return (
    <>
      {displayThreads.length > 5 && (
        <div className="shrink-0 border-b border-border/50 p-2">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              placeholder="Search chats…"
              className="h-7 pl-7 pr-7 text-xs bg-muted/40"
            />
            {threadSearch && (
              <button
                type="button"
                onClick={() => setThreadSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>
        </div>
      )}
      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-0.5 p-1.5">
          {loading && displayThreads.length === 0 && (
            <div
              className="flex flex-col gap-1.5 px-1 py-1"
              role="status"
              aria-label="Loading chats"
            >
              {stalled && (
                <div className="flex items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
                  <span>Taking longer than usual…</span>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="font-medium text-foreground underline underline-offset-2"
                  >
                    Retry
                  </button>
                </div>
              )}
              {[72, 56, 84, 64, 78, 50].map((w, i) => (
                <Skeleton
                  key={i}
                  className="skeleton-shimmer h-7 animate-none"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          )}
          {filteredThreads.length === 0 && !loading && (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground">
              {threadSearch ? "No matching chats" : "No chats yet"}
            </div>
          )}
          {filteredThreads.map((t) => (
            <div key={t._id} className="group/thread flex items-center gap-1">
              {renamingThreadId === t._id ? (
                <input
                  autoFocus
                  value={renameDraft}
                  aria-label="Thread title"
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={commitRename}
                  onFocus={(e) => e.currentTarget.select()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitRename();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      cancelRename();
                    }
                  }}
                  className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSelect(t._id)}
                    onDoubleClick={() => startRename(t._id, t.title)}
                    className={cn(
                      "min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent",
                      activeThreadId === t._id && "bg-accent font-medium"
                    )}
                  >
                    {t.title || "New chat"}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          aria-label="Thread actions"
                          className="flex size-7 shrink-0 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:opacity-100 data-popup-open:opacity-100 md:opacity-0 md:group-hover/thread:opacity-100"
                        >
                          <DotsThreeVerticalIcon className="size-4" />
                        </button>
                      }
                    />
                    <DropdownMenuContent align="end" className="min-w-40">
                      <DropdownMenuItem onClick={() => startRename(t._id, t.title)}>
                        <PencilSimpleIcon className="size-3.5" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          if (t._id === activeThreadId) onActiveThreadDeleted();
                          deleteThreadOptimistically(t._id);
                        }}
                      >
                        <TrashIcon className="size-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </>
  );
}
