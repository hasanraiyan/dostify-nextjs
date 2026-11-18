import { auth, clerkClient } from "@clerk/nextjs/server";
import { createCode, isValidChallenge } from "@/lib/native-auth";

/**
 * Opened in the phone's browser (Chrome Custom Tab) after sign-in. Not signed
 * in yet? The proxy sends the visitor to /sign-in and back here. Then it
 * mints a one-time ticket and opens the app through the dostify:// link.
 */
export async function GET(request: Request) {
  const challenge = new URL(request.url).searchParams.get("challenge");
  if (!isValidChallenge(challenge)) return new Response("Bad request", { status: 400 });

  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const client = await clerkClient();
  const { token } = await client.signInTokens.createSignInToken({ userId, expiresInSeconds: 120 });
  const link = `dostify://auth?code=${createCode(token, challenge)}`;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Opening Dostify</title>
<style>body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;text-align:center}
a{display:inline-block;margin-top:16px;padding:12px 24px;border-radius:999px;background:#111;color:#fff;text-decoration:none}</style></head>
<body><div><p>Signed in. Returning to the Dostify app…</p><a href="${link}">Open Dostify</a></div>
<script>setTimeout(function(){location.href=${JSON.stringify(link)}},300)</script></body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
