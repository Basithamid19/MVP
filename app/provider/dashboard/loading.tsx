import { Skeleton, SkeletonCard, SkeletonStat } from '@/components/ui';

// Provider dashboard: greeting, KPI row, work sections. Sits INSIDE
// app/provider/layout.tsx which already owns the outer shell + max width.
export default function Loading() {
  return (
    <>
      <Skeleton rounded="chip" className="h-7 w-56" />
      <Skeleton rounded="chip" className="h-3.5 w-40 mt-2.5" />

      <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      <div className="space-y-3 mt-8">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </>
  );
}
