import type { ReactNode } from "react";

/** Page area beside the app sidebar (see AppShell in the (app) layout). */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:px-6">{children}</div>;
}
