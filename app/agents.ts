import type { PersonaAgentOption } from "@/components/persona/chat-sdk/agent-picker";

// Dostify uses exactly two Persona agents: one for chat, one for voice.
// Set both IDs in .env.local once the agents are created in Persona.
export const DOSTIFY_AGENT_ID = process.env.NEXT_PUBLIC_PERSONA_AGENT_ID ?? "";

export const DEFAULT_VOICE_AGENT_ID =
  process.env.NEXT_PUBLIC_PERSONA_VOICE_AGENT_ID ?? "";

// A single entry, so the agent picker stays hidden.
export const AGENTS: PersonaAgentOption[] = [
  {
    agentId: DOSTIFY_AGENT_ID,
    voiceAgentId: DEFAULT_VOICE_AGENT_ID,
    name: "Dostify",
  },
];
