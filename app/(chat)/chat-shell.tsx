"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PersonaProvider } from "@personaai/react";
import { AccountSummary } from "@/components/dostify/account-summary";
import {
  ChatCircleIcon,
  HeartIcon,
  NotebookIcon,
  WindIcon,
} from "@phosphor-icons/react";
import {
  PersonaChatView,
  PersonaFrontendTools,
} from "@/components/persona/chat-sdk";
import { AGENTS, DEFAULT_VOICE_AGENT_ID } from "@/app/agents";

/**
 * The chat lives in the `(chat)` layout, not in a page, so navigating between
 * the new-chat URL (`/`) and a thread URL (`/c/<threadId>`) never unmounts it.
 * The URL is just a reflection of the active thread: `/` = ephemeral new chat,
 * `/c/<id>` = an existing thread.
 */
function AccountFooter() {
  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex gap-1">
        {[
          { href: "/journal", label: "Journal" },
          { href: "/profile", label: "Profile" },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 rounded-full bg-muted px-3 py-1.5 text-center text-xs font-medium transition-colors hover:bg-accent"
          >
            {label}
          </Link>
        ))}
      </div>
      <AccountSummary />
    </div>
  );
}

export function ChatShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const threadId = React.useMemo(
    () => /^\/c\/([^/]+)\/?$/.exec(pathname)?.[1],
    [pathname],
  );

  const handleThreadChange = React.useCallback(
    (id: string | undefined) => {
      if (!id) {
        if (pathname !== "/") router.push("/");
        return;
      }
      const target = `/c/${id}`;
      if (pathname === target) return;
      // The first message mints the thread while the URL is still `/`: replace
      // so Back doesn't land on the now-used empty composer.
      if (pathname === "/") router.replace(target);
      else router.push(target);
    },
    [pathname, router],
  );

  return (
    <PersonaProvider
      baseUrl="/api/persona"
      defaultAgentId={process.env.NEXT_PUBLIC_PERSONA_AGENT_ID}
      logLevel="debug"
    >
      {/* Browser-side tools the agent can call (needs the agent's Frontend Tools setting). */}
      <PersonaFrontendTools />
      {/* `dvh` instead of `vh` so mobile browser chrome doesn't push the
          composer off-screen; `w-full` avoids the horizontal scrollbar
          `w-screen` causes when a vertical scrollbar is present. */}
      <div className="h-dvh w-full">
        <PersonaChatView
          agentId={AGENTS[0].agentId}
          voiceAgentId={
            process.env.NEXT_PUBLIC_PERSONA_VOICE_AGENT_ID ||
            DEFAULT_VOICE_AGENT_ID
          }
          voiceEnvironment="production"
          agents={AGENTS}
          threadId={threadId}
          onThreadChange={handleThreadChange}
          title="Dostify"
          threadListCollapsible
          threadListFooter={<AccountFooter />}
          emptyTitle="What's on your mind?"
          emptyDescription="Talk, vent, or ask for help. I can also keep your journal."
          starterPrompts={[
            { label: "I need to vent", icon: HeartIcon, template: "I need to vent for a bit" },
            { label: "Help me calm down", icon: WindIcon, template: "I'm stressed. Can you help me calm down?" },
            { label: "Write in my journal", icon: NotebookIcon, template: "I want to write something in my journal" },
            { label: "What can you do?", icon: ChatCircleIcon, template: "What can you do?" },
          ]}
        />
      </div>
      {children}
    </PersonaProvider>
  );
}
