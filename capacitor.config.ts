import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The mobile app is the deployed web app inside a native shell. Next.js needs
 * a server (API routes, auth, SSR), so there is no static export: the WebView
 * loads `server.url`. For local testing set CAP_SERVER_URL to your dev machine
 * (e.g. http://192.168.1.5:3000) before `pnpm cap:sync`.
 */
const serverUrl = process.env.CAP_SERVER_URL ?? "https://dostify.hasanraiyan.me";

const config: CapacitorConfig = {
  appId: "me.hasanraiyan.dostify",
  appName: "Dostify",
  webDir: "mobile/www",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    // Stay inside the app for our own site only.
    allowNavigation: ["dostify.hasanraiyan.me"],
  },
  android: {
    // Lets getUserMedia (the mic) work for voice calls inside the WebView.
    allowMixedContent: false,
  },
};

export default config;
