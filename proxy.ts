import { clerkMiddleware } from "@clerk/nextjs/server";

// Public paths: Clerk auth pages, SSO callback, MCP/OAuth endpoints,
// and Twilio inbound channel webhooks (verified via X-Twilio-Signature).
const PUBLIC_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/sso-callback",
  "/.well-known",
  "/api/webhooks",
  "/api/health",
  "/api/persona/channels",
  "/mcp",
  "/sse",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default clerkMiddleware(async (auth, request) => {
  if (isPublicPath(request.nextUrl.pathname)) return;

  // Optimistic redirect only — authoritative check happens in
  // the route handler via `auth()`.
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
