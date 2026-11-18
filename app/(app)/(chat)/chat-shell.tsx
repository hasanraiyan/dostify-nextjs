"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ListIcon } from "@phosphor-icons/react";
import { useAppMenu } from "@/components/dostify/app-shell";
import { Button } from "@/components/ui/button";
import {
  NewChatIcon,
  PersonaChatView,
  PersonaFrontendTools,
} from "@/components/persona/chat-sdk";
import { AGENTS, DEFAULT_VOICE_AGENT_ID } from "@/app/agents";

/**
 * The chat lives in the `(chat)` layout, not in a page, so navigating between
 * the new-chat URL (`/chat`) and a thread URL (`/chat/<threadId>`) never unmounts it.
 * The URL is just a reflection of the active thread: `/` = ephemeral new chat,
 * `/chat/<id>` = an existing thread.
 */
export function ChatShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const appMenu = useAppMenu();

  const threadId = React.useMemo(
    () => /^\/chat\/([^/]+)\/?$/.exec(pathname)?.[1],
    [pathname],
  );

  const handleThreadChange = React.useCallback(
    (id: string | undefined) => {
      if (!id) {
        if (pathname !== "/chat") router.push("/chat");
        return;
      }
      const target = `/chat/${id}`;
      if (pathname === target) return;
      // The first message mints the thread while the URL is still `/`: replace
      // so Back doesn't land on the now-used empty composer.
      if (pathname === "/chat") router.replace(target);
      else router.push(target);
    },
    [pathname, router],
  );

  return (
    <>
      {/* Browser-side tools the agent can call (needs the agent's Frontend Tools setting). */}
      <PersonaFrontendTools />
      {/* Fills the space beside the app sidebar. `min-h-0` lets it shrink
          instead of pushing the composer off-screen on phones. */}
      <div className="min-h-0 w-full flex-1">
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
          showThreadList={false}
          centerComposerWhenEmpty
          headerLeading={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full md:hidden"
              aria-label="Open menu"
              onClick={() => appMenu?.openMenu()}
            >
              <ListIcon />
            </Button>
          }
          headerActions={
            <Link
              href="/chat"
              aria-label="New chat"
              title="New chat"
              className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 md:hidden"
            >
              <NewChatIcon className="size-4" />
            </Link>
          }
        />
      </div>
      {children}
    </>
  );
}
