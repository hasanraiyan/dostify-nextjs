import Link from "next/link";
import { BrandMark } from "@/components/dostify/auth/auth-shell";
import { SITE_NAME } from "@/lib/dostify/site";
import { Year } from "./year";

type FooterLink = { label: string; href: string; external?: boolean };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Dostify",
    links: [
      { label: "How it works", href: "#how" },
      { label: "The journal", href: "#journal" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Create account", href: "/sign-up" },
      { label: "Sign in", href: "/sign-in" },
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
  {
    title: "Need to talk now?",
    links: [
      { label: "Tele-MANAS 14416", href: "tel:14416", external: true },
      { label: "KIRAN 1800-599-0019", href: "tel:18005990019", external: true },
      { label: "Emergency 112", href: "tel:112", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-[1180px] px-4 pt-12 pb-8 sm:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="col-span-2 flex flex-col gap-3 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="flex w-fit items-center gap-2 font-heading font-bold">
              <BrandMark className="size-6" />
              {SITE_NAME}
            </Link>
            <p className="max-w-[32ch] text-[13px] leading-relaxed text-muted-foreground">
              An AI friend who listens and gets things done. Not a therapist, a doctor or a replacement
              for professional help.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-2.5 text-[13px]">
              <span className="font-medium text-foreground">{col.title}</span>
              {col.links.map((l) =>
                l.external ? (
                  <a key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground">
                    {l.label}
                  </a>
                ) : l.href.startsWith("#") ? (
                  <a key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground">
                    {l.label}
                  </a>
                ) : (
                  <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                ),
              )}
            </nav>
          ))}
        </div>

        <div className="mt-12 border-t pt-6 text-[13px] text-muted-foreground">
          &copy; <Year /> Dostify. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
