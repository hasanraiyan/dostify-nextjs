"use client";

import * as React from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  CaretRightIcon,
  CheckCircleIcon,
  GearSixIcon,
  MonitorIcon,
  MoonIcon,
  NotebookIcon,
  PlugsConnectedIcon,
  SignOutIcon,
  SparkleIcon,
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
    setSavedStatus("Saving...");
    startTransition(async () => {
      try {
        await saveUserAvatarChoice(selectedId);
        setSavedStatus("Saved to database");
        setTimeout(() => setSavedStatus(null), 2500);
      } catch {
        setSavedStatus("Failed to save");
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

      {/* AI Companion Avatar Selection */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <SparkleIcon className="size-5 text-primary" weight="fill" />
              AI Companion Avatar
            </CardTitle>
            <CardDescription>
              Choose your personal AI companion persona across all voice calls and chat.
            </CardDescription>
          </div>
          {savedStatus && (
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-opacity",
                savedStatus.includes("Saved")
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : savedStatus.includes("Failed")
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground animate-pulse",
              )}
            >
              {savedStatus}
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {AVATAR_OPTIONS.map((opt) => {
              const isSelected = avatarId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectAvatar(opt.id)}
                  aria-pressed={isSelected}
                  disabled={isPending}
                  className={cn(
                    "group relative flex flex-col items-center rounded-2xl border p-4 text-center transition-all duration-200 active:scale-[0.98]",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/40"
                      : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30",
                  )}
                >
                  {/* Selected check badge */}
                  {isSelected && (
                    <div className="absolute right-3 top-3 text-primary">
                      <CheckCircleIcon weight="fill" className="size-5" />
                    </div>
                  )}

                  {/* Avatar Circular Preview */}
                  <div
                    className={cn(
                      "relative mb-3 flex size-24 items-center justify-center rounded-full overflow-hidden shadow-inner ring-2 transition-all duration-200",
                      isSelected
                        ? "ring-primary ring-offset-2 ring-offset-background"
                        : "ring-border/70 group-hover:ring-primary/40",
                    )}
                  >
                    <div
                      className="size-full origin-center"
                      style={{ transform: "translateY(10.5%) scale(1.35)" }}
                    >
                      <AnimeVoiceAvatar
                        pack={opt.pack}
                        size={96}
                        state="idle"
                        emotion="happy"
                        mouseTracking={false}
                      />
                    </div>
                  </div>

                  {/* Avatar details */}
                  <div className="w-full">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-semibold text-foreground">{opt.name}</span>
                    </div>
                    <span className="mt-0.5 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {opt.badge}
                    </span>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
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

