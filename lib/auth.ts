import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { oauthProvider } from "@better-auth/oauth-provider";
import { prisma } from "@/lib/prisma";

export const BASE_URL = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
/** The MCP endpoint is the OAuth "resource"; access tokens are issued for this audience. */
export const MCP_RESOURCE = `${BASE_URL}/mcp`;

export const auth = betterAuth({
  baseURL: BASE_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // Cookie sessions work inside the Capacitor WebView because it loads this site
  // (same origin). The Android emulator's dev origin is allowed explicitly.
  trustedOrigins: [BASE_URL, "http://10.0.2.2:3000"],
  emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
  // /token is replaced by the OAuth provider's own token endpoint.
  disabledPaths: ["/token"],
  plugins: [
    jwt({ disableSettingJwtHeader: true }),
    oauthProvider({
      loginPage: "/sign-in",
      consentPage: "/consent",
      resources: [MCP_RESOURCE],
      scopes: ["openid", "profile", "email", "offline_access"],
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultScopes: ["openid", "profile", "email"],
      clientRegistrationAllowedResources: [MCP_RESOURCE],
      clientRegistrationDefaultResources: [MCP_RESOURCE],
    }),
    nextCookies(), // keep last
  ],
});

export type Session = typeof auth.$Infer.Session;
