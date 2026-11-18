import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { ChatShell } from "./chat-shell";
import { syncClerkUser } from "@/lib/sync-user";

async function SyncClerkUser() {
  const { userId } = await auth();
  if (userId) {
    // Fallback sync in case the Clerk webhook was missed/delayed.
    await syncClerkUser(userId);
  }
  return null;
}

export default function ChatLayout({ children }: { children: ReactNode }) {
  // usePathname() suspends while prerendering the unknown [threadId] param;
  // the chat is client-only anyway, so stream it in behind this boundary.
  return (
    <>
      <Suspense fallback={null}>
        <SyncClerkUser />
      </Suspense>
      <Suspense fallback={null}>
        <ChatShell>{children}</ChatShell>
      </Suspense>
    </>
  );
}
