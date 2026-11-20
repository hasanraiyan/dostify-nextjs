import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Public paths: the landing page and its SEO files, auth pages, auth API, and MCP/OAuth endpoints. The app itself (/chat, /journal,
// /connectors, /profile) stays behind sign-in.
const PUBLIC_EXACT = ["/", "/robots.txt", "/sitemap.xml", "/terms", "/privacy", "/delete-account", "/opengraph-image", "/twitter-image"];

const PUBLIC_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/consent",
  "/api/auth",
  "/.well-known",
  "/api/health",
  "/api/persona",
  "/mcp",
  "/sse",
];

function isPublicPath(pathname: string) {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Optimistic check only (cookie present). Pages and route handlers verify the
// session for real via `getUserId()`.
export default function proxy(request: NextRequest) {
  if (isPublicPath(request.nextUrl.pathname)) return NextResponse.next();
  if (getSessionCookie(request)) return NextResponse.next();
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
