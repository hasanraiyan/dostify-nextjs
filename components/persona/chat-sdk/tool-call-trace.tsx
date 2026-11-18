"use client";

import * as React from "react";
import { ItemGroup } from "@/components/ui/item";
import { ToolCallCard } from "./tool-call-card";
import { McpAppRenderer } from "./mcp-app-renderer";
import { renderDostifyTool } from "./dostify-tool-ui";
import { toolCallStatus } from "./tool-status";
import { useRenderToolCall, type PersonaToolCall, type PersonaTodo } from "@personaai/react";

// TEMP DEBUG — one console line per state change of each tool call, so the
// dev terminal shows whether the backend attached `mcpApp` (mcp_app event)
// or the call streamed without widget metadata.
const loggedToolCalls = new Map<string, string>();

function logToolCall(tc: PersonaToolCall) {
  const hasWidget = !!tc.mcpApp?.resourceUri;
  const status = toolCallStatus(tc);
  const signature = `${status}|${hasWidget ? "widget" : "none"}`;
  if (loggedToolCalls.get(tc.toolCallId) === signature) return;
  loggedToolCalls.set(tc.toolCallId, signature);
  console.info("[mcp-app] tool call", {
    toolCallId: tc.toolCallId,
    toolName: tc.toolName,
    status,
    hasWidget,
    mcpApp: tc.mcpApp,
  });
  if (!hasWidget && tc.toolName.includes("__")) {
    console.warn("[mcp-app] MCP tool call has no widget metadata", {
      toolCallId: tc.toolCallId,
      toolName: tc.toolName,
    });
  }
}

// Background / animation tools that should never render in the chat transcript.
const HIDDEN_TOOL_NAMES = new Set([
  "set_avatar_emotion",
  "trigger_avatar_reaction",
]);

function ToolCallTrace({
  toolCalls,
  todos,
  onOpenSubagent,
  onOpenWorkspaceFile,
  onSendMessage,
}: {
  toolCalls: PersonaToolCall[];
  todos?: PersonaTodo[];
  onOpenSubagent?: (toolCallId: string) => void;
  /** present_file's card calls this when the user clicks its Open button — no longer an auto-fired side effect. */
  onOpenWorkspaceFile?: (path: string) => void;
  onSendMessage?: (text: string) => void;
}) {
  // Custom UIs registered with useRenderTool / useFrontendTool({ render }) /
  // useHumanInTheLoop / useComponent (see frontend-tools.tsx). Called before
  // the early return to keep hook order stable.
  const renderToolCall = useRenderToolCall();

  if (!toolCalls.length) return null;

  // One ItemGroup per run of tool calls. An MCP App block used to flush the
  // current group so it could stand alone, which split a run of consecutive
  // calls into two visually separate clusters around it — it now renders
  // inside the same group, keeping the sequence intact.
  const elements: React.ReactNode[] = [];
  let currentGroup: React.ReactNode[] = [];
  let groupKey: string | undefined;

  const flushGroup = () => {
    if (currentGroup.length === 0) return;
    elements.push(
      <ItemGroup key={`group-${groupKey}`} className="gap-1.5!">
        {currentGroup}
      </ItemGroup>
    );
    currentGroup = [];
    groupKey = undefined;
  };

  for (const tc of toolCalls) {
    if (HIDDEN_TOOL_NAMES.has(tc.toolName)) {
      continue;
    }
    logToolCall(tc);
    groupKey ??= tc.toolCallId;
    // A renderer registered with the SDK wins; then our own cards; else null.
    const customUi = renderToolCall(tc) ?? renderDostifyTool(tc);
    if (customUi) {
      currentGroup.push(
        // p-px: Card draws its outline as `ring-1` (a box-shadow *outside* the
        // box), and the chat scroll viewport clips overflow — flush against its
        // left edge the ring's left side was cut off. 1px of room keeps it.
        <div key={`tool-ui-${tc.toolCallId}`} className="w-full p-px">
          {customUi}
        </div>
      );
    } else if (tc.mcpApp?.resourceUri) {
      currentGroup.push(
        <div key={`mcp-app-${tc.toolCallId}`} className="w-full">
          <McpAppRenderer
            mcpId={tc.mcpApp.mcpId || ""}
            resourceUri={tc.mcpApp.resourceUri || ""}
            toolName={tc.toolName}
            tool={{ args: tc.args, result: tc.result, status: toolCallStatus(tc) }}
            onSendMessage={onSendMessage}
          />
        </div>
      );
    } else {
      currentGroup.push(
        <ToolCallCard
          key={tc.toolCallId}
          toolCall={tc}
          todos={todos}
          onOpenSubagent={onOpenSubagent}
          onOpenFile={onOpenWorkspaceFile}
        />
      );
    }
  }
  flushGroup();

  if (elements.length === 0) return null;

  return <div className="flex flex-col gap-1.5">{elements}</div>;
}

export { ToolCallTrace };

