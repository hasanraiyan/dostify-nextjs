"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { PersonaProvider } from "@personaai/react";
import { AvatarSlotProvider } from "@/components/persona/avatar";
import { VoiceFab } from "@/components/persona/chat-sdk";
import { useAvatarPref } from "@/components/dostify/use-avatar-pref";
import { DEFAULT_VOICE_AGENT_ID } from "@/app/agents";

/**
 * The app's existing voice agent (same VoiceFab, agent and avatar as inside
 * the app) on the public home page. Renders nothing for signed-out visitors,
 * so the page stays static; it only mounts once Clerk confirms a session.
 */
export function LandingAssistant() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || !isSignedIn) return null;
  return <SignedInVoiceFab />;
}

function SignedInVoiceFab() {
  const { pack, avatarId } = useAvatarPref();
  return (
    <PersonaProvider baseUrl="/api/persona">
      <AvatarSlotProvider>
        <VoiceFab
          agentId={process.env.NEXT_PUBLIC_PERSONA_VOICE_AGENT_ID || DEFAULT_VOICE_AGENT_ID}
          pack={pack}
          avatarId={avatarId}
        />
      </AvatarSlotProvider>
    </PersonaProvider>
  );
}
