import { Skeleton, SkeletonCard } from '@/components/ui';

// Browse: search bar + category chip row, then the two-column card grid.
// Mirrors the real page's max-w-7xl column so first paint doesn't reflow.
export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas px-4 sm:px-6 lg:px-10 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Search + filters toolbar */}
        <div className="flex items-center gap-2.5 mb-3">
          <Skeleton rounded="card" className="w-10 h-10 shrink-0" />
          <Skeleton rounded="card" className="h-10 flex-1" />
          <Skeleton rounded="card" className="h-10 w-24 shrink-0 lg:hidden" />
        </div>

        {/* Category chip row (mobile) */}
        <div className="lg:hidden flex gap-1.5 pt-1 pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} rounded="full" className="h-8 w-20 shrink-0" />
          ))}
        </div>

        {/* Results grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  );
}
