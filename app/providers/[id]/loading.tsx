import { Skeleton, SkeletonCard } from '@/components/ui';

// Provider profile: sub-header + hero panel + content sections + right rail.
export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-5xl mx-auto">
        {/* Sub-header */}
        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <Skeleton rounded="full" className="w-11 h-11" />
          <Skeleton rounded="chip" className="h-5 w-32" />
        </div>

        {/* Hero panel */}
        <Skeleton rounded="panel" className="h-60 sm:h-72 w-full" />

        {/* Body: content column + rail */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-4 sm:mt-6">
          <div className="lg:col-span-1 order-1 lg:order-2">
            <Skeleton rounded="panel" className="h-64 sm:h-72 w-full" />
          </div>
          <div className="lg:col-span-2 order-2 lg:order-1 space-y-4 sm:space-y-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  );
}
