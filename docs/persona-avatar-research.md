# Comprehensive Research: `@personaai/avatar` and Platform Integration

> **Source Codebases Analyzed**:
> - SDK: `D:\agent-marketplace\sdk\avatar`
> - Platform: `D:\agent-marketplace\platform`
> - Backend Voice Gateway: `D:\agent-marketplace\agent-backend`

---

## Executive Summary & Design Philosophy

Unlike typical 3D or video-streamed avatars (such as WebRTC video feeds, Three.js, Babylon.js, or cloud-rendered GPU streams like HeyGen or Simli), **`@personaai/avatar` is an ultra-lightweight, 100% client-side 2D vector SVG rigging and animation engine**.

### Key Architectural Advantages
1. **Zero Runtime Dependencies (`dependencies: {}`)**:
   - No WebGL, Three.js, Canvas, or WebRTC video tracks.
   - Built entirely on DOM SVG element transforms, CSS variables, and layer visibility toggles (`data-role`, `data-mouth`, `id="persona:<role>"`).
2. **Zero Cloud Video Infrastructure**:
   - Audio is streamed bidirectionally over WebSockets via speech-to-speech foundation models (Google Gemini Live or OpenAI Realtime).
   - Lip-sync visemes, facial expressions, and physical gestures are synthesized and rendered entirely in the user's browser.
3. **High Performance & Battery Friendly**:
   - A single shared `requestAnimationFrame` loop drives all active instances.
   - Automatically pauses rendering when off-screen via `IntersectionObserver` or when the tab is backgrounded via `document.hidden`.
   - Supports `prefers-reduced-motion: reduce`.

---

## 1. SDK Package Architecture (`sdk/avatar`)

Packaged as **`@personaai/avatar`** (`v0.3.1`) in `D:\agent-marketplace\sdk\avatar\package.json`, exposing three main entry points:

### A. Core Engine (`@personaai/avatar`)
- **Factory & Classes**:
  - `createAvatar(config)`: Instantiates the avatar controller.
  - `svgRig(svgString, manifest, hooks?)`: Compiles and sanitizes raw SVG vector graphics against a `RigManifest`.
  - `Avatar`: Central controller managing clocks, channels, emotions, and gestures.
  - `validateRig()`, `sanitizeSvg()`, `sanitizeCss()`: Security and validation utilities.
- **Channel System**:
  - `blinkChannel`: Procedural stochastic eye blinks.
  - `breathingChannel`: Subtle rhythmic chest and posture oscillation.
  - `gazeChannel`: Gaze targeting and pointer tracking (`avatar.lookAt({ x, y })`).
  - `emotionChannel`: Six distinct emotion poses: `neutral`, `happy`, `thinking`, `surprised`, `shy`, `sad`.
  - `lipSyncChannel`: Viseme morphing supporting phonemes: `A`, `I`, `U`, `E`, `O`, `M`, `S`, and `rest`.
- **Standard Gestures**:
  - `wave`, `bow`, `nod`, `think`, `thumbs_up`.
- **Bundled Character Packs**:
  - `sakura`: Anime-style character featuring a parametric morphing mouth, arm gestures, and a thought bubble.
  - `pebble`: Flat circular mascot using 6 discrete mouth swaps.
- **Headless CLI (`persona-avatar`)**:
  - Located at `dist/cli.js` with `check` and `preview` commands to validate custom SVG rigs and manifests in CI workflows without opening a browser.

### B. React Integration (`@personaai/avatar/react`)
- `<PersonaAvatar pack={sakura} state="speaking" emotion="happy" volume={0.6} size={240} />`:
  - SSR-safe, React 19 / React StrictMode resilient component.
  - Hydration-safe initial container to avoid cumulative layout shift (CLS).
- `useAvatar(config)`:
  - React hook returning `{ ref, avatar }`.

### C. Voice & Agent Bindings (`@personaai/avatar/persona`)
- `useVoiceAvatar(voice, options)`:
  - Binds `@personaai/react`'s `useVoice()` session state directly to the avatar.
  - Automatically updates resting expressions based on voice state (`listening`, `thinking`, `speaking`, `idle`, `error`).
  - Syncs partial transcript hints and simulated speech cadence.
- `useAvatarTools(avatar)`:
  - Automatically registers two client-side tools into the AI agent's tool registry:
    - `set_avatar_emotion({ emotion })`
    - `trigger_avatar_reaction({ reaction })`

---

## 2. Platform Usage & Component Hierarchy (`platform/src`)

In `D:\agent-marketplace\platform\src\`, the avatar is used in both **interactive documentation** and **live voice call interfaces**.

### Component Inventory

| Component | Path | Purpose |
| :--- | :--- | :--- |
| `AnimeVoiceAvatar` | `src/components/persona/avatar/anime-voice-avatar.tsx` | Primary React wrapper binding `useVoice()` to `@personaai/avatar`, supporting pointer tracking and slot registration. |
| `AvatarSlotContext` | `src/components/persona/avatar/avatar-slot.tsx` | Decoupled Context (`AvatarSlotProvider`, `useSlottedAvatar`) exposing the active `Avatar` instance across distant DOM subtrees to bind agent tools. |
| `VoiceDock` | `src/components/persona/chat-sdk/voice-dock.tsx` | Portalled floating call circle (`document.body`) with circular avatar mask, animated status rings, mic mute/hangup controls, and vanishing speech bubbles. |
| `VoiceFab` | `src/components/persona/chat-sdk/voice-fab.tsx` | Floating action button providing a single-tap trigger to start voice calls and mount the avatar dock. |
| `VoiceIndicator` | `src/components/persona/chat-sdk/voice-indicator.tsx` | Dual-mode component rendering either the full `AnimeVoiceAvatar` or a compact visualizer orb based on size. |
| `PersonaChatView` | `src/components/persona/chat-sdk/persona-chat-view.tsx` | Mounts a large avatar (290px) above the composer during live voice calls. |
| `DocsAssistant` | `src/components/docs/docs-assistant.tsx` | Global layout assistant providing voice help across docs using `AvatarSlotProvider` and `useAvatarTools`. |
| `AvatarDemo` | `src/components/docs/avatar-demo.tsx` | Interactive documentation sandbox playground for testing character packs, emotions, and visemes. |

---

## 3. UI, Framing & Interaction Lifecycle

### A. Visual Layout & Framing
- **Circular Avatar Mask**: Avatars are framed inside a circular badge:
  ```tsx
  <div className="overflow-hidden rounded-full bg-card shadow-xl">
    <AnimeVoiceAvatar size={size} ... />
  </div>
  ```
- **Bust Portrait Crop**: To avoid blank space below the character's shoulders, `VoiceDock` applies:
  ```css
  transform: translateY(10.5%) scale(1.35);
  ```
- **State Rings**: Dynamic border rings reflect the current voice status:
  - `listening` ➔ `ring-foreground/40`
  - `speaking` ➔ `ring-foreground`
  - `thinking` ➔ `ring-foreground/60 animate-pulse`
  - `muted` ➔ `ring-destructive/60`

### B. User Interaction Flow
1. **Idle Tap**: Clicking the 64px `VoiceFab` immediately triggers `voice.start()` within the direct user gesture handler.
2. **Active Call Dock**: The avatar expands to 120px with audio reactive lip-sync and gaze tracking following cursor movement.
3. **Minimization**: Tapping the 120px active dock collapses it into a 60px mini-dock (`small = true`) to unclutter screen real estate.
4. **Graceful Teardown (`playGoodbye`)**:
   - Tapping the hangup button does **not** abruptly cut audio or unmount the component.
   - It triggers `playGoodbye(avatar)`: a ~1.9s farewell gesture (waving/bowing with a happy emotion).
   - **The microphone remains active** during the farewell animation so parting remarks are not abruptly severed.
   - A safety timeout (`GOODBYE_MS = 2200ms`) ensures `voice.stop()` executes cleanly once the animation finishes.

---

## 4. Custom Character Pack Implementation (`scarlet`)

In addition to built-in characters, `platform` demonstrates how to author custom characters from scratch:
- **Location**: `platform/src/components/persona/avatar/scarlet/`
  - `index.ts`: Bundles SVG asset, manifest, and emotions into an `AvatarPack`.
  - `manifest.ts`: Defines character metadata:
    ```typescript
    export const scarletManifest: RigManifest = {
      name: "scarlet",
      viewBox: [0, 0, 500, 560],
      head: { pivot: [250, 280], maxRotationDeg: 6, maxTranslationPx: 8 },
      mouth: {
        strategy: "swap",
        swapSelector: "[data-mouth]",
        swapAttribute: "data-mouth",
        defaultViseme: "rest",
      },
      roles: {
        body: { selector: "[data-role='body']" },
        eyes: { selector: "[data-role='eyes']" },
        eyebrows: { selector: "[data-role='eyebrows']" },
        mouth: { selector: "[data-role='mouth']" },
        hair: { selector: "[data-role='hair']" },
        arms: { selector: "[data-role='arms']" },
      },
      gestures: ["wave", "bow", "nod", "think", "thumbs_up"],
    };
    ```
  - `emotions.ts`: Configures facial morph targets for each emotion.

---

## 5. Backend, Voice Streaming & Session Infrastructure

Located in `D:\agent-marketplace\agent-backend\src\modules\voice\gateway\`:

### A. Zero Dedicated Avatar Backend Services
- No WebRTC video servers, cloud GPU pipelines, or third-party avatar providers (HeyGen, Simli, ReadyPlayerMe, LiveKit) are needed.
- The avatar runs purely off the existing voice WebSocket connection.

### B. Session Ticket Minting
- **Endpoints**:
  - `POST /api/v1/developer/voice/sessions`
  - `POST /api/v1/projects/{projectId}/agents/{agentId}/test/voice/sessions`
- **Security**: Mints HMAC-SHA256 signed tickets (`TICKET_TTL_MS = 5 minutes`, 60-second handshake window).
- **Replay Protection**: Single-use redemption tracked by an in-memory `jti` map.

### C. Audio Framing & Formats
- **WebSocket Gateway**: `GET/WS /api/v1/developer/voice?ticket=<ticket>`
- **Audio Framing**:
  - Client Input: 16 kHz 16-bit PCM mono (`audio/pcm;rate=16000`).
  - Agent Output: 24 kHz 24-bit PCM mono frames streamed in real time.
- **Voice Foundation Models**: Direct adapters for Google Gemini Live (`GeminiLiveAdapter.js`) and OpenAI Realtime (`OpenAIRealtimeAdapter.js`).

### D. Lip-Sync & Formant Extraction
1. **Real Audio Mode**: In the browser, Web Audio `AnalyserNode` (`FFT_SIZE = 1024`) performs formant analysis (`analyzePhonetics`) directly on speaker audio playback to classify visemes (`A, I, U, E, O, M, S`).
2. **Simulated Fallback Mode**: If raw audio nodes are unavailable, `simulatedSpeechFrame()` generates rhythmic syllable bursts (~9.5 rad/s) tuned by incoming partial transcript text hints.

### E. LLM Emotion & Reaction Tools
- Declarations for `set_avatar_emotion` and `trigger_avatar_reaction` are supplied to the voice model.
- When invoked by the model during a turn, the backend relays the tool calls through the AG-UI event stream over the WebSocket.
- `@personaai/react` receives the event and executes `avatar.setEmotion()` or `avatar.play()`.

---

## 6. How to Integrate `@personaai/avatar` in `persona-nextjs-starter`

1. **Install Package**:
   ```bash
   pnpm add @personaai/avatar
   ```
2. **Add Component & Character Pack**:
   ```tsx
   import { PersonaAvatar, sakura } from "@personaai/avatar/react";
   import { useVoice } from "@personaai/react";
   import { useVoiceAvatar } from "@personaai/avatar/persona";

   export function VoiceAvatarWidget() {
     const voice = useVoice();
     const { ref, avatar } = useVoiceAvatar(voice, { pack: sakura });

     return (
       <div className="relative h-48 w-48 overflow-hidden rounded-full border shadow-lg">
         <div ref={ref} className="h-full w-full" />
       </div>
     );
   }
   ```
3. **Register Agent Emote Tools**:
   ```tsx
   import { useAvatarTools } from "@personaai/avatar/persona";

   // Inside a component with access to the avatar instance:
   useAvatarTools(avatar);
   ```
4. **Deploy**: No backend changes required; the avatar integrates with your existing Persona voice backend proxy.
