"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, PushPinIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { deleteEntry, saveEntry, togglePin } from "./actions";
import { joinText, splitText } from "./entry-text";

export interface EditorEntry {
  /** null for a brand-new entry: it's created on the first autosave. */
  id: string | null;
  text: string;
  pinned: boolean;
  createdLabel: string | null;
}

type Status = "idle" | "saving" | "saved" | "error";
const AUTOSAVE_MS = 800;

/** Notes-style editor: title and body are borderless, and it saves as you type. */
export function Editor({ entry }: { entry: EditorEntry }) {
  const router = useRouter();
  const initial = React.useMemo(() => splitText(entry.text), [entry.text]);
  const [title, setTitle] = React.useState(initial.title);
  const [body, setBody] = React.useState(initial.body);
  const [pinned, setPinned] = React.useState(entry.pinned);
  const [hasId, setHasId] = React.useState(entry.id !== null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  const idRef = React.useRef(entry.id);
  const latest = React.useRef({ title: initial.title, body: initial.body });
  const dirty = React.useRef(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Saves run one after another so a slow one can't overwrite a newer one.
  const queue = React.useRef<Promise<void>>(Promise.resolve());
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  const flush = React.useCallback(() => {
    if (!dirty.current) return;
    dirty.current = false;
    const value = joinText(latest.current.title, latest.current.body);
    queue.current = queue.current.then(async () => {
      if (!value.trim()) {
        setStatus("idle");
        return;
      }
      setStatus("saving");
      try {
        const res = await saveEntry(idRef.current, value);
        if ("error" in res) {
          setStatus("error");
          return;
        }
        if (!idRef.current) {
          idRef.current = res.id;
          setHasId(true);
          // Point the URL at the new entry without remounting (keeps focus).
          window.history.replaceState(null, "", `/journal/${res.id}`);
        }
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    });
  }, []);

  const change = (nextTitle: string, nextBody: string) => {
    latest.current = { title: nextTitle, body: nextBody };
    dirty.current = true;
    setStatus("idle");
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, AUTOSAVE_MS);
  };

  // Leaving the editor (or switching entries) saves anything still pending.
  React.useEffect(
    () => () => {
      clearTimeout(timer.current);
      flush();
    },
    [flush],
  );

  const onPin = async () => {
    if (!idRef.current) return;
    const next = !pinned;
    setPinned(next);
    await togglePin(idRef.current, next);
  };

  const onDelete = async () => {
    dirty.current = false;
    clearTimeout(timer.current);
    if (idRef.current) await deleteEntry(idRef.current);
    router.push("/journal");
  };

  const statusText =
    status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Couldn't save" : "";

  return (
    <>
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Link
          href="/journal"
          aria-label="Back to list"
          className="flex size-8 items-center justify-center rounded-full hover:bg-muted md:hidden"
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {entry.createdLabel ?? "New entry"}
          {statusText && <span aria-live="polite"> · {statusText}</span>}
        </span>
        {confirmingDelete ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Delete this entry?</span>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setConfirmingDelete(false)}>
              No
            </Button>
            <Button size="sm" variant="destructive" className="rounded-full" onClick={onDelete}>
              Delete
            </Button>
          </div>
        ) : (
          <>
            <Button
              size="icon-sm"
              variant="ghost"
              className="rounded-full"
              disabled={!hasId}
              aria-label={pinned ? "Unpin entry" : "Pin entry"}
              onClick={onPin}
            >
              <PushPinIcon weight={pinned ? "fill" : "regular"} className={pinned ? "text-primary" : undefined} />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className="rounded-full"
              aria-label="Delete entry"
              onClick={() => (hasId ? setConfirmingDelete(true) : router.push("/journal"))}
            >
              <TrashIcon />
            </Button>
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-5 md:px-8">
        <input
          value={title}
          autoFocus={entry.id === null}
          maxLength={200}
          placeholder="Title"
          aria-label="Title"
          onChange={(e) => {
            setTitle(e.target.value);
            change(e.target.value, body);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              bodyRef.current?.focus();
            }
          }}
          className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-muted-foreground/60"
        />
        <textarea
          ref={bodyRef}
          value={body}
          maxLength={5000}
          placeholder="Write something…"
          aria-label="Entry"
          onChange={(e) => {
            setBody(e.target.value);
            change(title, e.target.value);
          }}
          className="min-h-64 w-full flex-1 resize-none bg-transparent text-base leading-relaxed outline-none placeholder:text-muted-foreground/60"
        />
      </div>
    </>
  );
}
