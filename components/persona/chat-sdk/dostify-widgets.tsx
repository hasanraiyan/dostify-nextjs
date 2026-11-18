"use client";

import * as React from "react";
import { HeartIcon, PhoneIcon } from "@phosphor-icons/react";
import { buttonVariants } from "@/components/ui/button";
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
