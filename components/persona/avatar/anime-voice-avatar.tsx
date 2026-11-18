"use client";

import * as React from "react";
import type { PersonaVoiceState, UseVoiceResult } from "@personaai/react";
import { sakura, type Avatar, type AvatarPack } from "@personaai/avatar";
import { mapVoiceState, useVoiceAvatar } from "@personaai/avatar/persona";
import { cn } from "@/lib/utils";
import { AvatarSlotContext } from "./avatar-slot";

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";
export type AvatarEmotion =
  "neutral" | "happy" | "thinking" | "surprised" | "shy" | "sad";

export interface AnimeVoiceAvatarProps {
  /** Avatar pack to use (default: sakura) */
  pack?: AvatarPack;
  /** Optional useVoice() return object from @personaai/react */
  voice?: Partial<UseVoiceResult>;
  /** Explicit voice state if voice object is not passed */
  state?: PersonaVoiceState;
  /** Explicit emotion override */
  emotion?: AvatarEmotion;
  /** Direct audio volume 0.0 to 1.0 */
  volume?: number;
  /** Size in pixels (default: 240) */
  size?: number | string;
  /** Enable mouse gaze tracking (default: true) */
  mouseTracking?: boolean;
  /** Enable automatic blinking (default: true) */
  autoBlink?: boolean;
  /** Accepted for compatibility; the audio ring no longer exists. */
  audioRing?: boolean;
  /** Background color of the avatar stage */
  backgroundColor?: string;
  className?: string;
  /** Callback fired on state transitions */
  onStateChange?: (state: AvatarState) => void;
  /** Called with the avatar when it is ready, and with null when it goes away. */
  onAvatarReady?: (avatar: Avatar | null) => void;
}

/**
 * The Persona avatar, driven by a voice call. A thin wrapper over
 * `@personaai/avatar`: the sakura character (or a custom pack), bound to `voice`
 * (state, resting face, transcript hints, simulated speech).
 */
export function AnimeVoiceAvatar({
  pack = sakura,
  voice,
  state: explicitState,
  emotion: explicitEmotion,
  volume,
  size = 240,
  mouseTracking = true,
  autoBlink = true,
  backgroundColor = "transparent",
  className,
  onStateChange,
  onAvatarReady,
}: AnimeVoiceAvatarProps) {
  // Active voice state priority: explicit prop > voice.state > 'idle'
  const voiceState = explicitState ?? voice?.state ?? "idle";
  const avatarState = mapVoiceState(voiceState);

  const { ref, avatar } = useVoiceAvatar(
    { state: voiceState, partial: voice?.partial },
    {
      pack,
      options: { mouseTracking, autoBlink, background: backgroundColor },
    },
  );

  // An explicit emotion wins over the face that goes with the voice state. Declared after the
  // binding, so it runs after it whenever the voice state changes.
  React.useEffect(() => {
    if (avatar && explicitEmotion) avatar.setEmotion(explicitEmotion);
  }, [avatar, voiceState, explicitEmotion]);

  // Direct volume prop support
  React.useEffect(() => {
    if (avatar && volume !== undefined) avatar.feedVolume(volume);
  }, [avatar, volume]);

  React.useEffect(() => {
    onStateChange?.(avatarState);
  }, [avatarState, onStateChange]);

  // Hand the instance to whoever asked (once per instance), and tell them when it is gone
  const onReadyRef = React.useRef(onAvatarReady);
  onReadyRef.current = onAvatarReady;
  React.useEffect(() => {
    if (!avatar) return;
    onReadyRef.current?.(avatar);
    return () => onReadyRef.current?.(null);
  }, [avatar]);

  // Publish it for the agent's avatar tools
  const slot = React.useContext(AvatarSlotContext);
  const setSlotted = slot?.setAvatar;
  React.useEffect(() => {
    if (!avatar || !setSlotted) return;
    setSlotted(avatar);
    return () => setSlotted(null);
  }, [avatar, setSlotted]);

  const styleSize = typeof size === "number" ? `${size}px` : size;

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex items-center justify-center overflow-hidden transition-all duration-300",
        className,
      )}
      style={{ width: styleSize, height: styleSize }}
      aria-label={`Anime voice avatar (${voiceState})`}
    />
  );
}
