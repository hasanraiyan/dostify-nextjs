import type { Metadata } from "next";
import { AssistantExperience } from "./assistant-experience";

export const metadata: Metadata = {
  title: "AI Assistant",
  description:
    "A full-featured floating assistant with voice, memory, connectors, and more.",
};

export default function AssistantPage() {
  return <AssistantExperience />;
}
