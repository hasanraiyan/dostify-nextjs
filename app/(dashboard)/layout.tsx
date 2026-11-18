import { Suspense } from "react";
import type { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import { AccountSummary } from "@/components/dostify/account-summary";
import { DashboardNav } from "./dashboard-nav";

/**
 * Laptops: a rounded sidebar (nav + account) beside the page, matching the
 * chat's sidebar. Phones: the sidebar becomes a compact header.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 m-2 hidden h-[calc(100dvh-1rem)] w-60 shrink-0 flex-col rounded-2xl border bg-card md:flex">
        <span className="p-4 font-heading text-lg font-semibold">Dostify</span>
        <div className="flex-1 px-2">
          <Suspense fallback={null}>
            <DashboardNav orientation="column" />
          </Suspense>
        </div>
        <div className="border-t p-3">
          <AccountSummary />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:px-6">
        <header className="flex items-center justify-between gap-3 md:hidden">
          <span className="font-heading text-lg font-semibold">Dostify</span>
          <div className="flex items-center gap-3">
            <Suspense fallback={null}>
              <DashboardNav />
            </Suspense>
            <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4">{children}</main>
      </div>
    </div>
  );
}
