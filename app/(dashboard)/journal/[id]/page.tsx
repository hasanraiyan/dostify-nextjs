import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentDbUser } from "@/lib/dostify/current-user";
import { dayLabel, timeLabel } from "@/lib/dostify/dates";
import { getEntry } from "@/lib/dostify/journal";
import { Editor } from "../editor";

export const metadata: Metadata = { title: "Journal — Dostify" };

export default function EntryPage({ params }: PageProps<"/journal/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-3 p-6" role="status" aria-label="Loading entry">
          <Skeleton className="skeleton-shimmer h-8 w-2/3 animate-none rounded-lg" />
          <Skeleton className="skeleton-shimmer h-40 w-full animate-none rounded-xl" />
        </div>
      }
    >
      <LoadedEditor params={params} />
    </Suspense>
  );
}

async function LoadedEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentDbUser();
  const entry = user ? await getEntry(user.id, id) : null;
  if (!entry) notFound();

  return (
    <Editor
      // Remount when switching between entries so the fields reset.
      key={entry.id}
      entry={{
        id: entry.id,
        text: entry.text,
        pinned: entry.pinned,
        createdLabel: `${dayLabel(entry.createdAt)}, ${timeLabel(entry.createdAt)}`,
      }}
    />
  );
}
