import { Suspense } from "react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/dostify/app-shell";

/** Shared by the chat and the dashboard pages: one sidebar, one set of providers. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* The shell reads the pathname (request-time data), so it needs a boundary. */}
      <Suspense fallback={null}>
        <AppShell>{children}</AppShell>
      </Suspense>
    </>
  );
}
