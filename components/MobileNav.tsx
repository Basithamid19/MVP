'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Inbox, UserCircle2 } from 'lucide-react';

const TABS = [
  { href: '/',          label: 'Home',      icon: Home,        active: (p: string) => p === '/' },
  { href: '/browse',    label: 'Find Pros',  icon: Search,      active: (p: string) => p === '/browse' || p.startsWith('/providers') },
  { href: '/dashboard', label: 'Dashboard',  icon: Inbox,       active: (p: string) => p === '/dashboard' || p.startsWith('/bookings') || p.startsWith('/requests') },
  { href: '/account',   label: 'Account',    icon: UserCircle2, active: (p: string) => p === '/account' },
];

export default function MobileNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {/* Frosted glass bar */}
      <div className="mx-3 mb-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-border-dim shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="flex items-center justify-around px-1 py-1.5">
          {TABS.map(({ href, label, icon: Icon, active }) => {
            const isActive = active(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? 'text-brand' : 'text-ink-dim'
                }`}
              >
                {/* Active pill indicator */}
                {isActive && (
                  <span className="absolute inset-0 bg-brand-muted rounded-xl" />
                )}
                <Icon className={`relative w-5 h-5 ${isActive ? 'stroke-[2]' : 'stroke-[1.5]'}`} />
                <span className={`relative text-[10px] font-semibold tracking-tight ${isActive ? 'text-brand' : 'text-ink-dim'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
