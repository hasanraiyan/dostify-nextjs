import { Suspense } from "react";
import type { ReactNode } from "react";
import { UserButton } from "@clerk/nextjs";
import { DashboardNav } from "./dashboard-nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 py-4 sm:px-6">
      <header className="flex items-center justify-between gap-3">
        <span className="font-heading text-lg font-semibold">Dostify</span>
        <div className="flex items-center gap-3">
          <Suspense fallback={null}>
            <DashboardNav />
          </Suspense>
          <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 pb-8">{children}</main>
    </div>
  );
}
