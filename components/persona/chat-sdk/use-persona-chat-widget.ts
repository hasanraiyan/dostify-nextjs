"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useChat,
  useMcpConnections,
  useThreads,
  useFiles,
  useVoice,
  useAttachments,
  type PersonaMcpAuthRequiredServer,
  type PersonaMcpConnection,
  type PersonaStreamingEvent,
  type SendMessageOverride,
} from "@personaai/react";
import { groupReasoning } from "./message-grouping";

/** Shared empty set — a stable identity keeps the no-blocked-tools case a no-op. */
const EMPTY_BLOCKED_MCP_IDS: ReadonlySet<string> = new Set();

/**
 * The OAuth consent flow leaves the app entirely and comes back to the same
 * URL, so the only way to know we just returned from a connector is a marker
 * that survives the round trip. sessionStorage (not a query param) keeps the
 * URL clean and survives the provider's redirect back to `returnTo`.
 */
const PENDING_MCP_CONNECT_KEY = "persona:mcp-pending-connect";
/** A marker older than this is from an abandoned attempt, not this return. */
const PENDING_MCP_CONNECT_MAX_AGE_MS = 3 * 60 * 1000;

/**
 * The provider's callback can redirect back before the backend has finished
 * storing the grant, so the return check polls instead of trusting the first
 * read (which used to report "Couldn't connect" while the connection was in
 * fact succeeding). Delays are cumulative, ~13s worst case.
 */
const MCP_CONNECT_POLL_DELAYS_MS = [0, 800, 1500, 2500, 3500, 5000];

interface PendingMcpConnect {
  mcpId: string;
  name: string;
  at: number;
}

/** What to tell the user after returning from a connector's consent screen. */
export interface McpConnectionNotice {
  kind: "success" | "error";
  mcpId: string;
  name: string;
  /** Failure reason from the provider (`lastError`) or a generic fallback. */
  message?: string;
}

function mcpStatusOf(connection: PersonaMcpConnection | undefined) {
  if (!connection) return "not_connected" as const;
  return connection.status ?? (connection.connected ? "connected" : "not_connected");
}

/**
 * `connected` is authoritative; `status` can lag it by a beat right after the
 * OAuth callback, so trusting `status` alone produced false failures.
 */
function isMcpConnected(connection: PersonaMcpConnection | undefined) {
  return connection?.connected === true || mcpStatusOf(connection) === "connected";
}

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

  const {
    threads,
    createThread,
    deleteThread,
    renameThread,
    refetch: refreshThreads,
    isLoading: threadsLoading,
  } = useThreads();
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

  // Per-user OAuth MCPs this end user hasn't connected — their tools are
  // dropped from the Agent's toolset server-side, so the banner is the only
  // place that gap is visible before a reply silently lacks capabilities.
  const {
    connections: mcpConnections,
    unconnected: unconnectedMcps,
    disconnect: disconnectMcp,
    isDisconnecting: isDisconnectingMcp,
    isLoading: isLoadingMcpConnections,
    refetch: refetchMcpConnections,
  } = useMcpConnections({ agentId });

  // The consent flow is a full-page redirect, so "connect" is just: remember
  // which connector we left for, then hand the browser to the provider. The
  // confirmation is produced when the page remounts (effect below).
  const connectMcp = useCallback((connection: PersonaMcpConnection) => {
    if (!connection.authorizeUrl) return;
    try {
      const pending: PendingMcpConnect = {
        mcpId: connection.mcpId,
        name: connection.name,
        at: Date.now(),
      };
      sessionStorage.setItem(PENDING_MCP_CONNECT_KEY, JSON.stringify(pending));
    } catch {
      // Storage unavailable (private mode): the redirect still works, we just
      // can't confirm it when they come back.
    }
    window.location.assign(connection.authorizeUrl);
  }, []);

  const [mcpNotice, setMcpNotice] = useState<McpConnectionNotice | null>(null);
  const dismissMcpNotice = useCallback(() => setMcpNotice(null), []);

  // Self-healing failure notice: if the grant lands just after the poll window
  // (slow provider callback, or consent finished in another tab), the live
  // connection state wins over the stored failure — derived rather than
  // written back through an effect so it flips the moment a refetch sees it.
  const liveMcpNotice = useMemo<McpConnectionNotice | null>(() => {
    if (mcpNotice?.kind !== "error") return mcpNotice;
    const connection = mcpConnections.find((c) => c.mcpId === mcpNotice.mcpId);
    if (!isMcpConnected(connection)) return mcpNotice;
    return {
      kind: "success",
      mcpId: mcpNotice.mcpId,
      name: connection?.name || mcpNotice.name,
    };
  }, [mcpNotice, mcpConnections]);
  // On remount after the provider's callback, re-read connection state and
  // report the outcome — otherwise the return is silent and the user can't
  // tell a successful connect from a cancelled or failed one.
  useEffect(() => {
    let target: PendingMcpConnect;
    try {
      const raw = sessionStorage.getItem(PENDING_MCP_CONNECT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<PendingMcpConnect> | null;
      if (!parsed || typeof parsed.mcpId !== "string") {
        sessionStorage.removeItem(PENDING_MCP_CONNECT_KEY);
        return;
      }
      if (typeof parsed.at !== "number" || Date.now() - parsed.at > PENDING_MCP_CONNECT_MAX_AGE_MS) {
        sessionStorage.removeItem(PENDING_MCP_CONNECT_KEY);
        return;
      }
      target = {
        mcpId: parsed.mcpId,
        name: typeof parsed.name === "string" ? parsed.name : "",
        at: parsed.at,
      };
    } catch {
      return;
    }

    let cancelled = false;
    void (async () => {
      // Poll rather than judging on the first read: the callback often beats
      // the backend's write, which made a successful connect look like a
      // failure. Break out as soon as the connection is actually there.
      let connection: PersonaMcpConnection | undefined;
      let connected = false;
      for (const delay of MCP_CONNECT_POLL_DELAYS_MS) {
        if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
        if (cancelled) return;
        try {
          const items = await refetchMcpConnections();
          if (cancelled) return;
          connection = items.find((c) => c.mcpId === target.mcpId);
          connected = isMcpConnected(connection);
        } catch {
          // A transient fetch error shouldn't abort the whole poll window.
          connected = false;
        }
        if (connected) break;
      }

      setMcpNotice(
        connected
          ? { kind: "success", mcpId: target.mcpId, name: connection?.name || target.name }
          : {
              kind: "error",
              mcpId: target.mcpId,
              name: connection?.name || target.name,
              message:
                connection?.lastError ??
                "The connection wasn't completed. You can try again.",
            }
      );
      // Only clear after reporting, so a cancelled pass (StrictMode's
      // mount/unmount/mount) doesn't lose the marker for the next one.
      try {
        sessionStorage.removeItem(PENDING_MCP_CONNECT_KEY);
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [refetchMcpConnections]);

  // Servers whose tools THIS run dropped (backend emits `mcp_auth_required`
  // at the start of every run). Only sharpens the banner's copy — the list
  // itself comes from live connection state, so it also covers connectors
  // that haven't been set up yet at all. Keyed by agentId so switched agents
  // never inherit the previous agent's blocks.
  const [authBlocked, setAuthBlocked] = useState<{
    agentId: string | undefined;
    ids: ReadonlySet<string>;
  }>({ agentId: undefined, ids: EMPTY_BLOCKED_MCP_IDS });
  const authBlockedMcpIds =
    authBlocked.agentId === agentId ? authBlocked.ids : EMPTY_BLOCKED_MCP_IDS;
  const handleMcpAuthRequired = useCallback(
    (servers: PersonaMcpAuthRequiredServer[]) => {
      setAuthBlocked({ agentId, ids: new Set(servers.map((s) => s.mcpId)) });
      // The run's build may have just learned the provider revoked the grant
      // (needs_auth) — reload so the banner says "Reconnect", not "Connect".
      void refetchMcpConnections();
    },
    [agentId, refetchMcpConnections]
  );

  // TEMP DEBUG — trace the custom events the backend sends, especially
  // `mcp_app` (widget metadata) and `mcp_auth_required` (dropped connectors).
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
    onMcpAuthRequired: handleMcpAuthRequired,
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
    // MCP connectors — every one attached to the Agent, plus the subset this
    // end user still needs to connect (or reconnect)
    mcpConnections,
    unconnectedMcps,
    authBlockedMcpIds,
    isLoadingMcpConnections,
    refetchMcpConnections,
    connectMcp,
    mcpNotice: liveMcpNotice,
    dismissMcpNotice,
    disconnectMcp,
    isDisconnectingMcp,
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
