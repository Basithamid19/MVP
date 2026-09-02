import { Skeleton, SkeletonCard } from '@/components/ui';

// Sent quotes: work tabs + header + section label + quote rows. Sits INSIDE
// app/provider/layout.tsx.
export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Work tabs */}
      <div className="flex gap-2 mb-6">
        <Skeleton rounded="chip" className="h-8 w-20" />
        <Skeleton rounded="chip" className="h-8 w-20" />
        <Skeleton rounded="chip" className="h-8 w-20" />
      </div>

      <Skeleton rounded="chip" className="h-7 w-40" />
      <Skeleton rounded="chip" className="h-3.5 w-48 mt-2.5" />

      <Skeleton rounded="chip" className="h-3 w-24 mt-6 mb-3" />
      <div className="space-y-2.5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
