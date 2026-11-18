"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ChatCircleDotsIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PhoneXIcon,
} from "@phosphor-icons/react";
import { X } from "lucide-react";
import type { UseVoiceResult } from "@personaai/react";
import type { Avatar, AvatarPack } from "@personaai/avatar";
import { playGoodbye } from "@personaai/avatar/persona";
import { cn } from "@/lib/utils";
import { VoiceIndicator } from "./voice-indicator";

/** How long the last spoken line stays on screen once nobody is speaking. */
const CAPTION_LINGER_MS = 4500;
/** The longest the goodbye may take before the call is ended anyway. */
const GOODBYE_MS = 2200;

/** Defensive cleaning to strip leaked audio emotion tags or raw XML tags (<trigger_avatar_reaction...>, etc.) from the live caption text. */
function cleanVoiceCaption(text: string): string {
  if (!text) return "";
  let cleaned = text;

  // 1. Strip speaker:audio_emotion tags (paired, unclosed, or without leading '<')
  cleaned = cleaned.replace(/<?speaker:audio_emotion\b[^>]*>[\s\S]*?<\/speaker:audio_emotion>/gi, "");
  cleaned = cleaned.replace(/<?speaker:audio_emotion\b[^<\n]*<\/speaker:audio_emotion>/gi, "");
  cleaned = cleaned.replace(/<?speaker:audio_emotion\b[^>]*\/?>/gi, "");

  // 2. Strip avatar reactions and emotions (paired or self-closing XML tags)
  cleaned = cleaned.replace(/<trigger_avatar_reaction\b[^>]*>[\s\S]*?<\/trigger_avatar_reaction>/gi, "");
  cleaned = cleaned.replace(/<trigger_avatar_reaction\b[^>]*\/?>/gi, "");
  cleaned = cleaned.replace(/<set_avatar_emotion\b[^>]*>[\s\S]*?<\/set_avatar_emotion>/gi, "");
  cleaned = cleaned.replace(/<set_avatar_emotion\b[^>]*\/?>/gi, "");

  // 3. Strip general action, reaction, emotion or other markup tags
  cleaned = cleaned.replace(/<(?:action|reaction|emotion)\b[^>]*>[\s\S]*?<\/(?:action|reaction|emotion)>/gi, "");
  cleaned = cleaned.replace(/<(?:action|reaction|emotion)\b[^>]*\/?>/gi, "");

  // 4. Strip any other raw XML/HTML-like tags with attributes or self-closing tags
  cleaned = cleaned.replace(/<[a-zA-Z_:][a-zA-Z0-9_.:-]*\b[^>]*\/?>/gi, "");
  cleaned = cleaned.replace(/<\/[a-zA-Z_:][a-zA-Z0-9_.:-]*\s*>/gi, "");

  // 5. Strip unclosed trailing XML tags (e.g. streaming partial '<trigger_avatar_reaction reaction=...')
  cleaned = cleaned.replace(/<[a-zA-Z_:][^>]*$/g, "");

  // 6. Strip leaked model emotion/action tokens like [blocked]happy
  cleaned = cleaned.replace(/\[blocked\][a-zA-Z0-9_]+/gi, "");

  // 7. Collapse leftover whitespace and trim
  cleaned = cleaned.replace(/[ \t]+/g, " ").replace(/\n\s*\n/g, "\n").trim();

  return cleaned;
}

/**
 * Live caption for the call: whatever is being said right now (the in-progress
 * line), kept for a few seconds after it finishes, then gone. Returns "" when
 * nothing should show.
 */
function useVanishingCaption(voice: UseVoiceResult): string {
  // Only show the AI/agent's speech — human user utterances are filtered out
  const isAgentPartial = voice.partial?.speaker === "agent";
  const rawPartialText = isAgentPartial ? (voice.partial?.text?.trim() ?? "") : "";
  const partialText = cleanVoiceCaption(rawPartialText);

  // Find the last agent transcript line
  let lastAgentText = "";
  for (let i = voice.transcript.length - 1; i >= 0; i--) {
    if (voice.transcript[i]?.speaker === "agent") {
      const cleaned = cleanVoiceCaption(voice.transcript[i]?.text?.trim() ?? "");
      if (cleaned) {
        lastAgentText = cleaned;
        break;
      }
    }
  }

  const live = partialText || lastAgentText;

  // A new line (or a growing partial) re-arms the timer; a quiet one lets it lapse.
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    if (!live) {
      setVisible(false);
      return;
    }
    setVisible(true);
    // While the line is still being spoken it stays up; only a finished one fades.
    if (partialText) return;
    const t = window.setTimeout(() => setVisible(false), CAPTION_LINGER_MS);
    return () => window.clearTimeout(t);
  }, [live, partialText]);

  if (!visible || !live) return "";
  return live;
}

const RING: Record<string, string> = {
  // Ink only (brand: no colour outside traces): the ring's weight tells the state.
  listening: "ring-foreground/40",
  speaking: "ring-foreground",
  thinking: "ring-foreground/60 animate-pulse",
  connecting: "ring-foreground/20 animate-pulse",
};

/**
 * Compact call UI for the floating launcher: a small avatar, a mic and an
 * end-call button, and a caption that appears while someone speaks and fades
 * away. It replaces the launcher while a call runs with the panel closed, so
 * on a phone the page stays usable. Portalled to <body> because the chat panel
 * is transformed, which would otherwise anchor `fixed` to the panel.
 */
export function VoiceDock({
  voice,
  pack,
  onExpand,
  onStart,
}: {
  voice: UseVoiceResult;
  /** Avatar pack to use for the avatar (default: sakura, via AnimeVoiceAvatar) */
  pack?: AvatarPack;
  /** Adds an "open chat" badge. Omit for a voice-only launcher. */
  onExpand?: () => void;
  /** Tapping the circle while no call is running starts one. */
  onStart?: () => void;
}) {
  const caption = useVanishingCaption(voice);
  const [small, setSmall] = React.useState(false);
  const [saying, setSaying] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const active = !["idle", "ended", "error"].includes(voice.state);
  // A fresh call always opens large, even if the last one was shrunk.
  React.useEffect(() => {
    if (!active) setSmall(false);
  }, [active]);
  // The avatar on screen, handed up by the indicator (null while it is not shown).
  const avatarRef = React.useRef<Avatar | null>(null);

  // End tapped: say goodbye (a wave), then hang up. The mic stays live: the user may still say
  // bye. The wave itself never ends the call: this function does, when the goodbye finishes or
  // GOODBYE_MS has passed, whichever comes first.
  const endTimer = React.useRef<number | null>(null);
  const endWithGoodbye = React.useCallback(() => {
    if (endTimer.current !== null) return;
    setSaying(true);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (endTimer.current !== null) window.clearTimeout(endTimer.current);
      endTimer.current = null;
      setSaying(false);
      voice.stop();
    };
    endTimer.current = window.setTimeout(finish, GOODBYE_MS);

    const avatar = avatarRef.current;
    if (!avatar) return finish();
    // keep the caption up for a beat even when motion is reduced and the wave is skipped
    const started = Date.now();
    void playGoodbye(avatar)
      .catch(() => null)
      .then(() => {
        const left = 700 - (Date.now() - started);
        if (left > 0) window.setTimeout(finish, left);
        else finish();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.stop]);
  React.useEffect(
    () => () => {
      if (endTimer.current !== null) window.clearTimeout(endTimer.current);
    },
    [],
  );

  // The agent hung up (or the call dropped): wave on the way out as well.
  const wasActive = React.useRef(false);
  React.useEffect(() => {
    if (wasActive.current && !active && endTimer.current === null) {
      const avatar = avatarRef.current;
      if (avatar) void playGoodbye(avatar).catch(() => null);
    }
    wasActive.current = active;
  }, [active]);

  // The server ended the call (or agent called end_call): show a clean caption and auto-hide after a few seconds.
  const [showEndedCaption, setShowEndedCaption] = React.useState(false);
  React.useEffect(() => {
    if (voice.state === "ended" && voice.endReason && voice.endReason !== "client_closed") {
      setShowEndedCaption(true);
      const timer = window.setTimeout(() => {
        setShowEndedCaption(false);
      }, 3500);
      return () => window.clearTimeout(timer);
    } else {
      setShowEndedCaption(false);
    }
  }, [voice.state, voice.endReason]);

  const [showErrorCaption, setShowErrorCaption] = React.useState(false);
  React.useEffect(() => {
    if (voice.state === "error") {
      setShowErrorCaption(true);
      const timer = window.setTimeout(() => {
        setShowErrorCaption(false);
      }, 4000);
      return () => window.clearTimeout(timer);
    } else {
      setShowErrorCaption(false);
    }
  }, [voice.state]);

  const [dismissedText, setDismissedText] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const errorText = showErrorCaption ? "Couldn't start the call. Tap to try again." : "";
  const endedText = showEndedCaption ? "Call ended. Tap to call again." : "";
  const shownCaption = saying
    ? "Bye bye! See you soon"
    : active
      ? caption
      : errorText || endedText;

  // Keep scroll pinned to bottom as speech streams in, while allowing user manual scrolling
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [shownCaption]);

  const isCaptionVisible = Boolean(shownCaption && shownCaption !== dismissedText);

  // The dock is a portal into <body>: render it only after mounting, so the first client render
  // matches the server HTML (which has no document) and hydration does not mismatch.
  if (!mounted) return null;

  return createPortal(
    <div
      role="region"
      aria-label="Voice call"
      className="pointer-events-none fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:right-6 sm:bottom-6"
    >
      {/* Caption: scrollable without scrollbar, dismissible via top-right circular X button */}
      <div
        aria-live="polite"
        className={cn(
          "relative w-fit max-w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border bg-background/95 px-3.5 py-2.5 text-sm leading-snug text-foreground shadow-lg backdrop-blur transition-all duration-300",
          isCaptionVisible
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-1 opacity-0",
        )}
      >
        {isCaptionVisible && (
          <button
            type="button"
            onClick={() => setDismissedText(shownCaption)}
            aria-label="Close transcript"
            className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-md transition-all hover:bg-muted hover:text-foreground active:scale-95"
          >
            <X className="size-3.5" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="max-h-48 overflow-y-auto select-text [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:max-h-56"
        >
          <span className="whitespace-pre-wrap">{shownCaption || " "}</span>
        </div>
      </div>

      {/* One circle: the avatar. Large shows mic / end / open-chat badges on it;
          tapping the avatar shrinks it to a bare small circle (badges hidden)
          and tapping again brings them back. */}
      <div className="pointer-events-auto relative">
        <button
          type="button"
          onClick={() => (active ? setSmall((v) => !v) : onStart?.())}
          aria-label={
            !active
              ? "Start voice call"
              : small
                ? "Show call controls"
                : "Hide call controls"
          }
          aria-expanded={active ? !small : undefined}
          className={cn(
            "relative block overflow-hidden rounded-full bg-card shadow-xl ring-2 transition-[width,height,box-shadow,transform] duration-300 ease-out active:scale-95",
            !active ? "size-16" : small ? "size-[3.75rem]" : "size-[7.5rem]",
            voice.isMuted
              ? "ring-destructive/60"
              : (RING[voice.state] ?? "ring-foreground/20"),
          )}
        >
          {/* The art is a square with empty space under the shoulders, which
              left a dark gap inside the circle. Scale it up and push it down so
              the shoulders run off the bottom edge and the circle is filled. */}
          <div
            className="size-full origin-center"
            style={{ transform: "translateY(10.5%) scale(1.35)" }}
          >
            <VoiceIndicator
              state={voice.state}
              voice={voice}
              pack={pack}
              size={!active ? 64 : small ? 60 : 120}
              variant="avatar"
              onAvatarReady={(a) => {
                avatarRef.current = a;
              }}
            />
          </div>
        </button>

        <div
          className={cn(
            // Covers the circle, so the badges' -top/-bottom/-right offsets are measured from it
            // (a transformed wrapper would otherwise become their containing block).
            "pointer-events-none absolute inset-0 transition-all duration-200 [&>button]:pointer-events-auto",
            !active || small
              ? "scale-75 opacity-0 [&>button]:pointer-events-none"
              : "scale-100 opacity-100",
          )}
          aria-hidden={!active || small}
        >
          <button
            type="button"
            onClick={() => voice.mute(!voice.isMuted)}
            tabIndex={!active || small ? -1 : 0}
            aria-label={voice.isMuted ? "Unmute microphone" : "Mute microphone"}
            className={cn(
              "absolute -bottom-3 left-1/2 flex size-8 -translate-x-[calc(100%+0.1875rem)] items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md transition-transform active:scale-95",
              voice.isMuted && "bg-destructive/10 text-destructive",
            )}
          >
            {voice.isMuted ? (
              <MicrophoneSlashIcon className="size-4" />
            ) : (
              <MicrophoneIcon className="size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={endWithGoodbye}
            tabIndex={!active || small ? -1 : 0}
            aria-label="End voice call"
            className="absolute -bottom-3 left-1/2 flex size-8 translate-x-[0.1875rem] items-center justify-center rounded-full bg-destructive text-white shadow-md transition-transform active:scale-95"
          >
            <PhoneXIcon weight="fill" className="size-4" />
          </button>
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              tabIndex={!active || small ? -1 : 0}
              aria-label="Open chat"
              className="absolute -top-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md transition-transform active:scale-95"
            >
              <ChatCircleDotsIcon className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
