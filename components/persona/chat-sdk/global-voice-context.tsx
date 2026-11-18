"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useVoice, type UseVoiceResult } from "@personaai/react";
import { VoiceDock } from "./voice-dock";
import { DEFAULT_VOICE_AGENT_ID } from "@/app/agents";
import { useAvatarPref } from "@/components/dostify/use-avatar-pref";

export interface GlobalVoiceContextValue {
  voice: UseVoiceResult;
  isVoiceActive: boolean;
  startVoice: () => Promise<void>;
  stopVoice: () => void;
}

const GlobalVoiceContext = React.createContext<GlobalVoiceContextValue | null>(null);

export function GlobalVoiceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { pack } = useAvatarPref();

  const voiceAgentId =
    process.env.NEXT_PUBLIC_PERSONA_VOICE_AGENT_ID || DEFAULT_VOICE_AGENT_ID;

  const voice = useVoice({
    agentId: voiceAgentId,
    autoPrefetch: true,
  });

  const isVoiceActive = !["idle", "ended", "error"].includes(voice.state);

  const startVoice = React.useCallback(async () => {
    return voice.start();
  }, [voice]);

  const stopVoice = React.useCallback(() => {
    voice.stop();
  }, [voice]);

  // Is user currently on the chat page?
  const inChat =
    pathname === "/" ||
    pathname === "/chat" ||
    pathname.startsWith("/chat/") ||
    pathname.startsWith("/c/");

  // When call is active and user navigates away from chat (e.g. to /journal, /connectors, /profile),
  // pop out the floating VoiceDock with the avatar, live speech rings, mic controls, and return-to-chat button.
  const showFloatingDock = isVoiceActive && !inChat;

  const value = React.useMemo(
    () => ({
      voice,
      isVoiceActive,
      startVoice,
      stopVoice,
    }),
    [voice, isVoiceActive, startVoice, stopVoice]
  );

  return (
    <GlobalVoiceContext.Provider value={value}>
      {children}
      {showFloatingDock && (
        <VoiceDock
          voice={voice}
          pack={pack}
          onExpand={() => router.push("/chat")}
        />
      )}
    </GlobalVoiceContext.Provider>
  );
}

export function useGlobalVoice() {
  return React.useContext(GlobalVoiceContext);
}
