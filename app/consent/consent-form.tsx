"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

/** Shown when an MCP client (e.g. Claude) asks to use the user's Dostify tools. */
export function ConsentForm() {
  const scope = useSearchParams().get("scope") ?? "";
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function decide(accept: boolean) {
    setBusy(true);
    setError(null);
    // On success the OAuth client plugin redirects back to the requesting app.
    const { error } = await authClient.oauth2.consent({ accept });
    if (error) {
      setError(error.message ?? "Could not complete the request.");
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="font-heading text-xl font-semibold">Allow access to Dostify?</h1>
      <p className="text-sm text-muted-foreground">
        An app wants to use your Dostify account{scope ? ` (${scope.split(" ").join(", ")})` : ""}: your journal and
        profile tools.
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() => decide(true)}
          className="h-10 flex-1 rounded-lg bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          Allow
        </button>
        <button
          disabled={busy}
          onClick={() => decide(false)}
          className="h-10 flex-1 rounded-lg border text-sm font-semibold disabled:opacity-60"
        >
          Deny
        </button>
      </div>
    </>
  );
}
