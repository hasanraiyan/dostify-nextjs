import { getUserId } from "@/lib/session";
import { endVoiceSession, startVoiceSession } from "@/lib/dostify/usage";

/** The browser tells us when a voice call connects and when it ends. */
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = (await request.json().catch(() => null)) as { action?: string } | null;
  try {
    if (body?.action === "start") await startVoiceSession(userId);
    else if (body?.action === "end") await endVoiceSession(userId);
    else return new Response("Bad action", { status: 400 });
  } catch (error) {
    console.error("[usage] voice report failed:", error);
    return new Response("Failed", { status: 500 });
  }
  return Response.json({ ok: true });
}
