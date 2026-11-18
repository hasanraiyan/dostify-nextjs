import { Suspense } from "react";
import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { syncClerkUser } from "@/lib/sync-user";

async function SyncClerkUser() {
  const { userId } = await auth();
  if (userId) {
    // Fallback sync in case the Clerk webhook was missed/delayed.
    await syncClerkUser(userId);
  }
  return null;
}

export default function AssistantLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <SyncClerkUser />
      </Suspense>
      {children}
    </>
  );
}
