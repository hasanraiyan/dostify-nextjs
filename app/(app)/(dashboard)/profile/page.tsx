import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentDbUser } from "@/lib/dostify/current-user";
import { countEntries } from "@/lib/dostify/journal";
import { ProfileView } from "./profile-view";

export const metadata: Metadata = { title: "Profile — Dostify" };

export default function ProfilePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold">Profile</h1>
      <Suspense
        fallback={
          <div className="flex flex-col gap-4" role="status" aria-label="Loading profile">
            <Skeleton className="skeleton-shimmer h-32 animate-none rounded-2xl" />
            <Skeleton className="skeleton-shimmer h-24 animate-none rounded-2xl" />
            <Skeleton className="skeleton-shimmer h-24 animate-none rounded-2xl" />
          </div>
        }
      >
        <ProfileData />
      </Suspense>
    </div>
  );
}

async function ProfileData() {
  const user = await getCurrentDbUser();
  const journalEntries = user ? await countEntries(user.id) : 0;
  const memberSince = user
    ? user.createdAt.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return <ProfileView memberSince={memberSince} journalEntries={journalEntries} />;
}
