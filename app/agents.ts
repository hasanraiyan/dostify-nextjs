import type { PersonaAgentOption } from "@/components/persona/chat-sdk/agent-picker";

export const DEFAULT_VOICE_AGENT_ID =
  process.env.NEXT_PUBLIC_PERSONA_VOICE_AGENT_ID || "6af19ffc648332c69d8646b6";

export const AGENTS: PersonaAgentOption[] = [
  {
    agentId: "6ae2947363e281302872e091",
    voiceAgentId: DEFAULT_VOICE_AGENT_ID,
    name: "Hindi Support Agent",
    avatarUrl: "https://res.cloudinary.com/djkpavwmp/image/upload/v1777255297/portfolio_assets/q3kcklesxkonvin1ocpi.png",
  },
  {
    agentId: "6ae2a75e63e281302872e36e",
    voiceAgentId: DEFAULT_VOICE_AGENT_ID,
    name: "GATE Prep Tutor",
    avatarUrl: "https://res.cloudinary.com/djkpavwmp/image/upload/v1777255297/portfolio_assets/q3kcklesxkonvin1ocpi.png",
  },
  {
    agentId: "6ae2adde63e281302872e585",
    voiceAgentId: DEFAULT_VOICE_AGENT_ID,
    name: "BEU Study Agent",
    avatarUrl: "https://res.cloudinary.com/djkpavwmp/image/upload/v1777255297/portfolio_assets/q3kcklesxkonvin1ocpi.png",
  },
  {
    agentId: "6ae3583dd1bf1ed51fb55bf6",
    voiceAgentId: DEFAULT_VOICE_AGENT_ID,
    name: "AI Assistant",
    avatarUrl: "https://res.cloudinary.com/djkpavwmp/image/upload/v1777255297/portfolio_assets/q3kcklesxkonvin1ocpi.png",
  },
  {
    agentId: "6ae44d5cdc40de3f928216be",
    voiceAgentId: DEFAULT_VOICE_AGENT_ID,
    name:"SRS Agent",
    avatarUrl: "https://res.cloudinary.com/djkpavwmp/image/upload/v1777255297/portfolio_assets/q3kcklesxkonvin1ocpi.png",
  },
  {
    agentId:"6af1f359fce62ac831514466",
    voiceAgentId: DEFAULT_VOICE_AGENT_ID,
    name:"Openai agent",
    avatarUrl: "https://res.cloudinary.com/djkpavwmp/image/upload/v1777255297/portfolio_assets/q3kcklesxkonvin1ocpi.png",
  }
];
