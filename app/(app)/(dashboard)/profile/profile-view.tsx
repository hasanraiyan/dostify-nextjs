"use client";

import * as React from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  CaretRightIcon,
  GearSixIcon,
  MonitorIcon,
  MoonIcon,
  NotebookIcon,
  PlugsConnectedIcon,
  PlusIcon,
  SignOutIcon,
  SunIcon,
  type Icon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useThemePref } from "@/components/dostify/use-theme";
import type { ThemePref } from "@/lib/dostify/theme";
import { cn } from "@/lib/utils";
import { AVATAR_OPTIONS, type AvatarId } from "@/lib/dostify/avatar-config";
import { useAvatarPref } from "@/components/dostify/use-avatar-pref";
import { saveUserAvatarChoice } from "@/lib/dostify/avatar-actions";
import { AnimeVoiceAvatar } from "@/components/persona/avatar";

const THEMES: { value: ThemePref; label: string; icon: Icon }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

const SHORTCUTS = [
  { href: "/journal", label: "Journal", description: "Your entries", icon: NotebookIcon },
  { href: "/connectors", label: "Connectors", description: "Connected accounts", icon: PlugsConnectedIcon },
] as const;

export function ProfileView({
  memberSince,
  journalEntries,
  initialAvatar = "sakura",
}: {
  memberSince: string | null;
  journalEntries: number;
  initialAvatar?: AvatarId;
}) {
  const { user, isLoaded } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const [theme, setTheme] = useThemePref();
  const { avatarId, setAvatar } = useAvatarPref(initialAvatar);
  const [isPending, startTransition] = React.useTransition();
  const [savedStatus, setSavedStatus] = React.useState<string | null>(null);

  const handleSelectAvatar = (selectedId: AvatarId) => {
    if (selectedId === avatarId) return;
    setAvatar(selectedId);
    setSavedStatus("Saving…");
    startTransition(async () => {
      try {
        await saveUserAvatarChoice(selectedId);
        setSavedStatus("Saved");
        setTimeout(() => setSavedStatus(null), 2500);
      } catch {
        setSavedStatus("Couldn't save. Try again.");
      }
    });
  };

  if (!isLoaded) return <Skeleton className="skeleton-shimmer h-32 animate-none rounded-2xl" />;
  if (!user) return <p className="text-sm text-muted-foreground">Please sign in.</p>;

  const name = user.fullName || user.username || "Friend";

  return (
    <>
      <Card className="gap-0 p-0">
        {/* Soft banner; the avatar overlaps its bottom edge. */}
        <div className="h-20 bg-gradient-to-br from-primary/30 via-primary/15 to-transparent" />
        <CardContent className="flex flex-col gap-5 px-5 pb-5">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.imageUrl}
                alt=""
                className="size-20 shrink-0 rounded-full object-cover ring-4 ring-card"
              />
              <div className="min-w-0 pb-1">
                <p className="truncate text-xl font-semibold">{name}</p>
                {user.primaryEmailAddress && (
                  <p className="truncate text-sm text-muted-foreground">
                    {user.primaryEmailAddress.emailAddress}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button type="button" className="rounded-full" onClick={() => openUserProfile()}>
                <GearSixIcon /> Manage account
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => void signOut({ redirectUrl: "/sign-in" })}
              >
                <SignOutIcon /> Sign out
              </Button>
            </div>
          </div>

          <dl className="grid grid-cols-2 divide-x rounded-xl border bg-muted/40">
            <div className="px-4 py-3">
              <dt className="text-xs text-muted-foreground">Member since</dt>
              <dd className="text-sm font-medium">{memberSince ?? "-"}</dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-xs text-muted-foreground">Journal entries</dt>
              <dd className="text-sm font-medium">{journalEntries}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Companion: pick the face Dostify wears in voice calls. */}
      <Card>
        <CardHeader>
          <CardTitle>Companion</CardTitle>
          <CardDescription>
            {savedStatus ?? "The face you see in voice calls."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Two across on phones, three from sm. */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {AVATAR_OPTIONS.map((opt) => {
              const selected = avatarId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectAvatar(opt.id)}
                  aria-pressed={selected}
                  disabled={isPending}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-2xl border p-3 transition-colors sm:p-4",
                    selected ? "border-foreground" : "border-border hover:bg-muted",
                  )}
                >
                  <span className="relative block size-[4.5rem] overflow-hidden rounded-full bg-card">
                    <span
                      className="block size-full origin-center"
                      style={{ transform: "translateY(10.5%) scale(1.35)" }}
                    >
                      <AnimeVoiceAvatar
                        pack={opt.pack}
                        size={72}
                        state="idle"
                        emotion="happy"
                        mouseTracking={false}
                      />
                    </span>
                  </span>
                  <span className="text-sm font-medium">{opt.name}</span>
                </button>
              );
            })}

            {/* Not available yet: shown, but not clickable. */}
            <div
              aria-disabled="true"
              // Full-width row on phones (it would be a lonely half-tile), a tile from sm.
              className="col-span-2 flex flex-row items-center gap-3 rounded-2xl border border-dashed p-3 text-muted-foreground sm:col-span-1 sm:flex-col sm:p-4"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted sm:size-[4.5rem]">
                <PlusIcon className="size-6" />
              </span>
              <span className="flex flex-col sm:items-center sm:text-center">
                <span className="text-sm font-medium text-foreground">Create your own</span>
                <span className="text-xs">Coming soon</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Saved on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
            {THEMES.map(({ value, label, icon: ThemeIcon }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <ThemeIcon weight={active ? "fill" : "regular"} className="size-5" />
                  {label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {SHORTCUTS.map(({ href, label, description, icon: ShortcutIcon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 transition-colors hover:bg-muted"
          >
            <ShortcutIcon className="size-5 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs text-muted-foreground">{description}</span>
            </span>
            <CaretRightIcon className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </>
  );
}

