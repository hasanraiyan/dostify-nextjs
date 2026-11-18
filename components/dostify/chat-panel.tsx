"use client";

import { usePathname, useRouter } from "next/navigation";
import { ThreadListBody } from "@/components/persona/chat-sdk/thread-list";
import { useSharedThreads, useStalledFlag } from "@/components/persona/chat-sdk/threads-context";

/**
 * The chat list for the sidebar. It reads the app-wide thread list that the
 * chat itself also uses, and drives the URL like the chat's own sidebar does.
 */
export function ChatPanel({ onNavigate }: { onNavigate?: () => void }) {
  const threads = useSharedThreads();
  const router = useRouter();
  const pathname = usePathname();
  const [stalled, setStalled] = useStalledFlag(threads?.isLoading ?? false);

  if (!threads) return null;
  const activeThreadId = /^\/chat\/([^/]+)\/?$/.exec(pathname)?.[1];

  return (
    <>
      <ThreadListBody
        threads={threads.threads}
        loading={threads.isLoading}
        stalled={stalled}
        onRetry={() => {
          setStalled(false);
          void threads.refetch();
        }}
        activeThreadId={activeThreadId}
        onSelect={(id) => {
          router.push(`/chat/${id}`);
          onNavigate?.();
        }}
        onActiveThreadDeleted={() => router.push("/chat")}
        renameThread={threads.renameThread}
        deleteThread={threads.deleteThread}
      />
    </>
  );
}
