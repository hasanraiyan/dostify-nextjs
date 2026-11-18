"use client";

import * as React from "react";
import { useVoice } from "@personaai/react";
import type { AvatarPack } from "@personaai/avatar";
import { VoiceDock } from "./voice-dock";

/**
 * Voice-only floating launcher. The FAB is the persona's avatar in a circle;
 * tapping it starts the call and the circle grows into the call view (mic /
 * end badges, vanishing live caption). No chat panel, no text agent.
 *
 * Mints a fresh thread for every call so each conversation starts
 * with clean context and persists into its own conversation document.
 * Thread minting happens in the background while idle so tapping the FAB
 * starts the voice session immediately under the direct user gesture
 * without any serial HTTP waterfall or React state delay.
 */
export interface VoiceFabProps {
  agentId: string;
  threadId?: string;
  agentVersion?: number;
  environment?: "development" | "production";
  /**
   * Hide the launcher while no call is running (e.g. off the docs pages). The
   * hook stays mounted either way, so a call in progress is never torn down by
   * a route change.
   */
  hideWhenIdle?: boolean;
  /** Avatar pack to use for the avatar (defaults to sakura, via AnimeVoiceAvatar) */
  pack?: AvatarPack;
  /**
   * Optional proactive greeting trigger.
   * If string, sends that prompt immediately once connected so the model speaks first.
   * If true, sends a warm default greeting.
   */
  proactiveGreeting?: string | boolean;
}

export function VoiceFab({
  agentId,
  threadId,
  agentVersion,
  environment = "production",
  hideWhenIdle = false,
  pack,
  proactiveGreeting,
}: VoiceFabProps) {
  const voice = useVoice({
    agentId,
    threadId,
    agentVersion,
    environment,
    autoPrefetch: true,
    ...(proactiveGreeting !== undefined ? ({ proactiveGreeting } as any) : {}),
  });

  const live = !["idle", "ended", "error"].includes(voice.state);

  // Start the voice call immediately under the direct user gesture.
  // Never await network roundtrips or wait for React render cycles before voice.start().
  const handleStart = React.useCallback(() => {
    void voice.start();
  }, [voice]);

  // Diagnostics: say why a call stopped (server reason vs. this component
  // going away) so a dropped call is traceable from the console.
  React.useEffect(() => {
    if (voice.state === "ended" || voice.state === "error") {
      console.warn("[voice-fab] call ended", {
        state: voice.state,
        endReason: voice.endReason,
        error: voice.error?.message,
      });
    }
  }, [voice.state, voice.endReason, voice.error]);
  React.useEffect(
    () => () =>
      console.info("[voice-fab] unmounted (any live call is stopped)"),
    [],
  );

  if (hideWhenIdle && !live) return null;
  return <VoiceDock voice={voice} pack={pack} onStart={handleStart} />;
}
