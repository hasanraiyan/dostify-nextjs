import { auth } from "@clerk/nextjs/server";
import { createPersonaHandler } from "@personaai/adapters/nextjs/server";
import {
  LIMIT_MESSAGES,
  messagesLeft,
  recordMessage,
  voiceLeft,
} from "@/lib/dostify/usage";

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

const MOUNT = "/api/persona";

function limitResponse(code: "CHAT_LIMIT" | "VOICE_LIMIT", message: string) {
  return Response.json({ error: { code, message }, message }, { status: 429 });
}

/**
 * Free-plan limits in front of the Persona proxy. Only two calls are counted:
 * sending a chat message (POST /chat) and minting a voice ticket
 * (POST /voice/sessions, blocked once voice time is used up; call time itself
 * is reported by the browser, see /api/usage/voice). If the usage tables are
 * unavailable the check is skipped, so a database problem never takes chat down.
 */
async function withLimits(
  request: Request,
  ctx: unknown,
  handler: (request: Request, ctx: never) => Promise<Response> | Response,
): Promise<Response> {
  const path = new URL(request.url).pathname.slice(MOUNT.length).replace(/\/$/, "");
  const isChat = request.method === "POST" && path === "/chat";
  const isVoice = request.method === "POST" && path === "/voice/sessions";
  if (!isChat && !isVoice) return handler(request, ctx as never);

  const { userId } = await auth();
  if (!userId) return handler(request, ctx as never);

  try {
    if (isChat && !(await messagesLeft(userId))) return limitResponse("CHAT_LIMIT", LIMIT_MESSAGES.chat);
    if (isVoice && !(await voiceLeft(userId))) return limitResponse("VOICE_LIMIT", LIMIT_MESSAGES.voice);
  } catch (error) {
    console.error("[usage] limit check skipped:", error);
    return handler(request, ctx as never);
  }

  const response = await handler(request, ctx as never);
  if (isChat && response.ok) {
    void recordMessage(userId).catch((error) => console.error("[usage] count failed:", error));
  }
  return response;
}

export const GET = personaHandler.GET;
export const PUT = personaHandler.PUT;
export const PATCH = personaHandler.PATCH;
export const DELETE = personaHandler.DELETE;
export const POST = (request: Request, ctx: unknown) =>
  withLimits(request, ctx, personaHandler.POST as never);
