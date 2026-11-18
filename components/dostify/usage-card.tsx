"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { UsageSummary } from "@/lib/dostify/usage";

function formatVoice(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function Meter({ label, used, limit, text }: { label: string; used: number; limit: number; text: string }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{text}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-destructive" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** This month's free usage: chat messages and voice time. Resets on the 1st (IST). */
export function UsageCard() {
  const [usage, setUsage] = React.useState<UsageSummary | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/usage/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => !cancelled && setUsage(data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!usage) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Free plan usage</CardTitle>
        <CardDescription>This month. Resets on the 1st.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Meter
          label="Chat messages"
          used={usage.messages}
          limit={usage.messageLimit}
          text={`${usage.messages} / ${usage.messageLimit}`}
        />
        <Meter
          label="Voice time"
          used={usage.voiceSeconds}
          limit={usage.voiceLimitSeconds}
          text={`${formatVoice(usage.voiceSeconds)} / ${formatVoice(usage.voiceLimitSeconds)}`}
        />
      </CardContent>
    </Card>
  );
}
