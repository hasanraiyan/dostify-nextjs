import { auth } from "@clerk/nextjs/server";
import { createPersonaHandler } from "@personaai/adapters/nextjs/server";

const personaHandler = createPersonaHandler({
  baseUrl: process.env.PERSONA_BASE_URL!,
  credential: process.env.PERSONA_CREDENTIAL!,
  mountPath: "/api/persona",
  resolveUserFrom: async () => {
    // Both chat and voice are strictly restricted to authenticated users only.
    // Returning null causes the runtime to reject unauthenticated requests with 401 Unauthorized.
    const { userId } = await auth();
    return userId ?? null;
  },
  forwardTraceparent: true,
  defaultEnvironment: "production",
  allowClientVersionSelection: true,
  selectVersion: async () => {
    return { environment: "production" };
  },
  capabilities: {
    messages: true,
  },
  hooks: {
    onFeedback: async (feedback) => {
      console.log("[Persona Feedback Received]", {
        runId: feedback.runId,
        score: feedback.score,
        comment: feedback.comment,
        tags: feedback.tags,
        userId: feedback.userId,
      });
    },
  },
  logLevel: process.env.NODE_ENV === "production" ? "info" : "debug",
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
});

export const { GET, POST, PUT, PATCH, DELETE } = personaHandler;
