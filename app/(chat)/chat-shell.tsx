"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { PersonaProvider } from "@personaai/react";
import { UserButton, useUser } from "@clerk/nextjs";
import { ChatCircleIcon } from "@phosphor-icons/react";
import { PersonaChatView, PersonaFrontendTools } from "@/components/persona/chat-sdk";
import { AGENTS, DEFAULT_VOICE_AGENT_ID } from "@/app/agents";

/**
 * The chat lives in the `(chat)` layout, not in a page, so navigating between
 * the new-chat URL (`/`) and a thread URL (`/c/<threadId>`) never unmounts it.
 * The URL is just a reflection of the active thread: `/` = ephemeral new chat,
 * `/c/<id>` = an existing thread.
 */
function AccountFooter() {
  const { user } = useUser();
  if (!user) return null;

  return (
    <div className="flex items-center gap-2 p-2">
      <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">
          {user.fullName || user.username || "Signed in"}
        </p>
        {user.primaryEmailAddress && (
          <p className="truncate text-[11px] text-muted-foreground">
            {user.primaryEmailAddress.emailAddress}
          </p>
        )}
      </div>
    </div>
  );
}

export function ChatShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const threadId = React.useMemo(() => /^\/c\/([^/]+)\/?$/.exec(pathname)?.[1], [pathname]);

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
    [pathname, router]
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
          voiceAgentId={process.env.NEXT_PUBLIC_PERSONA_VOICE_AGENT_ID || DEFAULT_VOICE_AGENT_ID}
          voiceEnvironment="production"
          agents={AGENTS}
          threadId={threadId}
          onThreadChange={handleThreadChange}
          title="Support Chat"
          threadListCollapsible
          threadListFooter={<AccountFooter />}
          emptyTitle="How can I help you today?"
          starterPrompts={[
            { label: "What can you do?", icon: ChatCircleIcon, template: "What can you do?" },
          ]}
        />
      </div>
      {children}
    </PersonaProvider>
  );
}
