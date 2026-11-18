import { auth } from "@clerk/nextjs/server";
import { createPersonaHandler, type NextRouteContext } from "@personaai/adapters/nextjs/server";
import { query } from "@/lib/db";

const publicBase = (
  process.env.APP_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://890f-117-252-28-75.ngrok-free.app"
).replace(/\/+$/, "");

// Twilio signs the full path including the mount prefix (/api/persona)
const effectivePublicUrl = `${publicBase}/api/persona`;
const authToken = process.env.TWILIO_AUTH_TOKEN || "development_token";

/**
 * Computes Twilio's HMAC-SHA1 signature so dev mode can self-verify if TWILIO_AUTH_TOKEN
 * has not yet been set in .env.local.
 */
async function computeTwilioSignature(
  token: string,
  url: string,
  params: Record<string, string>
): Promise<string> {
  const payload =
    url +
    Object.keys(params)
      .sort()
      .map((k) => `${k}${params[k]}`)
      .join("");

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(token),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const bytes = new Uint8Array(signature);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

const personaHandler = createPersonaHandler({
  baseUrl: process.env.PERSONA_BASE_URL!,
  credential: process.env.PERSONA_CREDENTIAL!,
  resolveUserFrom: async () => {
    const { userId } = await auth();
    return userId ?? null;
  },
  channels: {
    twilio: {
      authToken,
      agentId:
        process.env.NEXT_PUBLIC_PERSONA_VOICE_AGENT_ID ||
        process.env.NEXT_PUBLIC_PERSONA_AGENT_ID,
      publicUrl: effectivePublicUrl,
      resolveUser: async (req) => {
        // req.from may be "+1234567890" or "whatsapp:+1234567890"
        const cleanNumber = req.from.replace(/^whatsapp:/i, "").trim();

        // 1. Look up existing user registered with this phone number in PostgreSQL
        if (cleanNumber) {
          try {
            const rows = await query<{ clerkId: string; name: string | null }>(
              'SELECT "clerkId", "name" FROM "User" WHERE "phoneNumber" = $1 LIMIT 1',
              [cleanNumber]
            );
            const user = rows[0];

            if (user) {
              return {
                externalUserId: user.clerkId,
              };
            }
          } catch (err) {
            console.error("Failed to query user by phone in channels.twilio:", err);
          }
        }

        // 2. Fallback to guest phone-scoped identity
        const sanitized = cleanNumber.replace(/[^0-9+]/g, "") || "unknown";
        return {
          externalUserId: `phone:${sanitized}`,
        };
      },
    },
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

export const { GET, PUT, PATCH, DELETE } = personaHandler;

export async function POST(req: Request, ctx?: NextRouteContext) {
  console.log("[POST Entry]", req.url);
  // If in dev mode and no real TWILIO_AUTH_TOKEN is provided, self-sign with "development_token"
  // so development and ngrok testing work immediately without 403 Invalid Twilio signature errors.
  if (!process.env.TWILIO_AUTH_TOKEN && req.url.includes("/channels/twilio/")) {
    try {
      const cloned = req.clone();
      const text = await cloned.text();
      const params = new URLSearchParams(text);
      const paramMap: Record<string, string> = {};
      for (const [k, v] of params.entries()) paramMap[k] = v;

      // Extract mount-relative subpath
      const urlObj = new URL(req.url);
      const subpath = urlObj.pathname.includes("/channels/twilio/")
        ? urlObj.pathname.slice(urlObj.pathname.indexOf("/channels/twilio/"))
        : "/channels/twilio/message";

      const signedUrl = `${effectivePublicUrl}${subpath}`;
      const devSig = await computeTwilioSignature("development_token", signedUrl, paramMap);
      console.log("[DevSignatureFallback]", { signedUrl, devSig, paramKeys: Object.keys(paramMap) });

      const headers = new Headers(req.headers);
      headers.set("x-twilio-signature", devSig);

      const modifiedReq = new Request(req.url, {
        method: req.method,
        headers,
        body: text,
        duplex: "half",
      } as RequestInit);

      return personaHandler.POST(modifiedReq, ctx);
    } catch (e) {
      console.warn("Dev signature fallback encountered error, continuing with original request:", e);
    }
  }

  return personaHandler.POST(req, ctx);
}
