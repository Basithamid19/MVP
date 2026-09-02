import { Skeleton, SkeletonCard } from '@/components/ui';

// Leads inbox: work tabs + title + search/filter row + N lead cards. Sits
// INSIDE app/provider/layout.tsx.
export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Work tabs */}
      <div className="flex gap-2 mb-6">
        <Skeleton rounded="chip" className="h-8 w-20" />
        <Skeleton rounded="chip" className="h-8 w-20" />
        <Skeleton rounded="chip" className="h-8 w-20" />
      </div>

      {/* Page header */}
      <Skeleton rounded="chip" className="h-7 w-40" />
      <Skeleton rounded="chip" className="h-3.5 w-56 mt-2.5" />

      {/* Search + filter chips */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6 mb-5">
        <Skeleton rounded="card" className="h-11 flex-1" />
        <div className="flex gap-1.5">
          <Skeleton rounded="full" className="h-8 w-20" />
          <Skeleton rounded="full" className="h-8 w-24" />
          <Skeleton rounded="full" className="h-8 w-20" />
        </div>
      </div>

      {/* Lead cards */}
      <div className="space-y-2.5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
