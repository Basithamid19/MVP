'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Inbox, UserCircle2 } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border-dim/50 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around px-2 py-2">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 p-2 min-w-[60px] transition-colors ${pathname === '/' ? 'text-brand' : 'text-ink-dim hover:text-ink'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <Link
          href="/browse"
          className={`flex flex-col items-center gap-1 p-2 min-w-[60px] transition-colors ${pathname === '/browse' || pathname?.startsWith('/providers') ? 'text-brand' : 'text-ink-dim hover:text-ink'}`}
        >
          <Search className="w-6 h-6" />
          <span className="text-[10px] font-medium">Find Pros</span>
        </Link>

        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 p-2 min-w-[60px] transition-colors ${pathname === '/dashboard' || pathname?.startsWith('/bookings') || pathname?.startsWith('/requests') ? 'text-brand' : 'text-ink-dim hover:text-ink'}`}
        >
          <Inbox className="w-6 h-6" />
          <span className="text-[10px] font-medium">Dashboard</span>
        </Link>

        <Link
          href="/account"
          className={`flex flex-col items-center gap-1 p-2 min-w-[60px] transition-colors ${pathname === '/account' ? 'text-brand' : 'text-ink-dim hover:text-ink'}`}
        >
          <UserCircle2 className="w-6 h-6" />
          <span className="text-[10px] font-medium">Account</span>
        </Link>
      </div>
    </nav>
  );
}
