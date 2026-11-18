import { Suspense } from "react";
import type { Metadata } from "next";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/dostify/current-user";
import { addEntry, deleteEntry } from "./actions";

export const metadata: Metadata = { title: "Journal — Dostify" };

const MOODS = [
  { value: 1, emoji: "😞", label: "Very low" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
] as const;

const formatDate = (d: Date) =>
  d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function JournalPage() {
  return (
    <>
      <div>
        <h1 className="font-heading text-2xl font-semibold">Journal</h1>
        <p className="text-sm text-muted-foreground">
          Jo bhi dil mein hai, yahan likh de. Dostify chat mein bhi tera journal save karta hai.
        </p>
      </div>

      <Card>
        <CardContent>
          <form action={addEntry} className="flex flex-col gap-3">
            <Textarea
              name="text"
              required
              maxLength={5000}
              placeholder="Aaj kaisa raha?"
              className="min-h-24 rounded-xl"
              aria-label="Journal entry"
            />
            <fieldset className="flex flex-wrap items-center gap-2">
              <legend className="sr-only">Mood</legend>
              {MOODS.map((m) => (
                <label
                  key={m.value}
                  title={m.label}
                  className="cursor-pointer rounded-full border border-border px-3 py-1 text-lg transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/15 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                >
                  <input type="radio" name="mood" value={m.value} className="sr-only" />
                  <span aria-hidden>{m.emoji}</span>
                  <span className="sr-only">{m.label}</span>
                </label>
              ))}
              <Button type="submit" className="ml-auto rounded-full">
                Save
              </Button>
            </fieldset>
          </form>
        </CardContent>
      </Card>

      <Suspense fallback={<EntriesSkeleton />}>
        <Entries />
      </Suspense>
    </>
  );
}

async function Entries() {
  const user = await getCurrentDbUser();
  const entries = user
    ? await prisma.journalEntry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Abhi koi entry nahi hai. Pehli likh de.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((e) => {
        const mood = MOODS.find((m) => m.value === e.mood);
        return (
          <li key={e.id}>
            <Card size="sm">
              <CardContent className="flex items-start gap-3">
                <span className="text-2xl" title={mood?.label} aria-label={mood?.label}>
                  {mood?.emoji ?? "📝"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap break-words text-sm">{e.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(e.createdAt)}</p>
                </div>
                <form action={deleteEntry}>
                  <input type="hidden" name="id" value={e.id} />
                  <Button
                    type="submit"
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-full"
                    aria-label="Delete entry"
                  >
                    <TrashIcon />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

function EntriesSkeleton() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Loading entries">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="skeleton-shimmer h-20 animate-none rounded-xl" />
      ))}
    </div>
  );
}
