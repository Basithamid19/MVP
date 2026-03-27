'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, Gift, Share2, FileText, LogOut,
  ChevronRight, User, Receipt, Download, Star,
  Mail, MessageCircle, HelpCircle, LifeBuoy,
  MapPin, Heart, Clock, Bell, ShieldCheck,
} from 'lucide-react';
import MobileNav from '@/components/MobileNav';

/* ── Reusable row ── */
function SettingsRow({
  icon: Icon,
  iconBg,
  label,
  sub,
  href,
  onClick,
  danger,
}: {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  sub?: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const inner = (
    <div className="flex items-center gap-3.5 px-4 py-3.5 active:bg-surface-alt transition-colors">
      <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${danger ? 'text-red-500' : 'text-ink'}`}>{label}</p>
        {sub && <p className="text-xs text-ink-dim mt-0.5">{sub}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-ink-dim/50 shrink-0" />
    </div>
  );

  if (href) return <Link href={href} className="block">{inner}</Link>;
  return <button onClick={onClick} className="w-full text-left">{inner}</button>;
}

/* ── Section wrapper ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4">
      <p className="text-[11px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-1">{title}</p>
      <div className="bg-white rounded-2xl border border-border-dim shadow-sm overflow-hidden divide-y divide-border-dim">
        {children}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvoices, setShowInvoices] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      fetch('/api/bookings')
        .then(r => r.json())
        .then(d => { setBookings(Array.isArray(d) ? d : []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!session) return null;

  const user = session.user;
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const totalSpent = completedBookings.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);
  const reviewsGiven = completedBookings.filter(b => b.review).length;
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}?ref=${(user as any)?.id?.slice(0, 8)}`
    : '';

  return (
    <div className="min-h-screen bg-canvas overflow-x-hidden w-full flex flex-col pb-28">

      {/* ── Top bar ── */}
      <header className="bg-white border-b border-border-dim sticky top-0 z-20 w-full">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-base font-bold text-ink">Account</h1>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-ink-dim">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Profile hero ── */}
      <div className="px-4 pt-5 pb-2">
        <div className="bg-brand rounded-3xl p-5 relative overflow-hidden">
          {/* subtle texture */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)'
          }} />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 overflow-hidden shrink-0 flex items-center justify-center">
              {user?.image
                ? <img src={user.image} alt={user.name ?? ''} className="w-full h-full object-cover" />
                : <User className="w-8 h-8 text-white/80" />
              }
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white truncate">{user?.name}</h2>
              <p className="text-sm text-white/70 truncate">{user?.email}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-white/80" />
                <span className="text-xs font-semibold text-white/80 capitalize">
                  {(user as any)?.role?.toLowerCase() ?? 'customer'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-3 gap-2 mt-4">
            {[
              { value: bookings.length, label: 'Bookings' },
              { value: `€${totalSpent.toFixed(0)}`, label: 'Spent' },
              { value: reviewsGiven, label: 'Reviews' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/15 rounded-xl py-2.5 text-center">
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="flex flex-col gap-5 pt-3">

        {/* Activity */}
        <Section title="Activity">
          {/* Invoices — expandable */}
          <div>
            <button
              onClick={() => setShowInvoices(v => !v)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-surface-alt transition-colors"
            >
              <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center shrink-0">
                <Receipt className="w-[18px] h-[18px] text-white" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-ink">Invoices</p>
                <p className="text-xs text-ink-dim mt-0.5">{completedBookings.length} invoice{completedBookings.length !== 1 ? 's' : ''} · €{totalSpent.toFixed(2)} total</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-ink-dim/50 shrink-0 transition-transform duration-200 ${showInvoices ? 'rotate-90' : ''}`} />
            </button>

            {showInvoices && (
              <div className="border-t border-border-dim bg-surface-alt">
                {completedBookings.length === 0 ? (
                  <p className="px-5 py-5 text-sm text-ink-dim text-center">No invoices yet.</p>
                ) : (
                  <div className="p-3 space-y-3">
                    {completedBookings.map(b => {
                      const invoiceNo = `VP-${b.id.slice(0, 8).toUpperCase()}`;
                      const date = new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                      const serviceFee = (b.totalAmount * 0.88).toFixed(2);
                      const platformFee = (b.totalAmount * 0.12).toFixed(2);
                      return (
                        <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="font-bold text-sm text-ink">{b.quote?.request?.category?.name ?? 'Service'}</p>
                              <p className="text-xs text-ink-dim mt-0.5 font-mono">#{invoiceNo}</p>
                              <p className="text-xs text-ink-dim flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" /> {date}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-ink">€{b.totalAmount?.toFixed(2)}</p>
                              <span className="text-[10px] font-bold uppercase bg-trust-surface text-trust px-2 py-0.5 rounded-full">Paid</span>
                            </div>
                          </div>
                          <div className="bg-surface-alt rounded-xl p-3 text-xs space-y-1.5 mb-3">
                            <div className="flex justify-between text-ink-sub"><span>Provider</span><span className="font-medium text-ink">{b.provider?.user?.name}</span></div>
                            <div className="flex justify-between text-ink-sub"><span>Service fee</span><span>€{serviceFee}</span></div>
                            <div className="flex justify-between text-ink-sub"><span>Platform fee (12%)</span><span>€{platformFee}</span></div>
                            <div className="flex justify-between font-bold pt-1.5 border-t border-border-dim text-ink"><span>Total</span><span>€{b.totalAmount?.toFixed(2)}</span></div>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/bookings/${b.id}`} className="flex-1 text-center py-2.5 border border-border-dim rounded-xl text-xs font-bold text-ink">View booking</Link>
                            <button
                              onClick={() => {
                                const rows = [['Invoice', invoiceNo], ['Date', date], ['Service', b.quote?.request?.category?.name ?? 'Service'], ['Pro', b.provider?.user?.name ?? ''], ['Service fee', `€${serviceFee}`], ['Platform fee', `€${platformFee}`], ['Total', `€${b.totalAmount?.toFixed(2)}`]];
                                const csv = rows.map(r => r.join(',')).join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a'); a.href = url; a.download = `${invoiceNo}.csv`; a.click(); URL.revokeObjectURL(url);
                              }}
                              className="flex items-center gap-1.5 px-4 py-2.5 bg-brand text-white rounded-xl text-xs font-bold"
                            >
                              <Download className="w-3.5 h-3.5" /> CSV
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Credits — expandable */}
          <div>
            <button
              onClick={() => setShowCredits(v => !v)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-surface-alt transition-colors"
            >
              <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                <Gift className="w-[18px] h-[18px] text-white" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-ink">Credits & Referrals</p>
                <p className="text-xs text-ink-dim mt-0.5">€0.00 available · Earn by referring friends</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-ink-dim/50 shrink-0 transition-transform duration-200 ${showCredits ? 'rotate-90' : ''}`} />
            </button>

            {showCredits && (
              <div className="border-t border-border-dim bg-surface-alt p-3 space-y-3">
                <div className="bg-brand rounded-2xl p-4 text-white">
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Your Credit Balance</p>
                  <p className="text-3xl font-bold mb-1">€0.00</p>
                  <p className="text-xs text-white/70">Earn €10 for every friend who completes their first booking.</p>
                </div>
                {referralLink && (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-border-dim">
                    <span className="text-xs text-ink-sub flex-1 truncate font-mono">{referralLink}</span>
                    <button onClick={() => navigator.clipboard?.writeText(referralLink)} className="shrink-0 px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-bold">Copy</button>
                  </div>
                )}
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-border-dim rounded-xl text-sm font-bold text-ink active:bg-surface-alt transition-colors">
                  <Share2 className="w-4 h-4" /> Share with friends
                </button>
              </div>
            )}
          </div>
        </Section>

        {/* Settings */}
        <Section title="Settings">
          <SettingsRow icon={MapPin}   iconBg="bg-blue-500"   label="Saved Addresses"     sub="Manage your home & work"   href="/account" />
          <SettingsRow icon={Heart}    iconBg="bg-red-500"    label="Favourite Pros"       sub="Bookmarked professionals"  href="/browse" />
          <SettingsRow icon={FileText} iconBg="bg-purple-500" label="New Service Request"  sub="Post a job and get quotes" href="/requests/new" />
        </Section>

        {/* Support */}
        <Section title="Support">
          <SettingsRow icon={MessageCircle} iconBg="bg-teal-500"   label="Chat with us"     sub="Avg. reply under 1 hour"    href="mailto:support@dispatch.com" />
          <SettingsRow icon={Mail}          iconBg="bg-brand"      label="Email us"          sub="support@dispatch.com"       href="mailto:support@dispatch.com" />
          <SettingsRow icon={HelpCircle}    iconBg="bg-indigo-500" label="Help Centre"       sub="FAQs and how-to guides"     href="/account" />
          <SettingsRow icon={LifeBuoy}      iconBg="bg-orange-500" label="Dispute a booking" sub="Report an issue with a job" href="/bookings" />
        </Section>

        {/* Sign out */}
        <div className="px-4 pb-4">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-border-dim rounded-2xl text-sm font-semibold text-red-500 active:bg-red-50 transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>

      </div>

      <MobileNav />
    </div>
  );
}
