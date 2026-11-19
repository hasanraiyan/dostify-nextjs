"use client";

import { useSession } from "@/lib/auth-client";
import { CtaLink } from "./cta-link";

/**
 * The header's right side. The page itself is static, so it starts as
 * "Sign in / Get started" and swaps to "Open Dostify" once the session loads the
 * visitor is signed in.
 */
export function HeaderActions() {
  const { data: session } = useSession();

  if (session) {
    return <CtaLink href="/chat">Open Dostify</CtaLink>;
  }
  return (
    <>
      <CtaLink href="/sign-in" variant="ghost" className="px-3 text-muted-foreground hover:bg-transparent">
        Sign in
      </CtaLink>
      <CtaLink href="/sign-up" className="ml-1">
        Get started
      </CtaLink>
    </>
  );
}
