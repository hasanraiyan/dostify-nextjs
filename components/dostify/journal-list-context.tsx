"use client";

import * as React from "react";
import { listJournalEntries } from "@/lib/dostify/journal-list";
import type { JournalListEntry } from "@/lib/dostify/journal-types";

interface JournalListValue {
  entries: JournalListEntry[];
  /** True once the first load has finished (successfully or not). */
  loaded: boolean;
  failed: boolean;
  /** Starts the first load; later calls are no-ops. */
  ensureLoaded: () => void;
  /** Re-reads the list; the editor calls this after every save. */
  refresh: () => Promise<void>;
}

const JournalListContext = React.createContext<JournalListValue | null>(null);

/**
 * The journal list lives above the pages so the sidebar and the editor share
 * it: the sidebar shows it, the editor refreshes it after saving.
 */
export function JournalListProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = React.useState<JournalListEntry[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const started = React.useRef(false);

  const refresh = React.useCallback(async () => {
    try {
      setEntries(await listJournalEntries());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  const ensureLoaded = React.useCallback(() => {
    if (started.current) return;
    started.current = true;
    void refresh();
  }, [refresh]);

  const value = React.useMemo(
    () => ({ entries, loaded, failed, ensureLoaded, refresh }),
    [entries, loaded, failed, ensureLoaded, refresh],
  );
  return <JournalListContext.Provider value={value}>{children}</JournalListContext.Provider>;
}

export function useJournalList(): JournalListValue {
  const value = React.useContext(JournalListContext);
  if (!value) throw new Error("useJournalList must be used inside <JournalListProvider>.");
  return value;
}
