import { Skeleton, SkeletonCard } from '@/components/ui';

// Requests list: page header w/ trailing CTA, section label, N cards.
export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <Skeleton rounded="chip" className="h-7 w-40" />
          <Skeleton rounded="input" className="h-9 w-32" />
        </div>

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
