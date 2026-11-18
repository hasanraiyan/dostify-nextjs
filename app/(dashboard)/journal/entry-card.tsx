"use client";

import * as React from "react";
import { PencilSimpleIcon, PushPinIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { deleteEntry, togglePin, updateEntry } from "./actions";

export interface EntryCardData {
  id: string;
  text: string;
  pinned: boolean;
  /** Pre-formatted on the server so server and client always agree. */
  time: string;
}

/** Notes-style split: first line is the title, the rest is the body. */
function splitEntry(text: string) {
  const lines = text.trim().split("\n");
  const title = lines[0] ?? "";
  const body = lines.slice(1).join("\n").trim();
  return { title, body };
}

export function EntryCard({ entry }: { entry: EntryCardData }) {
  const [mode, setMode] = React.useState<"view" | "edit" | "confirmDelete">("view");
  const [expanded, setExpanded] = React.useState(false);
  const { title, body } = splitEntry(entry.text);
  // A card can be opened if there's more than the title, or the title itself is long.
  const expandable = body.length > 0 || title.length > 80;

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        {mode === "edit" ? (
          <form
            action={async (formData) => {
              await updateEntry(formData);
              setMode("view");
            }}
            className="flex flex-col gap-2"
          >
            <input type="hidden" name="id" value={entry.id} />
            <Textarea
              name="text"
              required
              maxLength={5000}
              defaultValue={entry.text}
              autoFocus
              aria-label="Edit entry"
              className="min-h-24 rounded-xl p-3 text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" className="rounded-full" onClick={() => setMode("view")}>
                Cancel
              </Button>
              <Button type="submit" className="rounded-full">
                Save
              </Button>
            </div>
          </form>
        ) : (
          <>
            <button
              type="button"
              disabled={!expandable}
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expandable ? expanded : undefined}
              className="flex flex-col gap-0.5 text-left disabled:cursor-default"
            >
              <span
                className={`text-sm font-semibold break-words ${expanded ? "" : "line-clamp-1"}`}
              >
                {title}
              </span>
              {body && (
                <span
                  className={`text-sm break-words whitespace-pre-wrap text-muted-foreground ${
                    expanded ? "" : "line-clamp-2"
                  }`}
                >
                  {body}
                </span>
              )}
            </button>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {entry.pinned && <PushPinIcon weight="fill" className="size-3 text-primary" />}
                {entry.time}
              </span>
              {mode === "confirmDelete" ? (
                <form action={deleteEntry} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={entry.id} />
                  <span className="text-xs text-muted-foreground">Delete kar du?</span>
                  <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => setMode("view")}>
                    Nahi
                  </Button>
                  <Button type="submit" size="sm" variant="destructive" className="rounded-full">
                    Haan
                  </Button>
                </form>
              ) : (
                <div className="flex gap-1">
                  <form action={togglePin}>
                    <input type="hidden" name="id" value={entry.id} />
                    <input type="hidden" name="pinned" value={String(!entry.pinned)} />
                    <Button
                      type="submit"
                      size="icon-sm"
                      variant="ghost"
                      className="rounded-full"
                      aria-label={entry.pinned ? "Unpin entry" : "Pin entry"}
                    >
                      <PushPinIcon weight={entry.pinned ? "fill" : "regular"} />
                    </Button>
                  </form>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-full"
                    aria-label="Edit entry"
                    onClick={() => setMode("edit")}
                  >
                    <PencilSimpleIcon />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-full"
                    aria-label="Delete entry"
                    onClick={() => setMode("confirmDelete")}
                  >
                    <TrashIcon />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
