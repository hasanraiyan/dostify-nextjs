"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { BRAND } from "@/lib/dostify/brand";

const input =
  "h-11 w-full rounded-lg border border-[#D9CBC2] bg-white px-3 text-sm text-[#2B1F1A] outline-none placeholder:text-[#9A8B82] focus:border-[#D9532B] focus:ring-[3px] focus:ring-[#D9532B]/20";

/** Email + password form for both sign-in and sign-up (cookie session, works in the Capacitor WebView). */
export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const isUp = mode === "sign-up";

  // Only same-site paths are honoured as a post-login destination.
  const redirect = params.get("redirect");
  const next = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/chat";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const { error } = isUp
      ? await authClient.signUp.email({
          email,
          password,
          name: String(form.get("name") ?? "").trim() || email.split("@")[0],
        })
      : await authClient.signIn.email({ email, password });
    setPending(false);
    if (error) {
      setError(error.message ?? "Something went wrong. Try again.");
      return;
    }
    // When this sign-in came from an MCP/OAuth authorize request (signed query
    // present), the OAuth client plugin has already redirected back to continue it.
    if (!params.get("sig")) router.replace(next);
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-3">
      {isUp && (
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Name
          <input name="name" autoComplete="name" required className={input} placeholder="Your name" />
        </label>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <input name="email" type="email" autoComplete="email" required className={input} placeholder="you@example.com" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          autoComplete={isUp ? "new-password" : "current-password"}
          minLength={8}
          required
          className={input}
          placeholder="At least 8 characters"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-11 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: BRAND.coral }}
      >
        {pending ? "Please wait…" : isUp ? "Create account" : "Sign in"}
      </button>
      <p className="text-center text-sm text-[#6B5B52]">
        {isUp ? "Already have an account? " : "New here? "}
        <Link
          href={{ pathname: isUp ? "/sign-in" : "/sign-up", search: params.toString() }}
          className="font-semibold underline"
        >
          {isUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
