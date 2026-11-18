import { Suspense } from "react";
import type { ReactNode } from "react";
import { ChatShell } from "./chat-shell";

export default function ChatLayout({ children }: { children: ReactNode }) {
  // usePathname() suspends while prerendering the unknown [threadId] param;
  // the chat is client-only anyway, so stream it in behind this boundary.
  return (
    <Suspense fallback={null}>
      <ChatShell>{children}</ChatShell>
    </Suspense>
  );
}
