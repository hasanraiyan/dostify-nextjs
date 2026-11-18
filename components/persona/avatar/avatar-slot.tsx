"use client";

import * as React from "react";
import type { Avatar } from "@personaai/avatar";

/**
 * Lets the avatar that is on screen be reached from elsewhere in the tree. The voice
 * dock renders the avatar; the assistant's tool registration needs the same instance so
 * the agent can emote and gesture. Wrap both in one provider; without a provider the slot is
 * simply absent and nothing breaks.
 */
interface AvatarSlot {
  avatar: Avatar | null;
  setAvatar: (avatar: Avatar | null) => void;
}

export const AvatarSlotContext = React.createContext<AvatarSlot | null>(null);

export function AvatarSlotProvider({ children }: { children: React.ReactNode }) {
  const [avatar, setAvatar] = React.useState<Avatar | null>(null);
  const value = React.useMemo(() => ({ avatar, setAvatar }), [avatar]);
  return <AvatarSlotContext.Provider value={value}>{children}</AvatarSlotContext.Provider>;
}

/** The avatar currently published to the slot, or null. */
export function useSlottedAvatar(): Avatar | null {
  return React.useContext(AvatarSlotContext)?.avatar ?? null;
}
