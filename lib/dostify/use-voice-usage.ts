"use client";

import * as React from "react";

const LIVE = new Set(["listening", "thinking", "speaking"]);

function report(action: "start" | "end") {
  // keepalive lets the "end" report survive a tab close or navigation.
  void fetch("/api/usage/voice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Tells the server when a voice call connects and when it ends, so call time
 * can be counted against the monthly limit. Pass the voice state from useVoice.
 */
export function useVoiceUsage(state: string) {
  const live = LIVE.has(state);
  const wasLive = React.useRef(false);

  React.useEffect(() => {
    if (live && !wasLive.current) report("start");
    if (!live && wasLive.current) report("end");
    wasLive.current = live;
  }, [live]);

  // Leaving while a call is live (route change, tab close) also ends it.
  React.useEffect(() => {
    const onHide = () => {
      if (wasLive.current) {
        wasLive.current = false;
        report("end");
      }
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
    };
  }, []);
}
