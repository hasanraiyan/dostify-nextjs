import { sakura, pebble, type AvatarPack } from "@personaai/avatar";
import { scarlet } from "@/components/persona/avatar/scarlet";

export type AvatarId = "sakura" | "scarlet" | "pebble";

export interface AvatarOption {
  id: AvatarId;
  name: string;
  badge: string;
  description: string;
  pack: AvatarPack;
  previewColor: string;
}

export const AVATAR_OPTIONS: readonly AvatarOption[] = [
  {
    id: "sakura",
    name: "Sakura",
    badge: "Anime (Default)",
    description: "Friendly anime companion with expressive eyes, animated arms, and warm reactions.",
    pack: sakura,
    previewColor: "from-pink-500/20 to-rose-500/10",
  },
  {
    id: "scarlet",
    name: "Scarlet",
    badge: "Platform Anime",
    description: "Striking crimson-haired anime character with expressive almond eyes and rich lip-sync.",
    pack: scarlet,
    previewColor: "from-red-600/20 to-orange-500/10",
  },
  {
    id: "pebble",
    name: "Pebble",
    badge: "Playful Mascot",
    description: "Minimalist round mascot with smooth morphing visemes and cute playful animations.",
    pack: pebble,
    previewColor: "from-amber-500/20 to-stone-500/10",
  },
] as const;

export function getAvatarPack(id?: string | null): AvatarPack {
  if (id === "scarlet") return scarlet;
  if (id === "pebble") return pebble;
  return sakura;
}

export function isValidAvatarId(id: string): id is AvatarId {
  return id === "sakura" || id === "scarlet" || id === "pebble";
}
