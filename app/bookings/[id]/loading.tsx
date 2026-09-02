import { Skeleton, SkeletonCard } from '@/components/ui';

// Booking detail: hero card, then the stacked info sections (provider, timeline,
// deposit). Full-page shell — this route sits above CustomerLayout.
export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-3xl mx-auto">
        {/* Sub-header row (back + title) */}
        <div className="flex items-center gap-3 mb-5">
          <Skeleton className="w-10 h-10" />
          <Skeleton rounded="chip" className="h-5 w-32" />
        </div>

        {/* Hero panel — status + amount */}
        <Skeleton rounded="panel" className="h-40 sm:h-44 w-full" />

        {/* Detail sections */}
        <div className="space-y-3 mt-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
