import { Skeleton, SkeletonCard } from '@/components/ui';

// Thread-list shape: title bar + three conversation rows.
export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-5xl mx-auto">
        <Skeleton rounded="chip" className="h-7 w-40" />

        <div className="space-y-3 mt-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
