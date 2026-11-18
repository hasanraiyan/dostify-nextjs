"use client";

import * as React from "react";
import {
  GlobeIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { tryParseJson } from "./utils";
import type { PersonaToolCall } from "@personaai/react";

export interface SearchResultItem {
  title: string;
  url: string;
  snippet?: string;
  domain: string;
}

export function formatDisplayDomain(urlOrDomain: string): string {
  try {
    let hostname = urlOrDomain;
    if (urlOrDomain.startsWith("http://") || urlOrDomain.startsWith("https://")) {
      hostname = new URL(urlOrDomain).hostname;
    }
    // Remove www.
    hostname = hostname.replace(/^www\./, "");
    // Remove common generic top-level domains: e.g. .com, .org, .net, .io, etc.
    // developers.google.com -> developers.google, theconversation.com -> theconversation, wired.com -> wired
    const cleaned = hostname.replace(/\.(com|org|net|io|edu|gov|app|dev|co)$/i, "");
    return cleaned || hostname;
  } catch {
    return urlOrDomain;
  }
}

function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return urlStr;
  }
}

export function parseSearchResults(
  rawResult: unknown,
  rawArgs: unknown
): { query: string; results: SearchResultItem[] } {
  let query = "";
  if (rawArgs) {
    const argsObj =
      typeof rawArgs === "string"
        ? (tryParseJson(rawArgs) as Record<string, unknown>)
        : (rawArgs as Record<string, unknown>);
    if (argsObj?.query && typeof argsObj.query === "string") {
      query = argsObj.query;
    }
  }

  const results: SearchResultItem[] = [];

  if (!rawResult) {
    return { query, results };
  }

  const parsed = typeof rawResult === "string" ? tryParseJson(rawResult) : rawResult;

  // Case 1: Object with results array: { query, results: [...] } or array of results
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.query === "string" && !query) {
      query = obj.query;
    }
    const list = Array.isArray(obj.results)
      ? obj.results
      : Array.isArray(parsed)
        ? parsed
        : null;

    if (list) {
      for (const item of list) {
        if (item && typeof item === "object") {
          const it = item as Record<string, unknown>;
          const url =
            (typeof it.url === "string"
              ? it.url
              : typeof it.link === "string"
                ? it.link
                : "") || "";
          const title =
            (typeof it.title === "string"
              ? it.title
              : typeof it.name === "string"
                ? it.name
                : "") || extractDomain(url) || "Web Page";
          const snippet =
            (typeof it.content === "string"
              ? it.content
              : typeof it.snippet === "string"
                ? it.snippet
                : "") || "";

          if (url) {
            results.push({
              title,
              url,
              snippet,
              domain: extractDomain(url),
            });
          }
        }
      }
      if (results.length > 0) return { query, results };
    }
  }

  // Case 2: String containing URLs or markdown links
  if (typeof rawResult === "string") {
    const urlRegex = /(https?:\/\/[^\s"'<>\)]+)/g;
    const lines = rawResult.split("\n");
    let currentTitle = "";
    for (const line of lines) {
      const trimmed = line.trim();
      const match = urlRegex.exec(trimmed);
      if (match) {
        const url = match[1];
        const title = currentTitle || extractDomain(url);
        results.push({
          title,
          url,
          domain: extractDomain(url),
        });
        currentTitle = "";
      } else if (trimmed.length > 3 && !trimmed.startsWith("{") && !trimmed.startsWith("[")) {
        currentTitle = trimmed.replace(/^[-*•\d.]+\s*/, "");
      }
      urlRegex.lastIndex = 0;
    }
  }

  return { query, results };
}

export function SearchCitationCard({
  toolCall,
  isPending,
  defaultOpen = true,
}: {
  toolCall: PersonaToolCall | { toolName?: string; name?: string; args?: string; result?: string };
  isPending?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [showAll, setShowAll] = React.useState(false);

  const { query, results } = React.useMemo(
    () => parseSearchResults(toolCall.result, toolCall.args),
    [toolCall.result, toolCall.args]
  );

  const visibleResults = showAll ? results : results.slice(0, 3);
  const hasMore = results.length > 3;

  return (
    <div className="flex w-full flex-col text-foreground transition-all">
      {/* Header Bar - Frameless & Flush */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group/btn flex items-center py-0.5 text-left cursor-pointer transition-colors text-foreground select-none"
      >
        <span className="text-xs font-medium text-foreground">
          {isPending ? "Searching the web" : "Searched the web"}
        </span>
      </button>

      {/* Expanded Content - Indented Under Header, Zero Left Padding on Items */}
      {open && (
        <div className="flex flex-col pl-5 mt-1 space-y-1">
          {/* Query Row - Aligned with Favicons */}
          {query && (
            <div className="flex items-center gap-2.5 py-0.5 text-xs text-muted-foreground">
              <div className="flex size-4 shrink-0 items-center justify-center">
                <MagnifyingGlassIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
              </div>
              <span className="truncate font-normal text-foreground/85">{query}</span>
            </div>
          )}

          {/* Pending Skeleton Loader */}
          {isPending && results.length === 0 && (
            <div className="flex flex-col gap-1.5 py-1">
              <div className="h-3 w-4/5 animate-pulse rounded-xs bg-muted/60" />
              <div className="h-3 w-3/5 animate-pulse rounded-xs bg-muted/40" />
            </div>
          )}

          {/* Search Result Items - Zero Left Padding Before Favicon */}
          {results.length > 0 && (
            <div className="flex flex-col">
              {visibleResults.map((item, idx) => (
                <a
                  key={`${item.url}-${idx}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/item flex items-center gap-2.5 py-1 text-xs text-foreground/90 transition-colors hover:text-foreground"
                  title={item.title}
                >
                  {/* Favicon or fallback - starts completely flush with zero left padding */}
                  <div className="flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.domain || "")}&sz=32`}
                      alt=""
                      className="size-3.5 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                    <GlobeIcon className="hidden size-3.5 text-muted-foreground" />
                  </div>

                  {/* Title */}
                  <span className="min-w-0 flex-1 truncate font-normal group-hover/item:text-primary transition-colors">
                    {item.title}
                  </span>

                  {/* Domain Tag & Shield Icon */}
                  <span className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground/75">
                    <span>{formatDisplayDomain(item.domain || item.url)}</span>
                    <ShieldCheckIcon className="size-3 shrink-0 text-muted-foreground/60 group-hover/item:text-primary/70 transition-colors" />
                  </span>
                </a>
              ))}

              {/* Show more / Show less toggle */}
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  className="pt-0.5 flex items-center py-1 text-xs font-normal text-muted-foreground transition-colors hover:text-foreground cursor-pointer select-none"
                >
                  <span>{showAll ? "Show less" : `+${results.length - 3} more`}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
