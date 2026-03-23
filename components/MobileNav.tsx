'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Search, CalendarCheck, UserCircle2 } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border-dim/50 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around px-2 py-2">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 p-2 min-w-[60px] transition-colors ${pathname === '/dashboard' ? 'text-brand' : 'text-ink-dim hover:text-ink'}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-medium">Dashboard</span>
        </Link>

        <Link
          href="/browse"
          className={`flex flex-col items-center gap-1 p-2 min-w-[60px] transition-colors ${pathname === '/browse' || pathname?.startsWith('/providers') ? 'text-brand' : 'text-ink-dim hover:text-ink'}`}
        >
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-medium">Find Pros</span>
        </Link>

        <Link
          href="/bookings"
          className={`flex flex-col items-center gap-1 p-2 min-w-[60px] transition-colors ${pathname?.startsWith('/bookings') || pathname?.startsWith('/requests') ? 'text-brand' : 'text-ink-dim hover:text-ink'}`}
        >
          <CalendarCheck className="w-6 h-6" />
          <span className="text-[10px] font-medium">Bookings</span>
        </Link>

        <Link
          href="/account"
          className={`flex flex-col items-center gap-1 p-2 min-w-[60px] transition-colors ${pathname === '/account' ? 'text-brand' : 'text-ink-dim hover:text-ink'}`}
        >
          <UserCircle2 className="w-6 h-6" />
          <span className="text-[10px] font-medium">My Account</span>
        </Link>
      </div>
    </nav>
  );
}
