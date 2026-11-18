"use client";

import * as React from "react";
import { Message, MessageContent } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, MessageCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { MessageMarkdown } from "./message-markdown";
import { MessageContentWithSvg } from "./message-content-with-svg";
import { ToolCallTrace } from "./tool-call-trace";
import { ReasoningBlock } from "./reasoning-block";
import { ThinkingIndicator } from "./thinking-indicator";
import { CopyButton } from "./copy-button";
import { extractAllSearchSources } from "./inline-citation";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  buildMessageTimeline,
  useAttachmentUrl,
  useFeedback,
  type PersonaMessage,
  type PersonaMessageAttachment,
  type PersonaTimelineItem,
  type PersonaTodo,
  type PersonaToolCall,
} from "@personaai/react";

type TimelineBlock =
  | Exclude<PersonaTimelineItem, { type: "tool" }>
  | { type: "tools"; key: string; toolCalls: PersonaToolCall[] };

/** Merges runs of consecutive tool items into one block so they render as one trace group. */
function groupTimeline(items: PersonaTimelineItem[]): TimelineBlock[] {
  const blocks: TimelineBlock[] = [];
  for (const item of items) {
    if (item.type !== "tool") {
      blocks.push(item);
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (last?.type === "tools") last.toolCalls.push(item.toolCall);
    else blocks.push({ type: "tools", key: item.key, toolCalls: [item.toolCall] });
  }
  return blocks;
}

export type PersonaChannel = "web" | "voice" | "whatsapp" | "sms";

function getChannelBadgeLabel(channel: PersonaChannel): string {
  switch (channel) {
    case "voice":
      return "Transcribed from phone call";
    case "whatsapp":
      return "via WhatsApp";
    case "sms":
      return "via SMS";
    default:
      return "Web chat";
  }
}

function ChannelBadge({ channel }: { channel?: PersonaChannel }) {
  if (!channel || channel === "web") return null;

  const label = getChannelBadgeLabel(channel);
  const icon =
    channel === "voice" ? (
      <Phone className="size-3 text-emerald-500" />
    ) : channel === "whatsapp" ? (
      <MessageCircle className="size-3 text-emerald-500" />
    ) : (
      <MessageSquare className="size-3 text-blue-500" />
    );

  return (
    <Badge
      variant="outline"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-normal text-muted-foreground border-border/60 bg-muted/40 rounded-full"
    >
      {icon}
      <span>{label}</span>
    </Badge>
  );
}

function MessageAttachmentThumbnail({
  attachment,
}: {
  attachment: PersonaMessageAttachment;
}) {
  const { url, isLoading, error } = useAttachmentUrl(attachment.fileId);

  if (isLoading) {
    return (
      <div className="size-24 rounded-lg bg-muted flex items-center justify-center animate-pulse border border-border/50">
        <Spinner className="size-4" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className="size-24 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center text-[10px] p-1 text-center border border-destructive/20 font-medium">
        Image unavailable
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-lg border border-border/60 shadow-xs hover:opacity-90 transition-opacity bg-muted/20"
      title={attachment.name || "View image"}
    >
      <img
        src={url}
        alt={attachment.name || "Attachment"}
        className="max-h-48 max-w-xs rounded-lg object-contain"
      />
    </a>
  );
}

function MessageFeedback({ runId }: { runId: string }) {
  const { rate, ratings, pending } = useFeedback();
  const currentRating = ratings[runId];
  const isPending = pending[runId];

  return (
    <div className="inline-flex items-center gap-0.5 ml-1 border-l border-border/40 pl-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => rate(runId, 1)}
        title="Good response"
        className={cn(
          "inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50",
          currentRating === 1 && "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
        )}
      >
        <ThumbsUp className="size-3" />
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => rate(runId, -1)}
        title="Poor response"
        className={cn(
          "inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50",
          currentRating === -1 && "text-destructive bg-destructive/10 hover:bg-destructive/20"
        )}
      >
        <ThumbsDown className="size-3" />
      </button>
    </div>
  );
}

/**
 * Role-based dispatch: the user's own turn is bubbled (align="end"),
 * matching Claude's own layout where only the human side gets bubble
 * chrome; the assistant's turn renders as plain content plus its tool-call
 * trace, no bubble — same split NotebookChat.js's ChatMessage uses.
 */
function ChatMessage({
  message,
  reasoningPhases,
  todos,
  onOpenSubagent,
  onOpenWorkspaceFile,
  onSendMessage,
}: {
  message: PersonaMessage;
  /** `role:"reasoning"` messages that streamed right before this one — see `groupReasoning` in `./message-grouping`. */
  reasoningPhases?: PersonaMessage[];
  todos?: PersonaTodo[];
  onOpenSubagent?: (toolCallId: string) => void;
  onOpenWorkspaceFile?: (path: string) => void;
  onSendMessage?: (text: string) => void;
}) {
  if (message.role === "user") {
    return (
      <Message align="end">
        <MessageContent>
          {message.channel && message.channel !== "web" && (
            <div className="mb-1 flex justify-end">
              <ChannelBadge channel={message.channel} />
            </div>
          )}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-1.5 flex flex-wrap gap-2 justify-end">
              {message.attachments.map((att) => (
                <MessageAttachmentThumbnail key={att.fileId} attachment={att} />
              ))}
            </div>
          )}
          {message.content && (
            <Bubble align="end">
              <BubbleContent>{message.content}</BubbleContent>
            </Bubble>
          )}
        </MessageContent>
      </Message>
    );
  }

  const hasToolCalls = (message.toolCalls?.length ?? 0) > 0;
  const reasoning = reasoningPhases ?? [];
  // A live reasoning block auto-opens with its own animated header, so the
  // standalone "Thinking" gap indicator below would read as a duplicate —
  // show it only when nothing reasoning-related is already indicating.
  const hasLiveReasoning = reasoning.some((r) => r.isStreaming);
  const isEmptyStreaming =
    !!message.isStreaming && !message.content?.trim() && !hasToolCalls;

  const sources = React.useMemo(() => {
    const calls = [...(message.toolCalls ?? [])];
    return extractAllSearchSources(calls);
  }, [message.toolCalls]);

  return (
    <Message align="start" className="group/chat-message">
      <MessageContent className="gap-1">
        {message.channel && message.channel !== "web" && (
          <div className="mb-2">
            <ChannelBadge channel={message.channel} />
          </div>
        )}

        {/* Thinking, text and tool calls in the order they happened — never
            grouped by kind. Consecutive tool calls share one trace group. */}
        {groupTimeline(buildMessageTimeline(message, [...reasoning, message])).map((block, i, all) => {
          if (block.type === "reasoning") {
            return <ReasoningBlock key={block.key} reasoning={block.message} />;
          }
          if (block.type === "tools") {
            return (
              <ToolCallTrace
                key={block.key}
                toolCalls={block.toolCalls}
                todos={todos}
                onOpenSubagent={onOpenSubagent}
                onOpenWorkspaceFile={onOpenWorkspaceFile}
                onSendMessage={onSendMessage}
              />
            );
          }
          return (
            <MessageContentWithSvg
              key={block.key}
              content={block.content}
              sources={sources}
              // Only the last text block can still be receiving tokens.
              streaming={!!message.isStreaming && i === all.length - 1}
            />
          );
        })}

        {isEmptyStreaming && !hasLiveReasoning ? <ThinkingIndicator /> : null}

        {!message.isStreaming && message.content && (
          <div className="flex items-center gap-1 pt-1 opacity-0 transition-opacity group-hover/chat-message:opacity-100">
            <CopyButton text={message.content} label="Copy message" />
            {message.runId && <MessageFeedback runId={message.runId} />}
          </div>
        )}
      </MessageContent>
    </Message>
  );
}

export { ChatMessage };
