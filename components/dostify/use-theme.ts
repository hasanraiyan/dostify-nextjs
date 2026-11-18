"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  readThemePref,
  setThemePref,
  subscribeThemePref,
  type ThemePref,
} from "@/lib/dostify/theme";

/** The saved theme preference (light, dark or follow the system) and a setter. */
export function useThemePref() {
  const pref = useSyncExternalStore<ThemePref>(subscribeThemePref, readThemePref, () => "system");
  const set = useCallback((next: ThemePref) => setThemePref(next), []);
  return [pref, set] as const;
}
