'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Search, CalendarCheck, Settings } from 'lucide-react';

function MobileNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const isBookingsActive =
    (pathname === '/account' && tabParam !== 'settings') ||
    pathname?.startsWith('/bookings') ||
    pathname?.startsWith('/requests');

  const isSettingsActive =
    pathname === '/account' && tabParam === 'settings';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border-dim/50 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around px-2 py-2">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors ${pathname === '/dashboard' ? 'text-brand' : 'text-ink-dim hover:text-ink'}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <Link
          href="/browse"
          className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors ${pathname === '/browse' || pathname?.startsWith('/providers') ? 'text-brand' : 'text-ink-dim hover:text-ink'}`}
        >
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-medium">Find Pros</span>
        </Link>

        <Link
          href="/account"
          className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors ${isBookingsActive ? 'text-brand' : 'text-ink-dim hover:text-ink'}`}
        >
          <CalendarCheck className="w-6 h-6" />
          <span className="text-[10px] font-medium">Bookings</span>
        </Link>

        <Link
          href="/account?tab=settings"
          className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors ${isSettingsActive ? 'text-brand' : 'text-ink-dim hover:text-ink'}`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-medium">Settings</span>
        </Link>
      </div>
    </nav>
  );
}

export default function MobileNav() {
  return (
    <Suspense fallback={null}>
      <MobileNavInner />
    </Suspense>
  );
}
