"use client";

import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  CaretRightIcon,
  GearSixIcon,
  MonitorIcon,
  MoonIcon,
  NotebookIcon,
  PlugsConnectedIcon,
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
}: {
  memberSince: string | null;
  journalEntries: number;
}) {
  const { user, isLoaded } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const [theme, setTheme] = useThemePref();

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
