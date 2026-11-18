import { redeemCode } from "@/lib/native-auth";

/** The app trades the code (from the dostify:// link) plus its verifier for the Clerk ticket. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: string; verifier?: string } | null;
  if (typeof body?.code !== "string" || typeof body?.verifier !== "string") {
    return new Response("Bad request", { status: 400 });
  }
  const ticket = redeemCode(body.code, body.verifier);
  if (!ticket) return new Response("Invalid or expired code", { status: 400 });
  return Response.json({ ticket }, { headers: { "Cache-Control": "no-store" } });
}
