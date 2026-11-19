# Dostify mobile app (Capacitor, Android)

The app is the deployed web app in a native WebView. Next.js needs a server (API routes, auth, SSR), so there is **no static export**: `capacitor.config.ts` points the WebView at `https://dostify.hasanraiyan.me`. Secrets and the database stay on the server; the APK holds only a URL and a placeholder page (`mobile/www/index.html`).

## Build and run (Windows)

Needs Android Studio (SDK + bundled JDK). From the repo root:

```bash
pnpm cap:sync            # copies config to android/
pnpm cap:open            # opens Android Studio, press Run
# or, without the IDE:
cd android
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

Local testing against your dev server (phone and PC on the same Wi-Fi):

```bash
CAP_SERVER_URL=http://192.168.1.5:3000 pnpm cap:sync
```

`cleartext` is turned on only for `http://` URLs. **Never build a release with `CAP_SERVER_URL` set.**

## Release checklist

- Build with `CAP_SERVER_URL` unset (production HTTPS URL).
- Sign a release build (keystore); do not share the debug APK.
- Set the app icon and splash in `android/app/src/main/res`.
- Keep 2FA on the domain and hosting account: the app shows whatever the URL serves.

## Known limits

- **Google sign-in** is blocked by Google inside embedded WebViews (`disallowed_useragent`). Use email or OTP login, or move to a system-browser (Custom Tabs) flow later.
- **Voice** uses `getUserMedia`; `RECORD_AUDIO` and `MODIFY_AUDIO_SETTINGS` are in the manifest and Android asks on first use. Calls stop when the app is backgrounded; keeping them alive needs a native foreground service (not built).
- **iOS** is not added (needs a Mac for `cap add ios`). Apple may reject a WebView-only app without a native feature.
- The free-plan limits are enforced on the server, so they apply to the app as well.
