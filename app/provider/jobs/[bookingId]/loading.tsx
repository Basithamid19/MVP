import { Skeleton, SkeletonCard } from '@/components/ui';

// Provider job page: back + title, hero card, then customer + timeline + payout
// sections. Sits INSIDE app/provider/layout.tsx.
export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Skeleton className="w-10 h-10" />
        <Skeleton rounded="chip" className="h-5 w-40" />
      </div>

      <Skeleton rounded="panel" className="h-40 sm:h-44 w-full" />

      <div className="space-y-3 mt-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
