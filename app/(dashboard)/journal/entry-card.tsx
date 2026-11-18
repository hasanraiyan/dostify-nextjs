"use client";

import * as React from "react";
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { deleteEntry, updateEntry } from "./actions";

/** Entries longer than this are clamped until "Aur padho" is pressed. */
const CLAMP_CHARS = 300;

export interface EntryCardData {
  id: string;
  text: string;
  /** Pre-formatted on the server so server and client always agree. */
  time: string;
}

export function EntryCard({ entry }: { entry: EntryCardData }) {
  const [mode, setMode] = React.useState<"view" | "edit" | "confirmDelete">("view");
  const [expanded, setExpanded] = React.useState(false);
  const long = entry.text.length > CLAMP_CHARS;

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
            <p
              className={`whitespace-pre-wrap break-words text-sm ${
                long && !expanded ? "line-clamp-6" : ""
              }`}
            >
              {entry.text}
            </p>
            {long && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="self-start text-xs font-medium text-primary underline-offset-2 hover:underline"
              >
                {expanded ? "Kam dikhao" : "Aur padho"}
              </button>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{entry.time}</span>
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
