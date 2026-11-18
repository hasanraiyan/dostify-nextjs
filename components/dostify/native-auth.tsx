"use client";

import * as React from "react";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const VERIFIER_KEY = "dostify_native_verifier";

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** True only inside the Android/iOS app shell (false on the web and during SSR). */
export function useIsNativeApp() {
  return React.useSyncExternalStore(
    () => () => {},
    () => Capacitor.isNativePlatform(),
    () => false,
  );
}

/**
 * Mounted once in the root layout. When the browser sign-in finishes and the
 * dostify:// link opens the app, close the browser tab and finish sign-in here.
 */
export function NativeAuthBridge() {
  const router = useRouter();
  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handle = App.addListener("appUrlOpen", ({ url }) => {
      if (!url.startsWith("dostify://auth")) return;
      const code = new URL(url).searchParams.get("code");
      if (!code) return;
      void Browser.close().catch(() => {});
      router.push(`/native-auth/complete?code=${encodeURIComponent(code)}`);
    });
    return () => {
      void handle.then((h) => h.remove());
    };
  }, [router]);
  return null;
}

/** Inside the app, Google blocks sign-in in the WebView, so sign in via the phone's browser instead. */
export function NativeAuthGate({ children }: { children: React.ReactNode }) {
  const native = useIsNativeApp();
  const [busy, setBusy] = React.useState(false);

  if (!native) return <>{children}</>;

  const openBrowser = async () => {
    setBusy(true);
    try {
      const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
      localStorage.setItem(VERIFIER_KEY, verifier);
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
      const challenge = b64url(new Uint8Array(digest));
      await Browser.open({
        url: `${window.location.origin}/native-auth/handoff?challenge=${challenge}`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Button size="lg" className="h-12 w-full rounded-full" disabled={busy} onClick={() => void openBrowser()}>
        Continue in browser
      </Button>
      <p className="text-sm text-muted-foreground">
        Google sign-in opens in your browser, then brings you back here.
      </p>
    </div>
  );
}

export { VERIFIER_KEY };
