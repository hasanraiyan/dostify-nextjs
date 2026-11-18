"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowSquareOutIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  NotebookIcon,
  PushPinIcon,
  TrashIcon,
  UserIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { buildToolRenderProps, type PersonaToolCall } from "@personaai/react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { dayLabel, timeLabel } from "@/lib/dostify/dates";
import { cn } from "@/lib/utils";

/**
 * Chat cards for Dostify's own MCP tools (`manage_journal`, `get_profile`).
 *
 * Persona names an MCP tool "<connector>__<tool>", and we don't control the
 * connector part, so tools are recognised by their ending. `get_profile` is a
 * common name, so it is only drawn when the result has our shape; anything
 * unrecognised falls back to the normal tool card.
 */

// ── parsing ─────────────────────────────────────────────────────────────────

interface Entry {
  id: string;
  title: string;
  body: string;
  mood: number | null;
  pinned: boolean;
  createdAt: string;
}

type JournalArgs = {
  action?: string;
  id?: string;
  title?: string;
  body?: string;
  mood?: number | null;
  pinned?: boolean;
  query?: string;
  limit?: number;
  since?: string;
  until?: string;
};

const baseName = (toolName: string) => toolName.split("__").pop() ?? toolName;

/** The result is JSON text, sometimes wrapped as an MCP `{ content: [{ text }] }` envelope. */
function parseResult(result: string | undefined): unknown {
  if (!result) return undefined;
  try {
    const value = JSON.parse(result);
    const text = value?.content?.[0]?.text;
    if (Array.isArray(value?.content) && typeof text === "string") {
      try {
        return JSON.parse(text);
      } catch {
        return text; // a plain-text error message
      }
    }
    return value;
  } catch {
    return result;
  }
}

const isEntry = (v: unknown): v is Entry =>
  !!v && typeof v === "object" && typeof (v as Entry).id === "string" && typeof (v as Entry).title === "string";

// ── shared pieces ───────────────────────────────────────────────────────────

const CARD = "w-full max-w-md";

function Header({ icon: HeaderIcon, children, tone }: { icon: React.ElementType; children: React.ReactNode; tone?: "danger" | "success" }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium",
        tone === "danger" ? "text-destructive" : tone === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
      )}
    >
      <HeaderIcon weight="fill" className="size-3.5 shrink-0" />
      {children}
    </div>
  );
}

function Loading({ label, icon }: { label: string; icon: React.ElementType }) {
  return (
    <Card size="sm" className={CARD}>
      <CardContent className="flex flex-col gap-2" role="status" aria-label={label}>
        <Header icon={icon}>{label}</Header>
        <Skeleton className="skeleton-shimmer h-9 animate-none rounded-xl" />
        <Skeleton className="skeleton-shimmer h-9 w-2/3 animate-none rounded-xl" />
      </CardContent>
    </Card>
  );
}

function Failure({ message }: { message: string }) {
  return (
    <Card size="sm" className={cn(CARD, "border-destructive/30")}>
      <CardContent>
        <Header icon={WarningCircleIcon} tone="danger">
          {message}
        </Header>
      </CardContent>
    </Card>
  );
}

function when(createdAt: string) {
  const d = new Date(createdAt);
  return Number.isNaN(d.getTime()) ? "" : `${dayLabel(d)}, ${timeLabel(d)}`;
}

function EntryRow({ entry }: { entry: Entry }) {
  return (
    <li>
      <Link
        href={`/journal/${entry.id}`}
        className="flex flex-col gap-0.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-muted"
      >
        <span className="flex items-center gap-1.5">
          {entry.pinned && <PushPinIcon weight="fill" className="size-3 shrink-0 text-primary" />}
          <span className="truncate text-sm font-semibold">{entry.title || "Untitled"}</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="shrink-0">{when(entry.createdAt)}</span>
          {entry.body && <span className="truncate">{entry.body.replace(/\s+/g, " ")}</span>}
        </span>
      </Link>
    </li>
  );
}

// ── manage_journal ──────────────────────────────────────────────────────────

const MAX_ROWS = 5;

const LOADING_LABEL: Record<string, string> = {
  list: "Reading your journal…",
  search: "Searching your journal…",
  get: "Opening entry…",
  create: "Saving to your journal…",
  update: "Updating entry…",
  delete: "Deleting entry…",
};

function describeFilters(a: JournalArgs) {
  const parts: string[] = [];
  if (a.pinned) parts.push("pinned");
  if (a.since) parts.push(`since ${dayLabel(new Date(a.since))}`);
  if (a.until) parts.push(`before ${dayLabel(new Date(a.until))}`);
  return parts.join(" · ");
}

function EntryResult({ label, entry, changed }: { label: string; entry: Entry; changed?: string[] }) {
  return (
    <Card size="sm" className={CARD}>
      <CardContent className="flex flex-col gap-2">
        <Header icon={CheckCircleIcon} tone="success">
          {label}
        </Header>
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5">
            {entry.pinned && <PushPinIcon weight="fill" className="size-3.5 shrink-0 text-primary" />}
            <span className="text-sm font-semibold break-words">{entry.title || "Untitled"}</span>
          </span>
          {entry.body && (
            <span className="line-clamp-3 text-sm break-words whitespace-pre-wrap text-muted-foreground">
              {entry.body}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{when(entry.createdAt)}</span>
        </div>
        {changed && changed.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {changed.map((c) => (
              <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {c}
              </span>
            ))}
          </div>
        )}
        <Link
          href={`/journal/${entry.id}`}
          className="flex items-center gap-1 self-start text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          Open entry <ArrowSquareOutIcon className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

/** Plain function (not a component) so returning null really means "not mine". */
function journalCard(call: PersonaToolCall): React.ReactNode {
  const props = buildToolRenderProps(call);
  const args = props.args as JournalArgs;
  const action = args.action ?? "";

  if (props.status !== "complete") {
    return <Loading label={LOADING_LABEL[action] ?? "Working on your journal…"} icon={NotebookIcon} />;
  }

  const data = parseResult(props.result);
  if (action === "delete" && props.isError && typeof data === "string" && /confirm/i.test(data)) {
    // The tool refused until the user agrees; not a failure to show in red.
    return (
      <Card size="sm" className={CARD}>
        <CardContent>
          <Header icon={TrashIcon}>Waiting for your confirmation before deleting</Header>
        </CardContent>
      </Card>
    );
  }
  if (props.isError || typeof data === "string") {
    return <Failure message={typeof data === "string" && data ? data : "Couldn't complete that journal action."} />;
  }

  switch (action) {
    case "list":
    case "search": {
      const entries = ((data as { entries?: unknown[] })?.entries ?? []).filter(isEntry);
      const searching = action === "search";
      const filters = describeFilters(args);
      const shown = entries.slice(0, MAX_ROWS);
      return (
        <Card size="sm" className={CARD}>
          <CardContent className="flex flex-col gap-1.5">
            <Header icon={searching ? MagnifyingGlassIcon : NotebookIcon}>
              {searching ? `Search “${args.query ?? ""}”` : "Journal"} ·{" "}
              {entries.length === 0 ? "no entries" : `${entries.length} ${entries.length === 1 ? "entry" : searching ? "results" : "entries"}`}
              {filters && <span className="font-normal"> · {filters}</span>}
            </Header>
            {shown.length > 0 && (
              <ul className="-mx-1 flex flex-col">{shown.map((e) => <EntryRow key={e.id} entry={e} />)}</ul>
            )}
            {entries.length > MAX_ROWS && (
              <Link href="/journal" className="px-1 text-xs font-medium text-primary underline-offset-2 hover:underline">
                +{entries.length - MAX_ROWS} more in your journal
              </Link>
            )}
          </CardContent>
        </Card>
      );
    }
    case "get":
      return isEntry(data) ? <EntryResult label="Journal entry" entry={data} /> : null;
    case "create":
      return isEntry(data) ? <EntryResult label="Saved to your journal" entry={data} /> : null;
    case "update": {
      if (!isEntry(data)) return null;
      const changed = [
        args.title !== undefined && "title",
        args.body !== undefined && "text",
        args.mood !== undefined && "mood",
        args.pinned !== undefined && (args.pinned ? "pinned" : "unpinned"),
      ].filter((c): c is string => typeof c === "string");
      return <EntryResult label="Entry updated" entry={data} changed={changed} />;
    }
    case "delete":
      return (
        <Card size="sm" className={CARD}>
          <CardContent>
            <Header icon={TrashIcon}>Entry deleted</Header>
          </CardContent>
        </Card>
      );
    default:
      return null;
  }
}

// ── get_profile ─────────────────────────────────────────────────────────────

interface ProfileData {
  name: string | null;
  memberSince: string;
  journalEntries: number;
}

const isProfile = (v: unknown): v is ProfileData =>
  !!v && typeof v === "object" && "memberSince" in v && "journalEntries" in v;

function profileCard(call: PersonaToolCall): React.ReactNode {
  const props = buildToolRenderProps(call);
  if (props.status !== "complete") return <Loading label="Looking up your profile…" icon={UserIcon} />;
  if (props.isError) return <Failure message="Couldn't load your profile." />;

  const data = parseResult(props.result);
  if (!isProfile(data)) return null; // someone else's get_profile: use the normal card

  const name = data.name || "Friend";
  const since = new Date(data.memberSince);
  return (
    <Card size="sm" className={CARD}>
      <CardContent className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-base font-semibold text-primary">
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">
            {data.journalEntries} {data.journalEntries === 1 ? "journal entry" : "journal entries"}
            {!Number.isNaN(since.getTime()) &&
              ` · member since ${since.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", month: "short", year: "numeric" })}`}
          </p>
        </div>
        <Link
          href="/profile"
          aria-label="Open profile"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowSquareOutIcon className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

// ── entry point ─────────────────────────────────────────────────────────────

/** A card for one of our tools, or null so the caller falls back to the normal tool card. */
export function renderDostifyTool(call: PersonaToolCall): React.ReactNode {
  switch (baseName(call.toolName)) {
    case "manage_journal":
      return journalCard(call);
    case "get_profile":
      return profileCard(call);
    default:
      return null;
  }
}
