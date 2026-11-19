import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/dostify/auth/auth-shell";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/dostify/site";

/** Shared frame for the Terms and Privacy pages: a quiet header and a readable column. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-heading font-bold">
            <BrandMark className="size-6" />
            {SITE_NAME}
          </Link>
          <nav className="flex gap-4 text-[13px] text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
        <div className="mt-8 flex flex-col gap-8 text-[15px] leading-relaxed [&_a]:underline [&_h2]:mb-2 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_ul]:mt-2 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
          {children}
        </div>
      </main>
    </div>
  );
}

/** The contact line shared by both pages. */
export function ContactLine() {
  return CONTACT_EMAIL ? (
    <p>
      Email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
    </p>
  ) : (
    <p>Contact us through the {SITE_NAME} website or app.</p>
  );
}
