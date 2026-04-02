'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Home, Search, Inbox, UserCircle2, Briefcase, TrendingUp } from 'lucide-react';

const CUSTOMER_TABS = [
  { href: '/',          label: 'Home',      icon: Home,        active: (p: string) => p === '/' },
  { href: '/browse',    label: 'Find Pros',  icon: Search,      active: (p: string) => p === '/browse' || p.startsWith('/providers') },
  { href: '/dashboard', label: 'Dashboard',  icon: Inbox,       active: (p: string) => p === '/dashboard' || p.startsWith('/bookings') || p.startsWith('/requests') },
  { href: '/account',   label: 'Account',    icon: UserCircle2, active: (p: string) => p === '/account' },
];

const PROVIDER_TABS = [
  { href: '/',                    label: 'Home',      icon: Home,        active: (p: string) => p === '/' },
  { href: '/provider/dashboard',  label: 'Dashboard', icon: Inbox,       active: (p: string) => p === '/provider/dashboard' || p === '/provider/leads' },
  { href: '/provider/jobs',       label: 'Jobs',      icon: Briefcase,   active: (p: string) => p.startsWith('/provider/jobs') },
  { href: '/provider/settings',   label: 'Account',   icon: UserCircle2, active: (p: string) => p === '/provider/settings' },
];

export default function MobileNav() {
  const pathname = usePathname() ?? '';
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const tabs = role === 'PROVIDER' ? PROVIDER_TABS : CUSTOMER_TABS;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white/90 backdrop-blur-xl border-t border-border-dim shadow-[0_-4px_24px_rgba(0,0,0,0.10)] pb-safe">
        <div className="flex items-center justify-around px-1 py-1.5">
          {tabs.map(({ href, label, icon: Icon, active }) => {
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
