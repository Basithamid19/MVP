import { Loader2 } from 'lucide-react';

// Rendered instantly while the server component fetches data, so the URL
// commit + active-nav-state happen immediately on click instead of after
// Prisma finishes.
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
    </div>
  );
}
