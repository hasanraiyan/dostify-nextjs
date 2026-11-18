"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SvgPreview } from "@/components/svg/svg-preview";
import { MessageMarkdown } from "./message-markdown";
import type { SearchResultItem } from "./tool-cards/search-citation-card";

/**
 * Splits assistant message content on ```svg fenced blocks and renders each
 * SVG block as an actual inline <svg> element (dangerouslySetInnerHTML of the
 * SVG markup inside a sandboxed wrapper). Prose segments between SVG blocks
 * are passed through MessageMarkdown as normal.
 *
 * Security: only the content inside the <svg>…</svg> tags is injected; the
 * outer wrapper is a plain <div> we control. Script tags and event-handler
 * attributes inside SVGs are stripped before rendering.
 */

// Matches a full ```svg … ``` fence (non-greedy, dotAll).
const SVG_FENCE_RE = /```svg\s*\n([\s\S]*?)```/g;
const FENCE_MARKER = "```";

interface Segment {
  type: "markdown" | "svg";
  content: string;
}

interface SplitResult {
  segments: Segment[];
  /** True while the text ends inside a ```svg fence that is still streaming. */
  pendingSvg: boolean;
}

/**
 * While a fence is streaming in, its closing ``` hasn't arrived yet. An odd
 * number of fence markers in the tail means the last one is unclosed; return
 * it so we can swap the raw code for a skeleton.
 */
function findUnclosedFence(tail: string): { index: number; info: string } | null {
  const markerCount = tail.split(FENCE_MARKER).length - 1;
  if (markerCount % 2 === 0) return null;

  const index = tail.lastIndexOf(FENCE_MARKER);
  const infoLine = tail
    .slice(index + FENCE_MARKER.length)
    .split("\n", 1)[0]
    .trim()
    .toLowerCase();
  return { index, info: infoLine.split(/[ \t]/, 1)[0] };
}

function splitSegments(text: string, detectPending: boolean): SplitResult {
  const segments: Segment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(SVG_FENCE_RE)) {
    const fenceStart = match.index!;
    // Prose before this fence
    if (fenceStart > lastIndex) {
      const prose = text.slice(lastIndex, fenceStart).trim();
      if (prose) segments.push({ type: "markdown", content: prose });
    }
    segments.push({ type: "svg", content: match[1].trim() });
    lastIndex = fenceStart + match[0].length;
  }

  const tail = text.slice(lastIndex);
  const unclosed = detectPending ? findUnclosedFence(tail) : null;
  // "s" / "sv" / "svg" — still typing the info string out.
  const pendingIndex =
    unclosed && "svg".startsWith(unclosed.info) ? unclosed.index : null;

  if (pendingIndex !== null) {
    // Drop the fence content: it's half-written SVG source, not prose.
    const prose = tail.slice(0, pendingIndex).trim();
    if (prose) segments.push({ type: "markdown", content: prose });
  } else {
    const prose = tail.trim();
    if (prose) segments.push({ type: "markdown", content: prose });
  }

  const pendingSvg = pendingIndex !== null;

  if (segments.length === 0 && !pendingSvg) {
    segments.push({ type: "markdown", content: text });
  }

  return { segments, pendingSvg };
}

/**
 * Renders the SVG bare — no card, border, or caption — sized to the message
 * column. Normalization (viewBox present, fixed width/height removed) lives in
 * SvgPreview so chat and the file explorer size SVGs the same fluid way.
 */
function InlineSvg({ raw }: { raw: string }) {
  return (
    <SvgPreview
      source={raw}
      className="my-3 flex justify-center [&>svg]:max-h-[480px]"
    />
  );
}

/**
 * Placeholder for an SVG that's still streaming in: a big shimmering
 * rectangle roughly the size of the final drawing, instead of raw markup.
 */
function SvgSkeleton() {
  return (
    <div className="my-3 w-full" role="img" aria-label="Generating image">
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

/**
 * Drop-in replacement for `<MessageMarkdown content={…} />` on assistant
 * messages. Detects ```svg fences, renders them as real SVGs, and passes
 * everything else to the normal Streamdown markdown renderer.
 */
function MessageContentWithSvg({
  content,
  className,
  streaming = false,
  sources,
}: {
  content: string;
  className?: string;
  /** While true, an unclosed ```svg fence renders as a skeleton, not code. */
  streaming?: boolean;
  /** Optional web search sources for interactive inline [1] citations */
  sources?: SearchResultItem[];
}) {
  const { segments, pendingSvg } = React.useMemo(
    () => splitSegments(content, streaming),
    [content, streaming]
  );

  // Fast path: no SVG blocks at all — avoid extra elements
  if (!pendingSvg && segments.length === 1 && segments[0].type === "markdown") {
    return <MessageMarkdown content={content} className={className} sources={sources} />;
  }

  return (
    <div className="flex flex-col gap-1">
      {segments.map((seg, i) =>
        seg.type === "svg" ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional
          <InlineSvg key={i} raw={seg.content} />
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional
          <MessageMarkdown key={i} content={seg.content} className={className} sources={sources} />
        )
      )}
      {pendingSvg && <SvgSkeleton />}
    </div>
  );
}

export { MessageContentWithSvg };
