import { Skeleton, SkeletonCard } from '@/components/ui';

// Account shape: profile hero panel, then the settings sections.
export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas px-4 sm:px-6 lg:px-10 py-6">
      <div className="max-w-5xl mx-auto">
        {/* Profile hero */}
        <Skeleton rounded="panel" className="h-32 sm:h-36 w-full" />

        {/* Settings sections */}
        <div className="space-y-3 mt-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
