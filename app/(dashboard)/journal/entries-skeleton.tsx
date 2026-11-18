import { Skeleton } from "@/components/ui/skeleton";

export function EntriesSkeleton() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Loading entries">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="skeleton-shimmer h-20 animate-none rounded-xl" />
      ))}
    </div>
  );
}
