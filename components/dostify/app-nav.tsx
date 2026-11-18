"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatCircleIcon, NotebookIcon, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string; icon: Icon }[] = [
  { href: "/", label: "Chat", icon: ChatCircleIcon },
  { href: "/journal", label: "Journal", icon: NotebookIcon },
];

/** The sidebar's main navigation. */
export function AppNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  // "/" and "/c/<id>" are both the chat.
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/c/") : pathname.startsWith(href);

  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {LINKS.map(({ href, label, icon: LinkIcon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <LinkIcon weight={active ? "fill" : "regular"} className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
