'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Home, Search, MessageCircle, Inbox, UserCircle2, Briefcase, TrendingUp, LogIn } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function MobileNav() {
  const pathname = usePathname() ?? '';
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role;
  const t = useTranslation();

  // Don't render until auth is resolved to avoid flash
  if (status === 'loading') return null;

  // Built inside the component so labels follow the active locale.
  const GUEST_TABS = [
    { href: '/',       label: t.nav.home,     icon: Home,   active: (p: string) => p === '/' },
    { href: '/browse', label: t.nav.findPros, icon: Search, active: (p: string) => p === '/browse' || p.startsWith('/providers') },
    { href: '/login',  label: t.nav.logIn,    icon: LogIn,  active: (p: string) => p === '/login' },
  ];

  const CUSTOMER_TABS = [
    { href: '/',          label: t.nav.home,        icon: Home,          active: (p: string) => p === '/' },
    { href: '/browse',    label: t.nav.findPros,    icon: Search,        active: (p: string) => p === '/browse' || p.startsWith('/providers') },
    { href: '/messages',  label: t.nav.messages,    icon: MessageCircle, active: (p: string) => p.startsWith('/messages') },
    { href: '/dashboard', label: t.nav.dashboard,   icon: Inbox,         active: (p: string) => p === '/dashboard' || p.startsWith('/bookings') || p.startsWith('/requests') },
    { href: '/account',   label: t.mobileNav.account, icon: UserCircle2, active: (p: string) => p === '/account' },
  ];

  const PROVIDER_TABS = [
    { href: '/provider/dashboard',   label: t.providerNav.dashboard, icon: Inbox,     active: (p: string) => p === '/provider/dashboard' },
    { href: '/provider/jobs',        label: t.mobileNav.jobs,    icon: Briefcase,     active: (p: string) => p.startsWith('/provider/jobs') || p.startsWith('/provider/leads') },
    { href: '/messages',             label: t.nav.messages,      icon: MessageCircle, active: (p: string) => p.startsWith('/messages') },
    { href: '/provider/performance', label: t.mobileNav.stats,   icon: TrendingUp,    active: (p: string) => p === '/provider/performance' || p === '/provider/earnings' },
    { href: '/provider/settings',    label: t.mobileNav.account, icon: UserCircle2,   active: (p: string) => p.startsWith('/provider/settings') },
  ];

  // The admin console is a single route (/admin/dashboard) whose modules are
  // switched in-page, so there are only two admin destinations worth a tab.
  // Without this branch ADMIN fell through to CUSTOMER_TABS and was handed
  // links into /dashboard, /account and /browse.
  const ADMIN_TABS = [
    { href: '/admin/dashboard', label: t.nav.dashboard, icon: Inbox,         active: (p: string) => p.startsWith('/admin') },
    { href: '/messages',        label: t.nav.messages,  icon: MessageCircle, active: (p: string) => p.startsWith('/messages') },
  ];

  const tabs = !session
    ? GUEST_TABS
    : role === 'PROVIDER'
      ? PROVIDER_TABS
      : role === 'ADMIN'
        ? ADMIN_TABS
        : CUSTOMER_TABS;

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
                // prefetch={true} forces a full RSC + data prefetch for
                // dynamic routes (dashboard/messages/account). Without this
                // Next 15 only prefetches the shared layout, so the first
                // click still waits on Prisma. With it, data is warm in the
                // Router Cache by the time the user taps.
                prefetch={true}
                className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? 'text-brand' : 'text-ink-dim'
                }`}
              >
                {isActive && (
                  <span className="absolute inset-0 bg-brand-muted rounded-xl" />
                )}
                <Icon className={`relative w-5 h-5 ${isActive ? 'stroke-[2]' : 'stroke-[1.5]'}`} />
                <span className={`relative text-3xs font-semibold tracking-tight ${isActive ? 'text-brand' : 'text-ink-dim'}`}>
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
