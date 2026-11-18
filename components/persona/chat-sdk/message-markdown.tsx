"use client";

import * as React from "react";
import { Streamdown } from "streamdown";
import remarkGfm from "remark-gfm";
import { code } from "@streamdown/code";
import { cn } from "@/lib/utils";
import {
  MarkdownLink,
  transformInlineCitations,
} from "./inline-citation";
import type { SearchResultItem } from "./tool-cards/search-citation-card";

/**
 * Every markdown render in the library goes through this one wrapper.
 * `Streamdown` is purpose-built for partial/incomplete markdown mid-stream
 * (unclosed code fences, half-written tables) — the exact problem the
 * NotebookChat.js reference solved by hand, switching between a raw
 * streaming renderer and a full block renderer once a message finished.
 * One renderer, used for both states, is simpler and doesn't need that split.
 */
function MessageMarkdown({
  className,
  content,
  muted = false,
  sources,
}: {
  className?: string;
  content: string;
  /** Render in muted tones (used for reasoning/thinking blocks). */
  muted?: boolean;
  /** Optional web search sources for rendering interactive [1], [2] citation pills with popovers */
  sources?: SearchResultItem[];
}) {
  const processedContent = React.useMemo(() => {
    if (!sources || !sources.length) return content;
    return transformInlineCitations(content, sources.length);
  }, [content, sources]);

  return (
    <Streamdown
      className={cn(
        // Exactly one root color: streamdown text (and fenced code that inherits
        // rather than self-coloring) reads either foreground or muted. Appending
        // both would leave the winner to CSS source order, so muted swaps rather
        // than stacks. Links/inline chips below stay colorful in either state.
        "max-w-none text-xs/relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        muted ? "text-muted-foreground" : "text-foreground",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
        // Only inline code gets our chip styling — fenced code blocks are
        // fully owned by Streamdown's own code-block renderer (header bar +
        // token colors from the `code` plugin); adding another border/bg/
        // padding layer around its <pre>/<code> just nests boxes inside
        // boxes.
        "[&_code:not(pre_code)]:rounded-none [&_code:not(pre_code)]:bg-muted [&_code:not(pre_code)]:px-1 [&_code:not(pre_code)]:py-0.5 [&_code:not(pre_code)]:text-xs",
        "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-sm [&_h1]:font-semibold",
        "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold",
        "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-xs [&_h3]:font-semibold",
        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_p]:my-2 [&_p:first-of-type]:mt-0! [&_p:first-child]:mt-0! [&_p:last-of-type]:mb-0! [&_p:last-child]:mb-0!",
        // Wrap fenced code instead of letting it scroll horizontally —
        // a long unbroken line otherwise forces the code block wider than
        // its flex ancestors are willing to shrink to, which overflows the
        // whole page sideways on narrow (mobile) viewports.
        "[&_[data-streamdown=code-block-body]]:overflow-x-visible!",
        "[&_[data-streamdown=code-block-body]_pre]:whitespace-pre-wrap! [&_[data-streamdown=code-block-body]_pre]:break-words!",
        "[&_[data-streamdown=code-block-body]_code]:whitespace-pre-wrap! [&_[data-streamdown=code-block-body]_code]:break-words!",
        className
      )}
      remarkPlugins={[remarkGfm]}
      plugins={{ code }}
      controls={{ table: false }}
      components={{
        a: ({ href, children, ...rest }) => (
          <MarkdownLink href={href} sources={sources} {...rest}>
            {children}
          </MarkdownLink>
        ),
        table: ({ children, className: tableClassName, ...rest }) => (
          <div className="my-3 w-full overflow-x-auto">
            <table
              className={cn("w-full text-left text-xs border-collapse", tableClassName)}
              {...rest}
            >
              {children}
            </table>
          </div>
        ),
        thead: ({ children, className: theadClassName, ...rest }) => (
          <thead
            className={cn("border-b border-border/80 font-semibold text-foreground", theadClassName)}
            {...rest}
          >
            {children}
          </thead>
        ),
        tbody: ({ children, className: tbodyClassName, ...rest }) => (
          <tbody
            className={cn("divide-y divide-border/40", tbodyClassName)}
            {...rest}
          >
            {children}
          </tbody>
        ),
        tr: ({ children, className: trClassName, ...rest }) => (
          <tr
            className={cn("transition-colors hover:bg-muted/20", trClassName)}
            {...rest}
          >
            {children}
          </tr>
        ),
        th: ({ children, className: thClassName, ...rest }) => (
          <th
            className={cn(
              "py-2.5 pr-4 pl-0 text-left font-semibold text-foreground/90 first:pl-0 last:pr-0 whitespace-nowrap",
              thClassName
            )}
            {...rest}
          >
            {children}
          </th>
        ),
        td: ({ children, className: tdClassName, ...rest }) => (
          <td
            className={cn(
              "py-2.5 pr-4 pl-0 text-foreground/80 first:pl-0 last:pr-0 align-top",
              tdClassName
            )}
            {...rest}
          >
            {children}
          </td>
        ),
      }}
    >
      {processedContent}
    </Streamdown>
  );
}

export { MessageMarkdown };
