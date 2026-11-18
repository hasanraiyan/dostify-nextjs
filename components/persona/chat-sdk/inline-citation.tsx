"use client";

import * as React from "react";
import {
  GlobeIcon,
  ShieldCheckIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import {
  formatDisplayDomain,
  type SearchResultItem,
  parseSearchResults,
} from "./tool-cards/search-citation-card";
import { isSearchTool } from "./tool-cards/utils";

/**
 * Extracts all unique search result items from a list of tool calls in a message.
 */
export function extractAllSearchSources(
  toolCalls?: Array<{ name?: string; toolName?: string; result?: string; args?: string }>
): SearchResultItem[] {
  if (!toolCalls || !toolCalls.length) return [];
  const allSources: SearchResultItem[] = [];
  const seenUrls = new Set<string>();

  for (const tc of toolCalls) {
    const name = tc.name || tc.toolName;
    if (isSearchTool(name)) {
      const { results } = parseSearchResults(tc.result, tc.args);
      for (const res of results) {
        if (res.url && !seenUrls.has(res.url)) {
          seenUrls.add(res.url);
          allSources.push(res);
        }
      }
    }
  }

  return allSources;
}

/**
 * Transforms plain-text citations (e.g. `[1]`, `[1, 2]`, `【1†source】`) into
 * markdown links `[1](#cite-1)` so Streamdown parses them as anchors for InlineCitation.
 * Preserves fenced code blocks and inline code completely untouched.
 */
export function transformInlineCitations(text: string, sourcesCount: number): string {
  if (!text || sourcesCount <= 0) return text;

  // Split on code fences and inline code to preserve them unmodified
  const parts = text.split(/(```[\s\S]*?```|`[^`\n]+`)/g);
  return parts
    .map((part, idx) => {
      // Odd indices are code blocks or inline code
      if (idx % 2 === 1) return part;

      let s = part;

      // 1. Multiple citations: [1, 2] or [1, 2, 3]
      s = s.replace(/(?<!\[)\[(\d+(?:\s*,\s*\d+)+)\](?!\()/g, (_match, nums: string) => {
        return nums
          .split(",")
          .map((n) => {
            const num = n.trim();
            const val = parseInt(num, 10);
            return val >= 1 && val <= sourcesCount ? `[${num}](#cite-${num})` : `[${num}]`;
          })
          .join(" ");
      });

      // 2. Single citation: [1] (not followed by '(')
      s = s.replace(/(?<!\[)\[(\d+)\](?!\()/g, (match, num: string) => {
        const val = parseInt(num, 10);
        return val >= 1 && val <= sourcesCount ? `[${num}](#cite-${num})` : match;
      });

      // 3. Retrieval bracket citations: 【1†source】 or 【1】
      s = s.replace(/【(\d+)(?:†source)?】/g, (match, num: string) => {
        const val = parseInt(num, 10);
        return val >= 1 && val <= sourcesCount ? `[${num}](#cite-${num})` : match;
      });

      return s;
    })
    .join("");
}

export function InlineCitation({
  href,
  source,
  index,
  children,
}: {
  href?: string;
  source?: SearchResultItem;
  index?: number | string;
  children?: React.ReactNode;
}) {
  const targetUrl = source?.url || (href && !href.startsWith("#cite-") ? href : undefined);
  const displayIndex = index ?? children ?? "1";
  const domain = source?.domain || (targetUrl ? formatDisplayDomain(targetUrl) : "");

  return (
    <HoverCard>
      <HoverCardTrigger
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        delay={100}
        closeDelay={150}
        className="group/cite inline-flex items-center justify-center align-baseline mx-0.5 px-1.5 min-w-4 h-4 rounded-full bg-muted/80 hover:bg-muted text-[10px] font-semibold text-muted-foreground hover:text-foreground border border-border/50 hover:border-border transition-all cursor-pointer select-none no-underline leading-none hover:shadow-2xs"
      >
        <span>{displayIndex}</span>
      </HoverCardTrigger>

      <HoverCardContent
        side="top"
        align="center"
        sideOffset={6}
        className="w-72 p-3 rounded-xl border border-border/60 bg-popover/95 text-popover-foreground shadow-xl backdrop-blur-md"
      >
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group/card flex flex-col gap-1.5 text-left no-underline cursor-pointer select-none"
        >
          {/* Top: Favicon + Domain + Shield + Arrow */}
          <div className="flex items-center justify-between gap-1 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="flex size-3.5 shrink-0 items-center justify-center overflow-hidden rounded-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain || "")}&sz=32`}
                  alt=""
                  className="size-3 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <GlobeIcon className="hidden size-3 text-muted-foreground" />
              </div>
              <span className="truncate font-medium text-foreground/80">
                {formatDisplayDomain(domain)}
              </span>
              <ShieldCheckIcon className="size-3 shrink-0 text-muted-foreground/60" />
            </div>
            <ArrowSquareOutIcon className="size-3 shrink-0 text-muted-foreground/60 group-hover/card:text-primary transition-colors" />
          </div>

          {/* Title */}
          <div className="font-medium text-xs text-foreground group-hover/card:text-primary transition-colors line-clamp-2 leading-snug">
            {source?.title || domain || "Web Source"}
          </div>

          {/* Snippet / Excerpt */}
          {source?.snippet && (
            <div className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed mt-0.5">
              {source.snippet}
            </div>
          )}
        </a>
      </HoverCardContent>
    </HoverCard>
  );
}

export function MarkdownLink({
  href,
  children,
  sources,
  ...rest
}: React.ComponentProps<"a"> & { sources?: SearchResultItem[] }) {
  // Check if this anchor corresponds to an inline citation
  const citeMatch = href?.match(/^#cite-(\d+)$/);
  const textStr = typeof children === "string" ? children.trim() : "";
  const numMatch = textStr.match(/^\[?(\d+)\]?$/);

  let sourceIndex = -1;
  if (citeMatch) {
    sourceIndex = parseInt(citeMatch[1], 10) - 1;
  } else if (numMatch && sources?.length) {
    sourceIndex = parseInt(numMatch[1], 10) - 1;
  } else if (href && sources?.length) {
    sourceIndex = sources.findIndex((s) => s.url === href);
  }

  if (sourceIndex >= 0 && sources && sources[sourceIndex]) {
    return (
      <InlineCitation
        index={sourceIndex + 1}
        source={sources[sourceIndex]}
        href={sources[sourceIndex].url}
      />
    );
  }

  if (citeMatch) {
    return (
      <InlineCitation index={citeMatch[1]} href={href}>
        {children}
      </InlineCitation>
    );
  }

  // Regular markdown hyperlink
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
      {...rest}
    >
      {children}
    </a>
  );
}
