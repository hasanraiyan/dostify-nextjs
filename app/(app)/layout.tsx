import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/dostify/app-shell";
import { syncClerkUser } from "@/lib/sync-user";

async function SyncClerkUser() {
  const { userId } = await auth();
  if (userId) {
    // Fallback sync in case the Clerk webhook was missed/delayed.
    await syncClerkUser(userId);
  }
  return null;
}

/** Shared by the chat and the dashboard pages: one sidebar, one set of providers. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <SyncClerkUser />
      </Suspense>
      {/* The shell reads the pathname (request-time data), so it needs a boundary. */}
      <Suspense fallback={null}>
        <AppShell>{children}</AppShell>
      </Suspense>
    </>
  );
}
