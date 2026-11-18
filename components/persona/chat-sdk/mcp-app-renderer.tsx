"use client";

import * as React from "react";
import {
  WarningCircleIcon,
  ArrowsOutIcon,
  ArrowsInIcon,
  AppWindowIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  AppBridge,
  PostMessageTransport,
} from "@modelcontextprotocol/ext-apps/app-bridge";
import { useMcp } from "@personaai/react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { McpAppSplitContext } from "./mcp-app-embed-context";

function parseJsonObject(value?: string): Record<string, unknown> {
  if (!value || typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

// Raw tool names like `beu_mcp__browse_content` are too long for the
// widget's slim header (and the `ui://` URI is noise for end users), so
// show only the last segment, humanized.
function formatAppName(toolName?: string) {
  if (!toolName) return "MCP App";
  const lastSegment = toolName.split("__").pop() || toolName;
  const words = lastSegment.replace(/[_-]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "MCP App";
}

function buildToolResultPayload(tool?: { result?: string }) {
  let structuredContent: unknown = undefined;
  if (tool?.result) {
    try {
      structuredContent = JSON.parse(tool.result);
    } catch {
      // plain text fallback
    }
  }

  const content = [
    {
      type: "text" as const,
      text: typeof tool?.result === "string" ? tool.result : "",
    },
  ];

  return structuredContent !== undefined
    ? { content, structuredContent }
    : { content };
}

export interface McpAppResource {
  text?: string;
  mimeType?: string;
}

export interface McpAppRendererProps {
  /** Inline HTML content to load directly into the widget iframe. */
  initialHtml?: string;
  /** Resource URI to fetch HTML content from (e.g. "ui://dashboard" or an HTTP/API URL). */
  resourceUri?: string;
  /** Custom handler to resolve an MCP resource URI into HTML text. */
  onReadResource?: (uri: string) => Promise<McpAppResource>;
  /** Custom handler to invoke an MCP tool triggered from within the widget. */
  onCallTool?: (name: string, args?: Record<string, unknown>) => Promise<unknown>;
  /** MCP connector backing this widget. Its resource reads and tool calls
   *  go through the Persona runtime (`useMcp`). */
  mcpId?: string;
  toolName?: string;
  tool?: {
    args?: string;
    result?: string;
    status: "running" | "done" | "error";
  };
  className?: string;
  height?: number;
  /** Initial height of the inline widget; the header button always opens it
   *  full screen. */
  expanded?: boolean;
  onSendMessage?: (text: string) => void;
}

/**
 * McpAppRenderer — renders an interactive MCP App widget inside a sandboxed
 * iframe, connected via AppBridge JSON-RPC-over-postMessage.
 */
export function McpAppRenderer({
  mcpId,
  resourceUri,
  initialHtml,
  onReadResource,
  onCallTool,
  toolName,
  tool,
  className,
  height = 450,
  expanded = true,
  onSendMessage,
}: McpAppRendererProps) {
  // Reads the widget's `ui://` HTML and calls tools through the runtime
  // adapter (`/mcps/:id/resource`, `/mcps/:id/call-tool`).
  const { readResource, callTool } = useMcp();
  const wrapperRef = React.useRef<HTMLDialogElement | null>(null);
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const bridgeRef = React.useRef<AppBridge | null>(null);
  const resultSentRef = React.useRef(false);
  const onSendMessageRef = React.useRef(onSendMessage);
  onSendMessageRef.current = onSendMessage;
  const [html, setHtml] = React.useState<string | null>(initialHtml || null);
  const [loading, setLoading] = React.useState(!initialHtml);
  const [error, setError] = React.useState<string | null>(null);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [contentHeight, setContentHeight] = React.useState<number | null>(null);
  const setAppSplit = React.useContext(McpAppSplitContext)?.setSplit;

  // TEMP DEBUG — widget lifecycle trace.
  React.useEffect(() => {
    console.info("[mcp-app] mounted", {
      mcpId,
      resourceUri,
      hasInitialHtml: !!initialHtml,
      toolName,
      toolStatus: tool?.status,
    });
  }, [mcpId, resourceUri, initialHtml, toolName, tool?.status]);

  // 1. Resolve widget HTML content
  React.useEffect(() => {
    if (initialHtml) {
      setHtml(initialHtml);
      setLoading(false);
      setError(null);
      return;
    }

    if (!resourceUri) {
      setError("No HTML content or resource URI provided for MCP App");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setHtml(null);
    setContentHeight(null);

    const resolveHtml = async (): Promise<string> => {
      // 1. If custom onReadResource handler is provided by caller
      if (onReadResource) {
        const res = await onReadResource(resourceUri);
        if (!res?.text) throw new Error("Empty resource response from MCP server");
        return res.text;
      }

      // 2. If resourceUri is an HTTP URL, fetch it directly
      if (resourceUri.startsWith("http://") || resourceUri.startsWith("https://") || resourceUri.startsWith("/")) {
        console.debug("[mcp-app] resolving resource via URL", resourceUri);
        const res = await fetch(resourceUri);
        if (!res.ok) throw new Error(`Failed to fetch MCP resource (${res.status})`);
        return res.text();
      }

      // 3. `ui://` (and any other MCP resource URI) resolves through the
      // Persona runtime adapter, using the connector id the backend attached
      // to this tool call via the `mcp_app` stream event.
      if (mcpId) {
        console.info("[mcp-app] reading resource via runtime", { mcpId, resourceUri });
        const result = await readResource(resourceUri, mcpId);
        const data = result?.data ?? result;
        console.info("[mcp-app] resource response", {
          mimeType: data?.mimeType ?? null,
          textLength: typeof data?.text === "string" ? data.text.length : 0,
        });
        if (!data?.text) throw new Error("Empty resource response from MCP server");
        return data.text as string;
      }

      console.error("[mcp-app] no connector id on this tool call", { resourceUri });
      throw new Error(
        `Cannot resolve MCP resource "${resourceUri}". Provide initialHtml, onReadResource, a connector id, or a valid URL.`
      );
    };

    resolveHtml()
      .then((text) => {
        if (cancelled) return;
        console.info("[mcp-app] widget HTML resolved", { length: text.length });
        setHtml(text);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("[mcp-app] failed to resolve widget", err);
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        const msg = e?.response?.data?.message || e.message || "Failed to load MCP App";
        setError(msg);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialHtml, resourceUri, onReadResource, mcpId, readResource]);

  // 2. Wire up AppBridge and load HTML into sandboxed iframe
  React.useEffect(() => {
    if (!html || !iframeRef.current) return;

    const iframe = iframeRef.current;
    resultSentRef.current = false;

    const bridge = new AppBridge(
      null,
      { name: "persona-platform", version: "1.0.0" },
      {
        message: { text: {} },
        openLinks: {},
        serverTools: {},
        serverResources: {},
        updateModelContext: { text: {} },
      },
      {
        hostContext: {
          theme:
            typeof document !== "undefined" && document.documentElement.classList.contains("dark")
              ? "dark"
              : "light",
          platform: "web",
          displayMode: "inline",
          availableDisplayModes: ["inline"],
        },
      }
    );

    bridge.oncalltool = async (params: { name: string; arguments?: Record<string, unknown> }) => {
      console.info("[mcp-app] widget called a tool", { name: params.name, mcpId });
      if (onCallTool) {
        return onCallTool(params.name, params.arguments);
      }
      if (mcpId) {
        const json = await callTool(params.name, params.arguments, mcpId);
        console.info("[mcp-app] tool call response", { name: params.name });
        return json?.data ?? json;
      }
      console.warn("[mcp-app] tool call dropped — no connector id", { name: params.name });
      return null;
    };

    bridge.onreadresource = async (params: { uri: string }) => {
      console.info("[mcp-app] widget read a resource", { uri: params.uri, mcpId });
      if (onReadResource) {
        const res = await onReadResource(params.uri);
        return {
          contents: [
            {
              uri: params.uri,
              mimeType: res.mimeType || "text/html",
              text: res.text || "",
            },
          ],
        };
      }
      if (mcpId) {
        const result = await readResource(params.uri, mcpId);
        const data = result?.data ?? result;
        return {
          contents: [
            {
              uri: params.uri,
              mimeType: data?.mimeType || "text/html",
              text: data?.text || "",
            },
          ],
        };
      }
      return { contents: [] };
    };

    bridge.onopenlink = async ({ url }: { url: string }) => {
      if (typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      return {};
    };

    bridge.onmessage = async ({ content }) => {
      console.info("[mcp-app] widget sent a message", { content });
      if (Array.isArray(content)) {
        const text = content
          .filter(
            (b): b is { type: "text"; text: string } =>
              b?.type === "text" && typeof (b as { text?: unknown }).text === "string"
          )
          .map((b) => b.text)
          .join("\n")
          .trim();
        if (text) {
          onSendMessageRef.current?.(text);
        }
      }
      return {};
    };
    bridge.onupdatemodelcontext = async () => ({});

    bridge.oninitialized = () => {
      console.info("[mcp-app] bridge initialized — sending tool input", {
        toolStatus: tool?.status,
        hasArgs: !!tool?.args,
      });
      bridge.sendToolInput({ arguments: parseJsonObject(tool?.args) });
      if (tool?.status === "done" && typeof tool?.result === "string") {
        console.info("[mcp-app] sending tool result at init");
        resultSentRef.current = true;
        bridge.sendToolResult(buildToolResultPayload(tool));
      }
    };

    const handleSizeChange = ({ height: newHeight }: { height?: number }) => {
      if (newHeight !== undefined && newHeight !== null) {
        setContentHeight(newHeight);
      }
    };
    bridge.addEventListener("sizechange", handleSizeChange);

    let cancelled = false;
    if (iframe.contentWindow) {
      const transport = new PostMessageTransport(iframe.contentWindow, iframe.contentWindow);
      console.info("[mcp-app] connecting bridge");
      bridge
        .connect(transport)
        .then(() => {
          if (cancelled) return;
          console.info("[mcp-app] bridge connected — loading widget HTML into iframe", {
            htmlLength: html.length,
          });
          iframe.srcdoc = html;
        })
        .catch((err) => {
          if (cancelled) return;
          console.error("[mcp-app] bridge connect failed", err);
          setError(err?.message || "Failed to connect to MCP App bridge");
        });
    } else {
      console.warn("[mcp-app] iframe contentWindow unavailable — skipping bridge connect");
    }

    bridgeRef.current = bridge;

    return () => {
      cancelled = true;
      bridgeRef.current = null;
      bridge.removeEventListener("sizechange", handleSizeChange);
      bridge.close?.();
    };
  }, [html, mcpId, readResource, callTool]);

  // 3. Forward tool result once it arrives
  React.useEffect(() => {
    const bridge = bridgeRef.current;
    if (!bridge || resultSentRef.current) return;
    if (tool?.status !== "done" || typeof tool?.result !== "string") return;
    console.info("[mcp-app] forwarding late tool result to widget");
    resultSentRef.current = true;
    bridge.sendToolResult(buildToolResultPayload(tool));
  }, [tool?.status, tool?.result]);

  // Full screen is the same <dialog> promoted to the top layer with
  // `showModal()`. The iframe must stay put — the AppBridge dies if it
  // remounts — and the top layer escapes the FAB panel's transform/clipping
  // that would otherwise trap a `position: fixed` overlay.
  const enterFullscreen = React.useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    try {
      if (!el.open) el.showModal();
      console.info("[mcp-app] entered full screen", { toolName });
      // Before paint, so the chat column has already made room when the
      // dialog appears.
      setAppSplit?.(true);
      setFullscreen(true);
    } catch (err) {
      console.error("[mcp-app] failed to open full screen", err);
    }
  }, [toolName, setAppSplit]);

  const exitFullscreen = React.useCallback(() => {
    const el = wrapperRef.current;
    if (el?.open) el.close();
    setAppSplit?.(false);
    setFullscreen(false);
  }, [setAppSplit]);

  // The dialog's `close` event also fires when Escape dismisses it, so this
  // is the single place state syncs back.
  const handleDialogClose = React.useCallback(() => {
    console.info("[mcp-app] exited full screen", { toolName });
    setAppSplit?.(false);
    setFullscreen(false);
  }, [toolName, setAppSplit]);

  // A modal dialog has no default backdrop dismissal; clicks on the
  // `::backdrop` retarget to the <dialog> element itself.
  const handleDialogClick = React.useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (!fullscreen || event.target !== event.currentTarget) return;
      exitFullscreen();
    },
    [fullscreen, exitFullscreen]
  );

  // Escape reaches the window listener in `persona-chat-fab` that closes the
  // panel; while full screen, it should only exit the dialog. Capture phase
  // on window runs before that bubble-phase listener.
  React.useEffect(() => {
    if (!fullscreen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") event.stopPropagation();
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [fullscreen]);

  // Ask the chat to give the app the right side of the viewport, so the
  // conversation is squeezed to the left rather than covered. Cleanup runs
  // when the widget closes and when it unmounts while still open.
  React.useEffect(() => {
    if (!fullscreen) return;
    setAppSplit?.(true);
    return () => setAppSplit?.(false);
  }, [fullscreen, setAppSplit]);

  if (error) {
    return (
      <div
        className={cn(
          "rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive",
          className
        )}
      >
        <div className="flex items-start gap-2.5">
          <WarningCircleIcon className="size-5 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-semibold">Failed to load MCP App</p>
            <p className="mt-1 text-xs opacity-80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <dialog
      ref={wrapperRef}
      onClose={handleDialogClose}
      onClick={handleDialogClick}
      aria-label={`MCP App: ${toolName || resourceUri || "widget"}`}
      className={cn(
        "group m-0 max-w-full overflow-hidden border border-border p-0 text-foreground",
        fullscreen
          ? "fixed inset-y-0 right-0 left-auto flex h-dvh w-full max-h-none max-w-none flex-col bg-background shadow-2xl backdrop:bg-transparent md:w-3/5"
          : "relative block w-full bg-card",
        className
      )}
    >
      {/* Header bar — intentionally minimal: a short label and the
          expand/close controls. The raw tool name and `ui://` URI are
          unbreakable strings that used to widen the chat column. */}
      <div
        className={cn(
          "flex min-w-0 shrink-0 items-center justify-between gap-2 overflow-hidden border-b border-border bg-muted/40 text-xs text-muted-foreground",
          fullscreen ? "px-4 py-2.5" : "px-3 py-1.5"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <AppWindowIcon className="size-3.5 shrink-0 text-primary" />
          <span
            className="min-w-0 truncate text-[11px] font-semibold text-foreground"
            title={toolName || resourceUri}
          >
            {formatAppName(toolName || resourceUri)}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {fullscreen ? (
            <>
              <button
                type="button"
                onClick={exitFullscreen}
                className="flex size-6 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Exit full screen"
                aria-label="Exit full screen"
              >
                <ArrowsInIcon className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={exitFullscreen}
                className="flex size-6 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Close app"
                aria-label="Close app"
              >
                <XIcon className="size-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={enterFullscreen}
              className="flex size-6 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Open full screen"
              aria-label="Open full screen"
            >
              <ArrowsOutIcon className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-8 text-muted-foreground",
            fullscreen && "min-h-0 flex-1"
          )}
          style={fullscreen ? undefined : { height: `${height}px` }}
        >
          <Spinner className="size-5 text-primary" />
          <p className="text-xs">Loading MCP App…</p>
        </div>
      )}

      {/* Sandboxed iframe */}
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts allow-forms"
        onLoad={() => console.info("[mcp-app] iframe loaded", { toolName, resourceUri })}
        className={cn(
          "block w-full max-w-full border-0 bg-white dark:bg-zinc-950",
          fullscreen ? "min-h-0 flex-1" : "transition-[height] duration-200 ease-in-out",
          loading && "hidden"
        )}
        style={
          !loading && !fullscreen
            ? {
                height:
                  contentHeight !== null
                    ? `${contentHeight}px`
                    : expanded
                      ? "calc(80vh - 8rem)"
                      : `${height}px`,
                maxHeight: expanded ? "calc(90vh - 6rem)" : `${height}px`,
              }
            : undefined
        }
        title={`MCP App: ${formatAppName(toolName || resourceUri)}`}
      />
    </dialog>
  );
}
