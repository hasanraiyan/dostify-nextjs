"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatCircleIcon, NotebookIcon, UserIcon, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string; icon: Icon }[] = [
  { href: "/", label: "Chat", icon: ChatCircleIcon },
  { href: "/journal", label: "Journal", icon: NotebookIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

/** `column` is the sidebar (laptops); `row` is the compact header (phones). */
export function DashboardNav({ orientation = "row" }: { orientation?: "row" | "column" }) {
  const pathname = usePathname();
  const column = orientation === "column";

  return (
    <nav
      className={cn("flex gap-1", column ? "flex-col" : "items-center")}
      aria-label="Main"
    >
      {LINKS.map(({ href, label, icon: LinkIcon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 text-sm font-medium transition-colors",
              column ? "rounded-xl px-3 py-2" : "rounded-full px-3 py-1.5",
              active
                ? column
                  ? "bg-primary/15 text-foreground"
                  : "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {column && <LinkIcon weight={active ? "fill" : "regular"} className="size-4" />}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
