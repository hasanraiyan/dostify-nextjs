"use client";

import * as React from "react";
import {
  FolderOpenIcon,
  ListIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PhoneXIcon,
  SidebarSimpleIcon,
  TerminalIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChatScroller, ChatScrollerItem } from "./chat-scroller";
import { ChatMessage } from "./chat-message";
import { ChatComposer } from "./chat-composer";
import { ChatEmptyState, type ChatStarterPrompt } from "./chat-empty-state";
import { ThreadListBody } from "./thread-list";
import { Spinner } from "@/components/ui/spinner";
import { InterruptPanel } from "./interrupt-panel";
import { TodoChecklist } from "./todo-checklist";
import { SubagentSheet } from "./subagent-sheet";
import { MemoryWorkspaceDialog } from "./memory-workspace-dialog";
import { SandboxTerminalDialog } from "./sandbox-terminal-dialog";
import { VoiceIndicator } from "./voice-indicator";
import { VoiceDock } from "./voice-dock";
import type { Avatar } from "@personaai/avatar";
import { playGoodbye } from "@personaai/avatar/persona";
import { AgentPicker, type PersonaAgentOption } from "./agent-picker";
import { flattenSubagentActivity } from "./message-grouping";
import {
  McpAppSplitContext,
  type McpAppSplit,
} from "./mcp-app-embed-context";
import {
  useRenderToolCall,
  type PersonaMessage,
  type PersonaStreamingEvent,
  type PersonaTodo,
  PersonaVoiceTranscriptLine,
} from "@personaai/react";
import {
  usePersonaChatWidget,
  type UsePersonaChatWidgetOptions,
} from "./use-persona-chat-widget";

// "New chat" glyph — an open rounded square with an angled pencil, matching
// the requested icon. Uses currentColor so the color can be adjusted via the
// surrounding text color / className.
function NewChatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Open rounded square */}
      <path d="M10.5 4H7.5C5.567 4 4 5.567 4 7.5V16.5C4 18.433 5.567 20 7.5 20H16.5C18.433 20 20 18.433 20 16.5V13.5" />
      {/* Angled pencil */}
      <path d="M16.38 4.62A2.121 2.121 0 0 1 19.38 7.62L13 14L9 15L10 11Z" />
    </svg>
  );
}


/**
 * Images the user shared during the live call (useVoice().sendImage), newest
 * last — sending ones dimmed with a spinner, refused ones marked with the
 * server's reason on hover.
 */
function VoiceImagesStrip({ transcript }: { transcript: PersonaVoiceTranscriptLine[] }) {
  const images = transcript.flatMap((line) => line.attachments ?? []).slice(-6);
  if (!images.length) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
      {images.map((image) => (
        <div
          key={image.id}
          title={image.error?.message ?? image.name ?? "Shared image"}
          className={cn(
            "relative size-14 shrink-0 overflow-hidden rounded-md border bg-muted shadow-xs",
            image.status === "rejected" ? "border-destructive" : "border-border"
          )}
        >
          {image.previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.previewUrl}
              alt={image.name ?? "Shared image"}
              className={cn(
                "size-full object-cover",
                image.status === "sending" && "opacity-50"
              )}
            />
          )}
          {image.status === "sending" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner className="size-4 text-primary" />
            </div>
          )}
          {image.status === "rejected" && (
            <div className="absolute inset-0 flex items-center justify-center bg-destructive/80 px-0.5 text-center text-[9px] font-semibold leading-tight text-destructive-foreground">
              Not sent
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export interface PersonaChatViewClassNames {
  root?: string;
  threadList?: string;
  scroller?: string;
  composer?: string;
}

export interface PersonaMessageSlotProps {
  message: PersonaMessage;
  reasoningPhases?: PersonaMessage[];
  onOpenSubagent?: (toolCallId: string) => void;
  onOpenWorkspaceFile?: (path: string) => void;
  onSendMessage?: (text: string) => void;
}

export interface PersonaChatViewComponents {
  /** Replaces the whole per-message row (avatar/bubble/tool-trace/markdown). */
  Message?: React.ComponentType<PersonaMessageSlotProps>;
  /** Replaces the empty-conversation state. */
  EmptyState?: React.ComponentType<{
    title: string;
    description?: string;
    starterPrompts?: ChatStarterPrompt[];
    onSelectPrompt?: (template: string) => void;
  }>;
}

const VOICE_STATE_RING: Record<string, string> = {
  idle: "ring-foreground/20",
  connecting: "ring-foreground/40 animate-pulse",
  thinking: "ring-foreground/60 animate-pulse",
  listening: "ring-foreground/40",
  speaking: "ring-foreground",
  ended: "ring-foreground/20",
  error: "ring-destructive/60",
};

export interface PersonaChatViewProps extends UsePersonaChatWidgetOptions {
  title?: string;
  /**
   * Agents offered in the header's top-left picker. When provided (2+),
   * picking one stops any in-flight stream, starts a fresh conversation and
   * sends subsequent messages to the picked Agent (`agentId` prop becomes
   * the initial selection only). Omit for a single-Agent chat with no picker.
   */
  agents?: PersonaAgentOption[];
  emptyTitle?: string;
  emptyDescription?: string;
  starterPrompts?: ChatStarterPrompt[];
  placeholder?: string;
  /** @default "sidebar-main" */
  layout?: "sidebar-main" | "stacked";
  /** @default true — ignored when layout is "stacked". */
  showThreadList?: boolean;
  /** Which edge the desktop thread list sits on. @default "left" */
  threadListSide?: "left" | "right";
  /** Show a control to collapse the desktop thread list. @default false */
  threadListCollapsible?: boolean;
  /**
   * Render the thread list as a drawer over the conversation instead of a
   * column that shrinks it — the panel keeps its width when it opens.
   * @default false
   */
  threadListOverlay?: boolean;
  /** Controlled collapsed state for the desktop thread list. */
  threadListCollapsed?: boolean;
  /** Initial collapsed state when `threadListCollapsed` isn't supplied. @default false */
  defaultThreadListCollapsed?: boolean;
  onThreadListCollapsedChange?: (collapsed: boolean) => void;
  /** Pinned below the thread rows — e.g. the signed-in account's avatar. */
  threadListFooter?: React.ReactNode;
  /** @default true */
  showComposer?: boolean;
  /** Renders a "start voice call" button + the live voice-state orb. @default true */
  showVoice?: boolean;
  /** Renders a "Files" button that opens the active Agent's memory + workspace files (read/write/delete). @default true */
  showFiles?: boolean;
  /** Renders a "Terminal" button — only shown when the active Agent has `sandboxEnabled: true` — replaying its live `execute` tool calls. @default true */
  showTerminal?: boolean;
  /** Extra controls appended to the main header's right-side action group. */
  headerActions?: React.ReactNode;
  /**
   * CSS custom properties that override this app's shadcn tokens for just
   * this view (`--primary`, `--radius`, `--background`, …) — every visual
   * surface underneath is already bound to these vars via Tailwind, so
   * theming never means forking a component.
   */
  theme?: React.CSSProperties;
  classNames?: PersonaChatViewClassNames;
  /** Slot overrides — each receives the same props the default component gets. */
  components?: PersonaChatViewComponents;
  /** Wrap or replace a message's default render without losing the default. */
  renderMessage?: (
    message: PersonaMessage,
    reasoningPhases: PersonaMessage[] | undefined,
    defaultRender: () => React.ReactNode
  ) => React.ReactNode;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  errorState?: React.ReactNode | ((error: Error) => React.ReactNode);
  /** Raw AG-UI event passthrough (tool calls, steps, subagent activity). */
  onEvent?: (event: PersonaStreamingEvent) => void;
  /** Show the compact call dock (avatar + caption + mic/end) instead of this view's own call UI. */
  voiceDockVisible?: boolean;
  /** The dock's avatar was tapped: bring the full chat back. */
  onVoiceDockExpand?: () => void;
  /** Fired when voice call becomes active or inactive. */
  onVoiceActiveChange?: (active: boolean) => void;
  className?: string;
}

/**
 * Assembled chat widget — thread list + message feed + composer — built
 * entirely on `usePersonaChatWidget` (itself built on `@personaai/react`'s
 * `useChat`/`useThreads`/`useFiles`/`useVoice`). Every component underneath
 * (`ChatMessage`, `ChatComposer`, …) consumes `@personaai/react`'s own types
 * directly, no parallel vocabulary; this file is the SDK-first glue + the
 * configurability seams (`layout`, `theme`, `classNames`, `components`,
 * `render*`) on top of it.
 *
 * Throws (via `usePersonaContext`, called deep inside `useChat`) with a
 * clear message if rendered outside `<PersonaProvider baseUrl>`.
 */
function useCallTimer(active: boolean) {
  const [seconds, setSeconds] = React.useState(0);
  React.useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }
    const interval = window.setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [active]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function PersonaChatView({
  agentId,
  voiceAgentId,
  chatAgentVersion,
  voiceAgentVersion,
  voiceEnvironment,
  threadId,
  onThreadChange,
  agents,
  onEvent,
  voiceDockVisible = false,
  onVoiceDockExpand,
  onVoiceActiveChange,
  title = "Assistant",
  emptyTitle = "How can I help?",
  emptyDescription,
  starterPrompts,
  placeholder,
  layout = "sidebar-main",
  showThreadList = true,
  threadListSide = "left",
  threadListCollapsible = false,
  threadListOverlay = false,
  threadListCollapsed: controlledThreadsCollapsed,
  defaultThreadListCollapsed = false,
  onThreadListCollapsedChange,
  threadListFooter,
  showComposer = true,
  showVoice = true,
  showFiles = true,
  showTerminal = true,
  headerActions,
  theme,
  classNames = {},
  components = {},
  renderMessage,
  emptyState,
  loadingState,
  errorState,
  className,
}: PersonaChatViewProps) {
  // The picker's controlled selection — starts at the `agentId` prop and
  // changes only through the picker, so switching agents doesn't fight
  // whatever re-renders the prop came from.
  const [selectedAgentId, setSelectedAgentId] = React.useState(agentId);
  const canShowAgentPicker = !!agents && agents.length > 1;

  const currentAgentOption = React.useMemo(() => {
    return agents?.find((a) => a.agentId === selectedAgentId);
  }, [agents, selectedAgentId]);
  const activeVoiceAgentId = currentAgentOption?.voiceAgentId || voiceAgentId;

  // A full-screen MCP app takes the right side; the conversation narrows to
  // the left instead of being covered. When a host frames this view (the
  // floating panel), the host owns the state so its frame widens in the same
  // commit; otherwise the view tracks it itself.
  const hostSplit = React.useContext(McpAppSplitContext);
  const [internalAppSplit, setInternalAppSplit] = React.useState(false);
  const appSplit = hostSplit?.split ?? internalAppSplit;
  const splitValue: McpAppSplit = {
    split: appSplit,
    setSplit: hostSplit?.setSplit ?? setInternalAppSplit,
  };

  const {
    activeThreadId,
    threads,
    threadsLoading,
    threadsStalled,
    retryThreads,
    handleSelectThread,
    handleNewChat,
    deleteThread,
    renameThread,
    messages,
    input,
    setInput,
    isStreaming,
    isLoadingHistory,
    error,
    interrupt,
    todos,
    handleSend,
    handleDecideHitl,
    handleSubmitClarification,
    stop,
    openWorkspaceFile,
    presentedFile,
    dismissPresentedFile,
    sandboxCommands,
    voice,
    isVoiceActive,
    attachments,
  } = usePersonaChatWidget({
    agentId: selectedAgentId,
    voiceAgentId: activeVoiceAgentId,
    chatAgentVersion,
    voiceAgentVersion,
    voiceEnvironment,
    threadId,
    onThreadChange,
    onEvent,
    enableVoice: showVoice,
  });

  const callDuration = useCallTimer(isVoiceActive);
  const inViewAvatarRef = React.useRef<Avatar | null>(null);

  const handleEndCallWithGoodbye = React.useCallback(() => {
    const avatar = inViewAvatarRef.current;
    if (!avatar) {
      voice.stop();
      return;
    }
    let stopped = false;
    const finish = () => {
      if (stopped) return;
      stopped = true;
      voice.stop();
    };
    const timeout = window.setTimeout(finish, 1800);
    void playGoodbye(avatar)
      .catch(() => null)
      .then(() => {
        window.clearTimeout(timeout);
        finish();
      });
  }, [voice]);

  React.useEffect(() => {
    onVoiceActiveChange?.(isVoiceActive);
  }, [isVoiceActive, onVoiceActiveChange]);

  // Opening a thread started with another Agent (deep link, sidebar, browser
  // back/forward) moves the picker to that Agent. Adjusting during render —
  // guarded so it happens once per thread change — avoids a paint with the
  // wrong Agent, and a pending switch isn't undone before the URL follows.
  const activeThreadAgentId = React.useMemo(() => {
    if (!activeThreadId) return undefined;
    const thread = threads.find((t) => t._id === activeThreadId);
    if (!thread) return undefined;
    return typeof thread.agentId === "string" ? thread.agentId : thread.agentId?._id;
  }, [activeThreadId, threads]);
  const [syncedThreadId, setSyncedThreadId] = React.useState<string | undefined>(undefined);
  if (activeThreadId !== syncedThreadId) {
    if (!activeThreadId) {
      setSyncedThreadId(undefined);
    } else if (activeThreadAgentId) {
      setSyncedThreadId(activeThreadId);
      if (activeThreadAgentId !== selectedAgentId) setSelectedAgentId(activeThreadAgentId);
    }
  }

  const [openSubagentFor, setOpenSubagentFor] = React.useState<string | null>(null);
  const [filesOpen, setFilesOpen] = React.useState(false);
  const [terminalOpen, setTerminalOpen] = React.useState(false);
  const isFilesSheetOpen = filesOpen || !!presentedFile;
  // Workspace files are Agent-scoped, not Thread-scoped (shared across every
  // conversation with that Agent) — prefer the active thread's own agentId
  // (authoritative for which agent this conversation is actually with) over
  // the `agentId` prop, which only matters before any thread exists yet.
  // The Thread's own populated agentId already carries sandboxEnabled (same
  // place name/avatar come from) — deliberately NOT sourced from Agent
  // discovery (`useAgents()`), which only ever lists Agents that are either
  // `visibility: "public"` or owned by this external user; a Project-owned,
  // non-public Agent this Subject is already authorized to chat with (they
  // have a real Thread with it) would never show up there.
  const { activeAgentId, activeThreadSandboxEnabled } = React.useMemo(() => {
    const thread = threads.find((t) => t._id === activeThreadId);
    if (!thread) return { activeAgentId: agentId, activeThreadSandboxEnabled: false };
    if (typeof thread.agentId === "string") {
      return { activeAgentId: thread.agentId || agentId, activeThreadSandboxEnabled: false };
    }
    return {
      activeAgentId: thread.agentId?._id || agentId,
      activeThreadSandboxEnabled: !!thread.agentId?.sandboxEnabled,
    };
  }, [threads, activeThreadId, agentId]);
  const canShowTerminal = showTerminal && activeThreadSandboxEnabled;
  const subagentMessages: PersonaMessage[] = React.useMemo(() => {
    if (!openSubagentFor) return [];
    for (const { message } of messages) {
      const call = message.toolCalls?.find((tc) => tc.toolCallId === openSubagentFor);
      if (call?.subagentActivity) return flattenSubagentActivity(call.toolCallId, call.subagentActivity);
    }
    return [];
  }, [messages, openSubagentFor]);

  const MessageComponent = components.Message;
  const EmptyStateComponent = components.EmptyState ?? ChatEmptyState;

  const renderOneMessage = (message: PersonaMessage, reasoningPhases: PersonaMessage[] | undefined) => {
    const defaultRender = () =>
      MessageComponent ? (
        <MessageComponent
          message={message}
          reasoningPhases={reasoningPhases}
          onOpenSubagent={setOpenSubagentFor}
          onOpenWorkspaceFile={openWorkspaceFile}
          onSendMessage={handleSend}
        />
      ) : (
        <ChatMessage
          message={message}
          reasoningPhases={reasoningPhases}
          todos={todos}
          onOpenSubagent={setOpenSubagentFor}
          onOpenWorkspaceFile={openWorkspaceFile}
          onSendMessage={handleSend}
        />
      );
    return renderMessage ? renderMessage(message, reasoningPhases, defaultRender) : defaultRender();
  };

  const showThreads = layout === "sidebar-main" && showThreadList;
  // Below `md` the thread list moves into a slide-over sheet; this tracks it.
  const [threadsOpen, setThreadsOpen] = React.useState(false);
  // Desktop-only collapse; the mobile sheet has its own dismiss.
  const [uncontrolledThreadsCollapsed, setUncontrolledThreadsCollapsed] = React.useState(
    defaultThreadListCollapsed
  );
  const threadsCollapsed =
    controlledThreadsCollapsed ?? uncontrolledThreadsCollapsed;
  const setThreadsCollapsed = React.useCallback(
    (collapsed: boolean) => {
      if (controlledThreadsCollapsed === undefined) {
        setUncontrolledThreadsCollapsed(collapsed);
      }
      onThreadListCollapsedChange?.(collapsed);
    },
    [controlledThreadsCollapsed, onThreadListCollapsedChange]
  );

  const handleAgentSwitch = React.useCallback(
    (nextAgentId: string) => {
      if (nextAgentId === selectedAgentId) return;
      // A fresh conversation with the new Agent; the old one stays in the
      // thread list. handleNewChat aborts any in-flight stream and resets.
      setSelectedAgentId(nextAgentId);
      handleNewChat();
    },
    [selectedAgentId, handleNewChat]
  );

  // One thread list for both the desktop sidebar and the mobile slide-over.
  // `onNavigate` lets the mobile sheet close itself after a pick.
  const renderThreadList = (onNavigate?: () => void) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-1 border-b border-border p-2">
        <span className="min-w-0 truncate px-1 text-sm font-semibold">{title}</span>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="New chat"
            onClick={() => {
              handleNewChat();
              onNavigate?.();
            }}
          >
            <NewChatIcon className="size-4" />
          </Button>
          {threadListCollapsible && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Collapse chat list"
              onClick={() => {
                if (onNavigate) onNavigate();
                else setThreadsCollapsed(true);
              }}
            >
              <SidebarSimpleIcon className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <ThreadListBody
        threads={threads}
        loading={threadsLoading}
        stalled={threadsStalled}
        onRetry={retryThreads}
        activeThreadId={activeThreadId}
        onSelect={(id) => {
          handleSelectThread(id);
          onNavigate?.();
        }}
        onActiveThreadDeleted={handleNewChat}
        renameThread={renameThread}
        deleteThread={deleteThread}
      />
      {threadListFooter && (
        <div className="shrink-0 border-t border-border">{threadListFooter}</div>
      )}
    </div>
  );

  return (
    <McpAppSplitContext.Provider value={splitValue}>
      <div
        style={theme}
        className={cn(
          "relative flex h-full min-h-0 w-full overflow-hidden bg-background text-foreground",
          // Give the full-screen MCP app the right of the viewport; the
          // thread column is hidden so the conversation gets all the width
          // this leaves.
          appSplit && "md:w-2/5",
          threadListSide === "right" && "flex-row-reverse",
          classNames.root,
          className
        )}
      >
      {showThreads && threadListOverlay && (
        <>
          <div
            aria-hidden
            onClick={() => setThreadsCollapsed(true)}
            className={cn(
              "absolute inset-0 z-20 bg-foreground/20 transition-opacity duration-200",
              threadsCollapsed
                ? "pointer-events-none opacity-0"
                : "opacity-100"
            )}
          />
          <div
            role="dialog"
            aria-label="Chats"
            aria-hidden={threadsCollapsed}
            inert={threadsCollapsed}
            className={cn(
              "absolute inset-y-0 z-30 flex h-full w-64 max-w-[85%] min-h-0 flex-col overflow-hidden bg-card shadow-xl transition-transform duration-200 ease-out",
              threadListSide === "right"
                ? "right-0 border-l border-border"
                : "left-0 border-r border-border",
              threadsCollapsed
                ? threadListSide === "right"
                  ? "translate-x-full"
                  : "-translate-x-full"
                : "translate-x-0",
              classNames.threadList
            )}
          >
            {renderThreadList(() => setThreadsCollapsed(true))}
          </div>
        </>
      )}

      {showThreads && !threadListOverlay && !appSplit && (!threadListCollapsible || !threadsCollapsed) && (
        <div
          className={cn(
            // Floating rounded panel instead of a flush full-height column.
            "m-2 hidden h-[calc(100%-1rem)] w-64 min-h-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card md:flex",
            classNames.threadList
          )}
        >
          {renderThreadList()}
        </div>
      )}

      {showThreads && !threadListOverlay && (
        <Sheet open={threadsOpen} onOpenChange={setThreadsOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="flex h-full min-h-0 flex-col overflow-hidden rounded-r-2xl p-0 data-[side=left]:w-72 data-[side=left]:max-w-[85vw]"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Chats</SheetTitle>
            </SheetHeader>
            {renderThreadList(() => setThreadsOpen(false))}
          </SheetContent>
        </Sheet>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border px-2">
          {showThreads && threadListOverlay && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Chats"
              aria-expanded={!threadsCollapsed}
              onClick={() => setThreadsCollapsed(!threadsCollapsed)}
            >
              <SidebarSimpleIcon />
            </Button>
          )}
          {showThreads && !threadListOverlay && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="Chats"
              aria-expanded={threadsOpen}
              onClick={() => setThreadsOpen(true)}
            >
              <ListIcon />
            </Button>
          )}
          {showThreads &&
            !threadListOverlay &&
            threadListCollapsible &&
            threadsCollapsed && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="hidden md:inline-flex"
              aria-label="Show chat list"
              aria-expanded={false}
              onClick={() => setThreadsCollapsed(false)}
            >
              <SidebarSimpleIcon />
            </Button>
          )}
          {canShowAgentPicker && (
            <AgentPicker agents={agents!} value={selectedAgentId} onChange={handleAgentSwitch} className="mr-auto" />
          )}
          <div className={cn("flex items-center gap-1", !canShowAgentPicker && "ml-auto")}>
            {showFiles && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Memory & workspace files"
                onClick={() => setFilesOpen(true)}
              >
                <FolderOpenIcon />
              </Button>
            )}
            {canShowTerminal && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Sandbox terminal"
                onClick={() => setTerminalOpen(true)}
              >
                <TerminalIcon />
              </Button>
            )}
            {headerActions}
          </div>
        </div>
        {isLoadingHistory && messages.length === 0 ? (
          loadingState ?? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner className="size-5 text-muted-foreground" />
            </div>
          )
        ) : messages.length === 0 && !isVoiceActive && (emptyState || emptyTitle || emptyDescription || (starterPrompts && starterPrompts.length > 0)) ? (
          emptyState ?? (
            <EmptyStateComponent
              title={emptyTitle}
              description={emptyDescription}
              starterPrompts={messages.length === 0 ? starterPrompts : undefined}
              onSelectPrompt={(template) => void handleSend(template)}
            />
          )
        ) : (
          <ChatScroller
            className={classNames.scroller}
            autoScrollToBottom={isVoiceActive}
            hideScrollButton={true}
          >
            {messages.map(({ message, reasoningPhases }) => (
              <ChatScrollerItem key={message.id}>
                {renderOneMessage(message, reasoningPhases)}
              </ChatScrollerItem>
            ))}
          </ChatScroller>
        )}

        {error &&
          (errorState ? (
            typeof errorState === "function" ? errorState(error) : errorState
          ) : (
            <div className="mx-auto mb-2 w-full max-w-3xl px-4 text-xs text-destructive">
              {error.message || "Failed to communicate with agent."}
            </div>
          ))}

        {interrupt && (
          <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-2">
            <InterruptPanel
              interrupt={interrupt}
              onDecideHitl={handleDecideHitl}
              onSubmitClarification={handleSubmitClarification}
            />
          </div>
        )}

        {todos.length > 0 && (
          <div className="mx-auto w-full max-w-3xl shrink-0 px-4">
            <TodoChecklist todos={todos} className="pb-2" />
          </div>
        )}


        {showComposer && (
          <div
            className={cn(
              // Keep the composer clear of the iOS home indicator.
              "mx-auto w-full max-w-3xl shrink-0 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-4",
              classNames.composer
            )}
          >
            {/* Compact voice dock when minimized */}
            {voiceDockVisible && isVoiceActive && onVoiceDockExpand && (
              <VoiceDock voice={voice} onExpand={onVoiceDockExpand} />
            )}

            {/* Only occupies space while a call is actually live — the idle
                "start voice" control lives inside the composer's own send
                slot below, not as a separate row. */}
            {showVoice && isVoiceActive && (
              <div className="mb-3 flex flex-col items-center justify-center gap-3">
                <div className="relative flex flex-col items-center justify-center">
                  {/* Circular Avatar Container with perspective scaling to prevent cut-off shoulders */}
                  <div
                    className={cn(
                      "relative flex size-44 sm:size-52 items-center justify-center overflow-hidden rounded-full bg-card shadow-2xl ring-4 transition-all duration-300",
                      voice.isMuted
                        ? "ring-destructive/60"
                        : (VOICE_STATE_RING[voice.state] ?? "ring-foreground/20"),
                    )}
                  >
                    <div
                      className="size-full origin-center"
                      style={{ transform: "translateY(10.5%) scale(1.35)" }}
                    >
                      <VoiceIndicator
                        state={voice.state}
                        voice={voice}
                        size={208}
                        variant="avatar"
                        onAvatarReady={(a) => {
                          inViewAvatarRef.current = a;
                        }}
                      />
                    </div>
                  </div>

                  {/* Modern Glassmorphism In-Call Control Bar */}
                  <div className="mt-4 flex items-center gap-2.5 rounded-full border border-border/80 bg-background/95 px-4 py-2 shadow-xl backdrop-blur-md">
                    {/* Live indicator & timer */}
                    <div className="flex items-center gap-2 pr-1">
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-mono font-medium text-foreground/80 tracking-wider">
                        {callDuration}
                      </span>
                      {/* Audio visualizer wave bars */}
                      <div className="flex items-center gap-0.5 ml-1">
                        <span
                          className={cn(
                            "w-0.5 rounded-full bg-emerald-500 transition-all duration-150",
                            voice.state === "speaking" ? "h-3.5 animate-pulse" : voice.state === "listening" ? "h-2" : "h-1",
                          )}
                        />
                        <span
                          className={cn(
                            "w-0.5 rounded-full bg-emerald-500 transition-all duration-150",
                            voice.state === "speaking" ? "h-4.5 animate-pulse delay-75" : voice.state === "listening" ? "h-2.5" : "h-1.5",
                          )}
                        />
                        <span
                          className={cn(
                            "w-0.5 rounded-full bg-emerald-500 transition-all duration-150",
                            voice.state === "speaking" ? "h-3 animate-pulse delay-150" : voice.state === "listening" ? "h-2" : "h-1",
                          )}
                        />
                      </div>
                    </div>

                    <div className="h-4 w-px bg-border/80" />

                    {/* Mute / Unmute Button */}
                    <button
                      type="button"
                      onClick={() => voice.mute(!voice.isMuted)}
                      title={voice.isMuted ? "Unmute microphone" : "Mute microphone"}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full border transition-all duration-150 active:scale-95",
                        voice.isMuted
                          ? "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25"
                          : "bg-muted text-foreground/80 border-border hover:bg-muted/80 hover:text-foreground",
                      )}
                    >
                      {voice.isMuted ? (
                        <MicrophoneSlashIcon className="size-4" />
                      ) : (
                        <MicrophoneIcon className="size-4" />
                      )}
                    </button>

                    {/* Styled End Call Pill Button */}
                    <button
                      type="button"
                      onClick={handleEndCallWithGoodbye}
                      title="End voice call"
                      className="flex items-center gap-1.5 rounded-full bg-destructive px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-destructive/25 transition-all hover:bg-destructive/90 hover:shadow-lg active:scale-95"
                    >
                      <PhoneXIcon weight="fill" className="size-3.5" />
                      <span>End Call</span>
                    </button>
                  </div>
                </div>
                <VoiceImagesStrip transcript={voice.transcript} />
              </div>
            )}
            <ChatComposer
              value={input}
              onChange={setInput}
              onSend={() => void handleSend()}
              onStop={stop}
              onStartVoice={showVoice ? () => void voice.start() : undefined}
              onStopVoice={voice.stop}
              onSendToVoice={voice.sendText}
              onSendImageToVoice={(file) => void voice.sendImage(file)}
              isStreaming={isStreaming}
              isVoiceActive={isVoiceActive}
              placeholder={placeholder}
              attachments={attachments.attachments}
              onAddAttachments={attachments.add}
              onRemoveAttachment={attachments.remove}
              isUploadingAttachments={attachments.isUploading}
              attachmentError={attachments.error}
            />
          </div>
        )}
      </div>

      <SubagentSheet
        open={openSubagentFor !== null}
        onOpenChange={(open) => !open && setOpenSubagentFor(null)}
        messages={subagentMessages}
      />

      {showFiles && (
        <MemoryWorkspaceDialog
          open={isFilesSheetOpen}
          onOpenChange={(open) => {
            setFilesOpen(open);
            if (!open) dismissPresentedFile();
          }}
          agentId={activeAgentId}
          initialOpenPath={presentedFile?.path}
        />
      )}

      {canShowTerminal && (
        <SandboxTerminalDialog
          open={terminalOpen}
          onOpenChange={setTerminalOpen}
          commands={sandboxCommands}
        />
      )}

      </div>
    </McpAppSplitContext.Provider>
  );
}
export { NewChatIcon };
