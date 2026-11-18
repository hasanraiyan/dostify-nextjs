"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ListIcon } from "@phosphor-icons/react";
import { PersonaProvider } from "@personaai/react";
import { AvatarSlotProvider } from "@/components/persona/avatar";
import { NewChatIcon } from "@/components/persona/chat-sdk";
import { SharedThreadsProvider } from "@/components/persona/chat-sdk/threads-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AccountSummary } from "./account-summary";
import { AppNav } from "./app-nav";
import { ChatPanel } from "./chat-panel";
import { JournalListProvider } from "./journal-list-context";
import { JournalPanel } from "./journal-panel";

/** The one sidebar: nav on top, the current section's list below, account at the bottom. */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const inChat = pathname === "/chat" || pathname.startsWith("/chat/");
  const inJournal = pathname.startsWith("/journal");
  // The header button creates whatever the open page is about.
  const action = inChat
    ? { href: "/chat", label: "New chat" }
    : inJournal
      ? { href: "/journal/new", label: "New entry" }
      : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
        <span className="font-heading text-lg font-semibold">Dostify</span>
        {action && (
          <Link
            href={action.href}
            onClick={onNavigate}
            aria-label={action.label}
            title={action.label}
            className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
          >
            <NewChatIcon className="size-4" />
          </Link>
        )}
      </div>
      <div className="px-2 pb-2">
        <AppNav onNavigate={onNavigate} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col border-t">
        {inChat && <ChatPanel onNavigate={onNavigate} />}
        {inJournal && <JournalPanel onNavigate={onNavigate} />}
      </div>
      <div className="border-t p-3">
        <AccountSummary onNavigate={onNavigate} />
      </div>
    </div>
  );
}

/**
 * Wraps every signed-in page: shared Persona provider and lists, the sidebar
 * (a drawer on phones), and the page content beside it.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <PersonaProvider
      baseUrl="/api/persona"
      defaultAgentId={process.env.NEXT_PUBLIC_PERSONA_AGENT_ID}
      logLevel="debug"
    >
      <AvatarSlotProvider>
        <SharedThreadsProvider>
          <JournalListProvider>
          <div className="flex h-dvh w-full">
            <aside className="my-2 ml-2 hidden w-64 shrink-0 overflow-hidden rounded-2xl border bg-card md:block">
              <SidebarContent />
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
              <header className="flex shrink-0 items-center gap-2 border-b p-2 md:hidden">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                  aria-label="Open menu"
                  onClick={() => setMenuOpen(true)}
                >
                  <ListIcon className="size-4" />
                </Button>
                <span className="font-heading text-base font-semibold">Dostify</span>
              </header>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
            </div>
          </div>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetContent
              side="left"
              showCloseButton={false}
              className="flex h-full min-h-0 flex-col overflow-hidden rounded-r-2xl p-0 data-[side=left]:w-72 data-[side=left]:max-w-[85vw]"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <SidebarContent onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </JournalListProvider>
      </SharedThreadsProvider>
    </AvatarSlotProvider>
  </PersonaProvider>
  );
}
