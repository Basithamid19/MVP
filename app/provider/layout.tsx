'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, Inbox, Briefcase, DollarSign,
  BarChart2, Settings, LifeBuoy, LogOut, ShieldCheck,
} from 'lucide-react';

const NAV = [
  { href: '/provider/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/provider/leads',        label: 'Leads',        icon: Inbox },
  { href: '/provider/jobs',         label: 'Jobs',         icon: Briefcase },
  { href: '/provider/earnings',     label: 'Earnings',     icon: DollarSign },
  { href: '/provider/performance',  label: 'Performance',  icon: BarChart2 },
  { href: '/provider/settings',     label: 'Settings',     icon: Settings },
  { href: '/provider/disputes',     label: 'Support',      icon: LifeBuoy },
];

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show sidebar on onboarding
  if (pathname?.startsWith('/provider/onboarding')) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-16 lg:w-60 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen shrink-0">
        <div className="p-4 lg:p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-base tracking-tight hidden lg:block">VilniusPro</span>
          </Link>
        </div>

        <div className="px-2 lg:px-3 pt-4 pb-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:block px-2 mb-2">Pro Portal</p>
        </div>

        <nav className="flex-1 px-2 lg:px-3 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  active
                    ? 'bg-black text-white'
                    : 'text-gray-500 hover:text-black hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="hidden lg:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-2 lg:p-3 border-t border-gray-100 space-y-1">
          <Link
            href="/provider/onboarding"
            className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-all"
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span className="hidden lg:block">Verification</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="hidden lg:block">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
