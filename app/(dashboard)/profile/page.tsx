import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/dostify/current-user";

export const metadata: Metadata = { title: "Profile — Dostify" };

export default function ProfilePage() {
  return (
    <>
      <h1 className="font-heading text-2xl font-semibold">Profile</h1>
      <Suspense fallback={<Skeleton className="skeleton-shimmer h-40 animate-none rounded-xl" />}>
        <ProfileCard />
      </Suspense>
    </>
  );
}

async function ProfileCard() {
  const user = await getCurrentDbUser();
  if (!user) return <p className="text-sm text-muted-foreground">Please sign in.</p>;

  const journalEntries = await prisma.journalEntry.count({ where: { userId: user.id } });
  const since = user.createdAt.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          {user.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt="" className="size-16 rounded-full" />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/15 text-2xl font-semibold text-primary">
              {(user.name ?? user.email)[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{user.name ?? "Dost"}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Dost since</dt>
            <dd className="text-sm font-medium">{since}</dd>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <dt className="text-xs text-muted-foreground">Journal entries</dt>
            <dd className="text-sm font-medium">{journalEntries}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
