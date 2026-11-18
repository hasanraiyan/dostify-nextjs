import { sakura, type AvatarPack } from "@personaai/avatar";
import { scarlet } from "@/components/persona/avatar/scarlet";

export type AvatarId = "sakura" | "scarlet" | "orb";

export interface AvatarOption {
  id: AvatarId;
  name: string;
  pack?: AvatarPack;
}

export const AVATAR_OPTIONS: readonly AvatarOption[] = [
  { id: "sakura", name: "Sakura", pack: sakura },
  { id: "scarlet", name: "Scarlet", pack: scarlet },
  { id: "orb", name: "Orb" },
] as const;

/** Anything not recognised (including a choice saved before an avatar was removed) falls back to Sakura. */
export function getAvatarPack(id?: string | null): AvatarPack {
  return id === "scarlet" ? scarlet : sakura;
}

export function isValidAvatarId(id: string): id is AvatarId {
  return id === "sakura" || id === "scarlet" || id === "orb";
}
