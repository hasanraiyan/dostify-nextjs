"use client";

import * as React from "react";
import { McpConnectionNotice } from "@/components/persona/chat-sdk/mcp-connect-banner";
import { McpConnectionsList } from "@/components/persona/chat-sdk/mcp-connections-dialog";
import { useMcpConnect } from "@/components/persona/chat-sdk/use-mcp-connect";
import { AGENTS } from "@/app/agents";

/** How long a success notice stays before clearing itself; failures stay until dismissed. */
const SUCCESS_NOTICE_MS = 8000;

export function ConnectorsView() {
  const { connections, unconnected, disconnect, isLoading, connect, notice, dismissNotice } =
    useMcpConnect({ agentId: AGENTS[0].agentId });

  React.useEffect(() => {
    if (notice?.kind !== "success") return;
    const timer = setTimeout(dismissNotice, SUCCESS_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice, dismissNotice]);

  const connected = connections.length - unconnected.length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Connectors</h1>
        <p className="text-sm text-muted-foreground">
          Connect your accounts so Dostify can use them for you.
          {connections.length > 0 && ` ${connected} of ${connections.length} connected.`}
        </p>
      </div>

      {notice && <McpConnectionNotice notice={notice} onDismiss={dismissNotice} className="rounded-xl" />}

      <div className="overflow-hidden rounded-2xl border bg-card">
        <McpConnectionsList
          connections={connections}
          isLoading={isLoading}
          onConnect={connect}
          onRevoke={disconnect}
          justConnectedMcpId={notice?.kind === "success" ? notice.mcpId : undefined}
        />
      </div>
    </div>
  );
}
