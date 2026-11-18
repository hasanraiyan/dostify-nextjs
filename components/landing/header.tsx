import Link from "next/link";
import { BrandMark } from "@/components/dostify/auth/auth-shell";
import { SITE_NAME } from "@/lib/dostify/site";
import { HeaderActions } from "./header-actions";

const NAV = [
  { href: "#journal", label: "Journal" },
  { href: "#faq", label: "FAQ" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4 sm:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 rounded-md font-heading text-[17px] font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <BrandMark className="size-7" />
          {SITE_NAME}
        </Link>
        <nav aria-label="Main" className="flex shrink-0 items-center gap-0.5 text-[15px] whitespace-nowrap sm:gap-2">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hidden rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
            >
              {item.label}
            </a>
          ))}
          <HeaderActions />
        </nav>
      </div>
    </header>
  );
}
