import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/dostify/site";

/** Only the public site is crawlable. The app and its APIs sit behind sign-in. */
const PRIVATE = ["/chat", "/chat/*", "/journal", "/journal/*", "/connectors", "/profile", "/assistant", "/api/*", "/mcp", "/sse"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      {
        // AI search and assistants may read the public pages.
        userAgent: ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-User", "PerplexityBot", "Google-Extended"],
        allow: "/",
        disallow: PRIVATE,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
