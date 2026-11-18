"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useChat,
  useThreads,
  useFiles,
  useVoice,
  useAttachments,
  type PersonaStreamingEvent,
  type SendMessageOverride,
} from "@personaai/react";
import { useSharedThreads, useStalledFlag } from "./threads-context";
import { groupReasoning } from "./message-grouping";

export interface UsePersonaChatWidgetOptions {
  agentId?: string;
  /**
   * Dedicated Voice Agent ID for Gemini Live real-time audio sessions.
   * When using a decoupled architecture (Deep Agent for text, Voice Agent for voice),
   * specify the Voice Agent ID here. If omitted, falls back to `agentId`.
   */
  voiceAgentId?: string;
  /** Optional pinned Agent version for text chat. If omitted, runs the active production deployment. */
  chatAgentVersion?: number;
  /** Optional pinned Agent version for voice sessions. If omitted, runs the active production deployment. */
  voiceAgentVersion?: number;
  /** Target environment for voice sessions. Defaults to 'production'. */
  voiceEnvironment?: "development" | "production";
  /**
   * Controlled active thread. When `onThreadChange` is supplied the consumer
   * owns selection, so `undefined` means "new chat"; otherwise the hook keeps
   * the selected thread internally.
   */
  threadId?: string;
  onThreadChange?: (threadId: string | undefined) => void;
  /** Raw AG-UI event passthrough — see `PersonaChatView`'s `onEvent` prop. */
  onEvent?: (event: PersonaStreamingEvent) => void;
  /** @default true — set false to omit voice entirely (no mic permission prompt, no useVoice wiring). */
  enableVoice?: boolean;
}

/**
 * Every stateful/behavioral piece `PersonaChatView` is built on: thread
 * selection, lazy thread creation on the first message, HITL/clarification
 * decision accumulation, and mapping `@personaai/react`'s wire-accurate
 * types onto the `chat` registry item's presentational shapes (see
 * `./adapter`). A consumer assembling its own layout can call this
 * directly instead of reimplementing the same wiring against the raw
 * `useChat`/`useThreads` hooks.
 */
export function usePersonaChatWidget(options: UsePersonaChatWidgetOptions = {}) {
  const {
    agentId,
    voiceAgentId,
    chatAgentVersion,
    voiceAgentVersion,
    voiceEnvironment = "production",
    threadId: controlledThreadId,
    onThreadChange,
    onEvent,
    enableVoice = true,
  } = options;

  const [internalThreadId, setInternalThreadId] = useState<string | undefined>(undefined);
  // A supplied onThreadChange means the consumer drives selection (our URL
  // does), so `threadId: undefined` is a real "new chat", not "decide for me".
  const isControlled = onThreadChange !== undefined;
  const activeThreadId = isControlled ? controlledThreadId : internalThreadId;

  // Use the app-wide thread list when there is one (so the sidebar shares it);
  // otherwise fetch our own. The hook is always called, but only fetches when
  // there is no shared list.
  const sharedThreads = useSharedThreads();
  const ownThreads = useThreads(!sharedThreads);
  const {
    threads,
    createThread,
    deleteThread,
    renameThread,
    refetch: refreshThreads,
    isLoading: threadsLoading,
  } = sharedThreads ?? ownThreads;

  const [threadsStalled, setThreadsStalled] = useStalledFlag(threadsLoading);
  const retryThreads = useCallback(() => {
    setThreadsStalled(false);
    void refreshThreads();
  }, [refreshThreads, setThreadsStalled]);
  const { files: uploadedFiles, uploadFile, deleteFile, isLoading: filesLoading } = useFiles();

  // Always called (hooks can't be conditional) — cheap until voice.start()
  // is actually invoked. `enableVoice` only gates whether it's merged into
  // `useChat` and whether `PersonaChatView` renders any voice UI for it.
  const effectiveVoiceAgentId = voiceAgentId || agentId;
  const voice = useVoice({
    agentId: effectiveVoiceAgentId,
    threadId: activeThreadId,
    agentVersion: voiceAgentVersion,
    environment: voiceEnvironment,
  });

  const setActiveThread = useCallback(
    (id: string | undefined) => {
      setInternalThreadId(id);
      onThreadChange?.(id);
    },
    [onThreadChange]
  );

  // The SDK mints a real thread on the first message of a new chat; surface it
  // to the consumer (URL) and refresh the sidebar so the row appears.
  const handleThreadCreated = useCallback(
    (id: string) => {
      setActiveThread(id);
      void refreshThreads();
    },
    [setActiveThread, refreshThreads]
  );

  // Lazy thread creation for voice calls started from an ephemeral new chat ("/").
  // Mirrors useChat's first-message thread minting so voice turns are persisted into
  // a real conversation document that survives reloads.
  const pendingVoiceStartRef = useRef(false);

  const startVoice = useCallback(async () => {
    if (activeThreadId) {
      return voice.start();
    }
    pendingVoiceStartRef.current = true;
    try {
      const created = await createThread(agentId);
      const resolvedId = created?._id ?? (created as any)?.id;
      if (resolvedId) {
        handleThreadCreated(resolvedId);
      } else {
        pendingVoiceStartRef.current = false;
        return voice.start();
      }
    } catch (err) {
      console.warn("[voice] thread creation before call failed", err);
      pendingVoiceStartRef.current = false;
      return voice.start();
    }
  }, [activeThreadId, createThread, agentId, handleThreadCreated, voice]);

  useEffect(() => {
    if (pendingVoiceStartRef.current && activeThreadId) {
      pendingVoiceStartRef.current = false;
      void voice.start();
    }
  }, [activeThreadId, voice]);

  const wrappedVoice = useMemo(
    () => ({
      ...voice,
      start: startVoice,
    }),
    [voice, startVoice]
  );

  // The runtime auto-titles a thread after the first exchange; refetch so the
  // sidebar row stops saying "New chat".
  const handleTitle = useCallback(() => {
    void refreshThreads();
  }, [refreshThreads]);

  // TEMP DEBUG — trace the custom events the backend sends, especially
  // `mcp_app` (widget metadata).
  const handleStreamEvent = useCallback(
    (event: PersonaStreamingEvent) => {
      if (event.type === "CUSTOM") {
        console.info("[mcp-app] custom stream event", { name: event.name, value: event.value });
      }
      onEvent?.(event);
    },
    [onEvent]
  );

  const {
    messages: rawMessages,
    todos: rawTodos,
    interrupt: rawInterrupt,
    files: workspaceFiles,
    resumeInterrupt,
    sendMessage,
    startNewChat,
    clear,
    ...restChat
  } = useChat({
    agentId,
    threadId: activeThreadId,
    agentVersion: chatAgentVersion,
    onEvent: handleStreamEvent,
    onThreadCreated: handleThreadCreated,
    onTitle: handleTitle,
    // useChat merges live voice turns into `messages` automatically —
    // one bubble per utterance, deduped against history — while `voice`
    // is in an active (non-idle/ended/error) state.
    voice: enableVoice ? wrappedVoice : undefined,
  });

  const isVoiceActive = enableVoice && !["idle", "ended", "error"].includes(voice.state);

  // Attachments (image input) via useAttachments hook
  const attachments = useAttachments();

  // Back/forward changes the URL without going through handleSelectThread or
  // handleNewChat, so keep the chat state in step with the controlled id.
  const prevThreadIdRef = useRef<string | undefined>(controlledThreadId);
  useEffect(() => {
    if (!isControlled || controlledThreadId === prevThreadIdRef.current) return;
    const prev = prevThreadIdRef.current;
    prevThreadIdRef.current = controlledThreadId;
    if (controlledThreadId === undefined) {
      // Back to the new-chat URL: drop the thread we came from.
      attachments.clear();
      startNewChat();
    } else if (prev !== undefined) {
      // Moved between two threads: useChat auto-loads the new history.
      attachments.clear();
      clear();
    }
    // prev === undefined && id set is the first-message mint: keep its live messages.
  }, [controlledThreadId, isControlled, startNewChat, clear, attachments]);

  const handleSelectThread = useCallback(
    (id: string | undefined) => {
      attachments.clear();
      clear();
      setActiveThread(id);
    },
    [clear, setActiveThread, attachments]
  );

  const handleNewChat = useCallback(() => {
    // startNewChat (unlike clear) also resets the composer draft.
    attachments.clear();
    startNewChat();
    setActiveThread(undefined);
  }, [startNewChat, setActiveThread, attachments]);

  const handleSend = useCallback(
    (content?: string, overrideOptions?: SendMessageOverride) => {
      // With no active thread the SDK mints one itself and reports it through
      // onThreadCreated; no client-side createThread needed.
      const atts =
        overrideOptions?.attachments ??
        (attachments.ready.length > 0 ? attachments.ready : undefined);
      void sendMessage(content, { ...overrideOptions, attachments: atts });
      attachments.clear();
    },
    [sendMessage, attachments]
  );

  // HITL actions are decided one at a time by InterruptPanel's
  // onDecideHitl(actionName, decision) but the backend expects every
  // actionRequest's decision resumed together, in the same order the
  // interrupt listed them — accumulate by tool name (the only identifier
  // `PersonaHitlActionRequest` carries) until all are decided, then resume.
  const hitlDecisions = useRef<Map<string, "approve" | "reject">>(new Map());
  const handleDecideHitl = useCallback(
    (actionName: string, decision: "approve" | "reject") => {
      if (!rawInterrupt || rawInterrupt.kind !== "hitl") return;
      hitlDecisions.current.set(actionName, decision);
      const total = rawInterrupt.actionRequests.length;
      if (hitlDecisions.current.size >= total) {
        const decisions = rawInterrupt.actionRequests.map((a) => ({
          type: hitlDecisions.current.get(a.name) ?? ("reject" as const),
        }));
        hitlDecisions.current.clear();
        const display = decisions.every((d) => d.type === "approve") ? "Approved" : "Rejected";
        void resumeInterrupt({ decisions }, display);
      }
    },
    [rawInterrupt, resumeInterrupt]
  );

  const handleSubmitClarification = useCallback(
    (answers: Record<string, string>) => {
      if (!rawInterrupt || rawInterrupt.kind !== "clarification") return;
      const ordered = rawInterrupt.questions.map((q) => answers[q.id] ?? "");
      void resumeInterrupt({ answers: ordered }, ordered.filter(Boolean).join(", "));
    },
    [rawInterrupt, resumeInterrupt]
  );

  const messages = useMemo(() => groupReasoning(rawMessages), [rawMessages]);

  return {
    // thread selection
    activeThreadId,
    setActiveThread,
    // threads
    threads,
    threadsLoading,
    threadsStalled,
    retryThreads,
    createThread,
    deleteThread,
    renameThread,
    // uploaded files
    uploadedFiles,
    filesLoading,
    uploadFile,
    deleteFile,
    // chat — every other useChat field (isStreaming, stop, reload, etc.)
    ...restChat,
    sendMessage,
    startNewChat,
    clear,
    workspaceFiles,
    // messages grouped for rendering (reasoning nested under its assistant
    // message) — todos/interrupt are the SDK's own PersonaTodo[]/PersonaInterrupt, unmodified
    messages,
    todos: rawTodos,
    interrupt: rawInterrupt,
    resumeInterrupt,
    // voice
    voice: wrappedVoice,
    isVoiceActive,
    // image attachments
    attachments,
    // composed handlers
    handleSelectThread,
    handleNewChat,
    handleSend,
    handleDecideHitl,
    handleSubmitClarification,
  };
}
