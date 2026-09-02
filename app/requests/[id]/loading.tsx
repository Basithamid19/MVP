import { Skeleton, SkeletonCard } from '@/components/ui';

// Request detail: back + title, description panel, quotes list.
export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <Skeleton className="w-10 h-10" />
          <Skeleton rounded="chip" className="h-5 w-40" />
        </div>

        <Skeleton rounded="panel" className="h-32 w-full" />

        <Skeleton rounded="chip" className="h-3 w-24 mt-6 mb-3" />
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
