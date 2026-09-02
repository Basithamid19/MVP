import { Skeleton, SkeletonCard } from '@/components/ui';

// Bookings list: page header + section label + rows. Matches the real page's
// max-w-2xl column so first paint doesn't reflow.
export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-2xl mx-auto">
        <Skeleton rounded="chip" className="h-7 w-40" />

        <Skeleton rounded="chip" className="h-3 w-24 mt-6 mb-3" />
        <div className="space-y-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
