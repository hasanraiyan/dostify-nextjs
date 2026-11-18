"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  readAvatarPref,
  setAvatarPref,
  subscribeAvatarPref,
} from "@/lib/dostify/avatar-pref";
import type { AvatarId } from "@/lib/dostify/avatar-config";
import { getAvatarPack } from "@/lib/dostify/avatar-config";

/**
 * Returns the currently active avatar preference (and AvatarPack) with a setter.
 * Reacts instantly across all tabs, components, voice docks, and chat views.
 */
export function useAvatarPref(initialId?: AvatarId) {
  const avatarId = useSyncExternalStore<AvatarId>(
    subscribeAvatarPref,
    readAvatarPref,
    () => initialId ?? "sakura",
  );

  const setAvatar = useCallback((nextId: AvatarId) => {
    setAvatarPref(nextId);
  }, []);

  const pack = getAvatarPack(avatarId);

  return {
    avatarId,
    pack,
    setAvatar,
  };
}
