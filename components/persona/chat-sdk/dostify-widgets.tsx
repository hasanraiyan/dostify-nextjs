"use client";

import * as React from "react";
import { HeartIcon, PhoneIcon, PlayIcon, StopIcon, WindIcon } from "@phosphor-icons/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Dostify-specific cards rendered by the frontend tools in frontend-tools.tsx.
 */

// ── Helpline card (crisis protocol) ─────────────────────────────────────────
// The numbers are fixed here on purpose: the agent calls the tool with no
// arguments, so nothing the model writes can change what a person in crisis
// is shown. Double-check these before launch, they can change.
const HELPLINES = [
  {
    name: "Tele-MANAS",
    detail: "Free, 24x7 mental health support",
    display: "14416 or 1-800-891-4416",
    href: "tel:14416",
  },
  {
    name: "KIRAN",
    detail: "Government mental health helpline",
    display: "1800-599-0019",
    href: "tel:18005990019",
  },
  {
    name: "iCall",
    detail: "Counselling by trained professionals",
    display: "9152987821",
    href: "tel:+919152987821",
  },
  {
    name: "Emergency",
    detail: "If you or someone is in immediate danger",
    display: "112",
    href: "tel:112",
  },
] as const;

export function HelplineCard() {
  return (
    <Card size="sm" className="w-full max-w-md border-primary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <HeartIcon weight="fill" className="size-4 text-primary" />
          You are not alone
        </CardTitle>
        <CardDescription>
          If things feel too heavy right now, you can talk to these people. The calls are free.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {HELPLINES.map((h) => (
          <div key={h.name} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{h.name}</p>
              <p className="text-xs text-muted-foreground">{h.detail}</p>
              <p className="text-xs tabular-nums">{h.display}</p>
            </div>
            <a
              href={h.href}
              className={buttonVariants({ variant: "outline", size: "sm" })}
              aria-label={`Call ${h.name}`}
            >
              <PhoneIcon /> Call
            </a>
          </div>
        ))}
        <p className="pt-1 text-xs text-muted-foreground">
          Please reach out to someone you trust, like family or a friend, who can be with you.
        </p>
      </CardContent>
    </Card>
  );
}

// ── 4-7-8 breathing exercise ────────────────────────────────────────────────
const PHASES = [
  { label: "Breathe in", seconds: 4, scale: 1 },
  { label: "Hold", seconds: 7, scale: 1 },
  { label: "Breathe out", seconds: 8, scale: 0.55 },
] as const;
const CYCLES = 4;

export function BreathingExercise() {
  const [running, setRunning] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [cycle, setCycle] = React.useState(1);
  const [phase, setPhase] = React.useState(0);
  const [left, setLeft] = React.useState<number>(PHASES[0].seconds);

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((l) => {
        if (l > 1) return l - 1;
        // Phase finished: advance to the next phase, or the next cycle.
        if (phase < PHASES.length - 1) {
          setPhase(phase + 1);
          return PHASES[phase + 1].seconds;
        }
        if (cycle < CYCLES) {
          setCycle(cycle + 1);
          setPhase(0);
          return PHASES[0].seconds;
        }
        setRunning(false);
        setDone(true);
        return 0;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase, cycle]);

  const start = () => {
    setDone(false);
    setCycle(1);
    setPhase(0);
    setLeft(PHASES[0].seconds);
    setRunning(true);
  };

  const current = PHASES[phase];
  const active = running && !done;

  return (
    <Card size="sm" className="w-full max-w-xs">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <WindIcon className="size-4" />
          Breathing 4-7-8
        </CardTitle>
        <CardDescription>
          {done
            ? "Done. How do you feel now?"
            : active
              ? `Round ${cycle} of ${CYCLES}`
              : "In for 4, hold for 7, out for 8. Four rounds."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div className="relative flex h-32 w-32 items-center justify-center" aria-live="polite">
          <div
            className="flex size-full items-center justify-center rounded-full bg-primary/15 ring-2 ring-primary/40 motion-safe:transition-transform motion-safe:ease-in-out"
            style={{
              transform: `scale(${active ? current.scale : 0.55})`,
              transitionDuration: active ? `${phase === 1 ? 0 : current.seconds}s` : "0.3s",
            }}
          />
          <span className="absolute text-center text-sm font-medium">
            {active ? (
              <>
                {current.label}
                <br />
                <span className="font-mono text-2xl tabular-nums">{left}</span>
              </>
            ) : null}
          </span>
        </div>
        {active ? (
          <Button size="sm" variant="outline" onClick={() => setRunning(false)}>
            <StopIcon /> Stop
          </Button>
        ) : (
          <Button size="sm" onClick={start}>
            <PlayIcon /> {done ? "Again" : "Start"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
