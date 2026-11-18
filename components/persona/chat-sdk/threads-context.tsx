"use client";

import * as React from "react";
import { useThreads } from "@personaai/react";

type ThreadsApi = ReturnType<typeof useThreads>;

const SharedThreadsContext = React.createContext<ThreadsApi | null>(null);

/**
 * One thread list for the whole app. The chat widget and the app sidebar both
 * read it, so a new chat or an auto-generated title shows up in the sidebar
 * without a second fetch.
 */
export function SharedThreadsProvider({ children }: { children: React.ReactNode }) {
  const api = useThreads();
  return <SharedThreadsContext.Provider value={api}>{children}</SharedThreadsContext.Provider>;
}

/** The shared thread list, or null when there is no <SharedThreadsProvider>. */
export function useSharedThreads(): ThreadsApi | null {
  return React.useContext(SharedThreadsContext);
}

/**
 * The SDK's thread fetch has no timeout, so a stalled request would leave a
 * skeleton up forever. Flags it after a while so the UI can offer a retry.
 */
export function useStalledFlag(loading: boolean, afterMs = 12_000) {
  const [stalled, setStalled] = React.useState(false);
  React.useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setStalled(true), afterMs);
    // Reset in cleanup so the flag clears as soon as loading ends or restarts.
    return () => {
      clearTimeout(timer);
      setStalled(false);
    };
  }, [loading, afterMs]);
  return [stalled, setStalled] as const;
}
