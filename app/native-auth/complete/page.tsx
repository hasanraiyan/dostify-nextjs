"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import { VERIFIER_KEY } from "@/components/dostify/native-auth";

/** Last step of the app's browser sign-in: turn the code into a session inside the app. */
function Complete() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useSignIn();
  const [error, setError] = React.useState<string | null>(null);
  const started = React.useRef(false);

  React.useEffect(() => {
    const code = params.get("code");
    if (!signIn || started.current) return;
    started.current = true;

    (async () => {
      const verifier = localStorage.getItem(VERIFIER_KEY);
      if (!code || !verifier) throw new Error("This sign-in link is no longer valid.");

      const res = await fetch("/api/native-auth/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, verifier }),
      });
      if (!res.ok) throw new Error("This sign-in link expired. Please try again.");
      const { ticket } = (await res.json()) as { ticket: string };
      localStorage.removeItem(VERIFIER_KEY);

      const ticketResult = await signIn.ticket({ ticket });
      if (ticketResult.error) throw new Error(ticketResult.error.message);
      const done = await signIn.finalize({ navigate: () => router.replace("/chat") });
      if (done.error) throw new Error(done.error.message);
    })().catch((e: unknown) => setError(e instanceof Error ? e.message : "Sign-in failed."));
  }, [params, router, signIn]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      {error ? (
        <>
          <p className="text-sm text-destructive">{error}</p>
          <Link href="/sign-in" className="text-sm underline">Back to sign in</Link>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      )}
    </main>
  );
}

export default function NativeAuthCompletePage() {
  return (
    <Suspense>
      <Complete />
    </Suspense>
  );
}
