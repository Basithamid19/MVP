import { Skeleton, SkeletonStat, SkeletonCard } from '@/components/ui';

// Rendered instantly while the server component fetches data, so the URL
// commit + active-nav-state happen immediately on click instead of after
// Prisma finishes. Shape mirrors the dashboard: greeting, KPI row, list.
export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-5xl mx-auto">
        {/* Greeting */}
        <Skeleton rounded="chip" className="h-7 w-56" />
        <Skeleton rounded="chip" className="h-3.5 w-40 mt-2.5" />

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>

        {/* Recent activity */}
        <div className="space-y-3 mt-8">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
