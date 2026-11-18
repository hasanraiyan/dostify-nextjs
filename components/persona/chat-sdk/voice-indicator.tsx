"use client";

import * as React from "react";
import { Orb, type OrbState } from "orb-ui";
import { cn } from "@/lib/utils";
import type { PersonaVoiceState, UseVoiceResult } from "@personaai/react";
import type { Avatar, AvatarPack } from "@personaai/avatar";
import { AnimeVoiceAvatar } from "../avatar";

// Orb's own state union has no "ended" — a finished call reads as idle.
function toOrbState(state: PersonaVoiceState): OrbState {
  return state === "ended" ? "idle" : state;
}

export interface VoiceIndicatorProps {
  state: PersonaVoiceState;
  /** Optional useVoice result for deep avatar audio & transcript synchronization */
  voice?: Partial<UseVoiceResult>;
  volume?: number;
  size?: number;
  className?: string;
  /** Avatar pack to use when variant is avatar (default: sakura, via AnimeVoiceAvatar) */
  pack?: AvatarPack;
  /** Display style: 'avatar' renders the 2D anime avatar, 'orb' renders the minimal orb */
  variant?: "avatar" | "orb";
  /** The avatar instance (avatar variant only): given when ready, null when it goes away. */
  onAvatarReady?: (avatar: Avatar | null) => void;
}

/**
 * Animated voice-state indicator:
 * Supports either the 2D interactive anime avatar with lip-sync and physics,
 * or the classic minimal orb-ui.
 */
function VoiceIndicator({
  state,
  voice,
  volume = 0,
  size = 28,
  className,
  pack,
  variant = "avatar",
  onAvatarReady,
}: VoiceIndicatorProps) {
  if (variant === "avatar" && size >= 60) {
    return (
      <div
        className={cn(
          "flex animate-in fade-in zoom-in-95 items-center justify-center duration-300",
          className,
        )}
      >
        <AnimeVoiceAvatar
          pack={pack}
          voice={voice}
          state={state}
          volume={volume}
          size={size}
          onAvatarReady={onAvatarReady}
          className="bg-transparent"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex animate-in fade-in zoom-in-95 items-center justify-center duration-300",
        className,
      )}
    >
      <div className="flex items-center justify-center">
        <Orb
          state={toOrbState(state)}
          theme="cloud"
          size={size}
          interactive={false}
          aria-label={`Voice ${state}`}
        />
      </div>
    </div>
  );
}

export { VoiceIndicator };
