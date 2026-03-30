'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, Gift, Share2, FileText, LogOut,
  ChevronRight, User, Receipt, Download, Star,
  Mail, MessageCircle, HelpCircle, LifeBuoy,
  MapPin, Heart, Clock, Bell, ShieldCheck, Camera,
  Search,
} from 'lucide-react';
import MobileNav from '@/components/MobileNav';

/* ── Reusable row ── */
function SettingsRow({
  icon: Icon,
  label,
  sub,
  href,
  onClick,
  muted,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  href?: string;
  onClick?: () => void;
  muted?: boolean;
}) {
  const inner = (
    <div className="flex items-center gap-3.5 px-4 py-4 active:bg-surface-alt/60 transition-colors">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${muted ? 'bg-surface-alt' : 'bg-brand-muted'}`}>
        <Icon className={`w-[18px] h-[18px] ${muted ? 'text-ink-dim' : 'text-brand'}`} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${muted ? 'text-ink-sub' : 'text-ink'}`}>{label}</p>
        {sub && <p className="text-[12px] text-ink-dim mt-0.5 leading-snug">{sub}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-ink-dim/40 shrink-0" />
    </div>
  );

  if (href) return <Link href={href} className="block">{inner}</Link>;
  return <button onClick={onClick} className="w-full text-left">{inner}</button>;
}

/* ── Section wrapper ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4">
      <p className="text-[11px] font-bold text-ink-dim uppercase tracking-widest mb-2.5 px-1">{title}</p>
      <div className="bg-white rounded-2xl border border-border-dim shadow-sm overflow-hidden divide-y divide-border-dim">
        {children}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvoices, setShowInvoices] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const size = 300;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setLocalAvatar(dataUrl);
        fetch('/api/user/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl }),
        }).then(() => updateSession()).finally(() => setAvatarUploading(false));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const totalSpent = completedBookings.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);
  const reviewsGiven = completedBookings.filter(b => b.review).length;
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}?ref=${(user as any)?.id?.slice(0, 8)}`
    : '';

  return (
    <div className="min-h-screen bg-canvas overflow-x-hidden w-full flex flex-col pb-28">

      {/* ── Top bar ── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-border-dim sticky top-0 z-20 w-full">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-base font-bold text-ink tracking-tight">Account</h1>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-ink-dim">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Profile hero ── */}
      <div className="px-4 pt-5 pb-1">
        <div className="bg-brand rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 50%)'
          }} />
          <div className="relative z-10 flex items-center gap-4">
            <label className="relative w-16 h-16 shrink-0 cursor-pointer">
              <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
              <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 overflow-hidden flex items-center justify-center">
                {localAvatar || user?.image
                  ? <img src={localAvatar ?? user?.image ?? ''} alt={user?.name ?? ''} className="w-full h-full object-cover" />
                  : <User className="w-8 h-8 text-white/70" />
                }
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border border-border-dim">
                {avatarUploading
                  ? <Loader2 className="w-3.5 h-3.5 text-brand animate-spin" />
                  : <Camera className="w-3.5 h-3.5 text-brand" />
                }
              </div>
            </label>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white truncate leading-tight">{user?.name}</h2>
              <p className="text-[13px] text-white/60 truncate mt-0.5">{user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 bg-white/12 rounded-full">
                <ShieldCheck className="w-3 h-3 text-white/70" />
                <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
                  {(user as any)?.role?.toLowerCase() ?? 'customer'}
                </span>
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="relative z-10 flex gap-px mt-5 bg-white/10 rounded-2xl overflow-hidden">
            {[
              { value: bookings.length, label: 'Bookings' },
              { value: `€${totalSpent.toFixed(0)}`, label: 'Spent' },
              { value: reviewsGiven, label: 'Reviews' },
            ].map((stat, i) => (
              <div key={stat.label} className="flex-1 py-3 text-center">
                <p className="text-lg font-bold text-white leading-none">{stat.value}</p>
                <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="flex flex-col gap-6 pt-5">

        {/* Account Activity */}
        <Section title="Activity">
          {/* Invoices — expandable */}
          <div>
            <button
              onClick={() => setShowInvoices(v => !v)}
              className="w-full flex items-center gap-3.5 px-4 py-4 active:bg-surface-alt/60 transition-colors"
            >
              <div className="w-9 h-9 bg-brand-muted rounded-xl flex items-center justify-center shrink-0">
                <Receipt className="w-[18px] h-[18px] text-brand" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-ink">Invoices</p>
                <p className="text-[12px] text-ink-dim mt-0.5">{completedBookings.length} invoice{completedBookings.length !== 1 ? 's' : ''} · €{totalSpent.toFixed(2)}</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-ink-dim/40 shrink-0 transition-transform duration-200 ${showInvoices ? 'rotate-90' : ''}`} />
            </button>

            {showInvoices && (
              <div className="border-t border-border-dim bg-surface-alt/50">
                {completedBookings.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-ink-dim text-center">No invoices yet.</p>
                ) : (
                  <div className="p-3 space-y-2.5">
                    {completedBookings.map(b => {
                      const invoiceNo = `VP-${b.id.slice(0, 8).toUpperCase()}`;
                      const date = new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                      const serviceFee = (b.totalAmount * 0.88).toFixed(2);
                      const platformFee = (b.totalAmount * 0.12).toFixed(2);
                      return (
                        <div key={b.id} className="bg-white rounded-2xl p-4 border border-border-dim">
                          {/* Top row: service + amount */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-ink">{b.quote?.request?.category?.name ?? 'Service'}</p>
                              <p className="text-[11px] text-ink-dim mt-1 flex items-center gap-2">
                                <span className="font-mono">#{invoiceNo}</span>
                                <span className="text-ink-dim/30">·</span>
                                <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {date}</span>
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-lg font-bold text-ink">€{b.totalAmount?.toFixed(2)}</p>
                              <span className="text-[10px] font-bold uppercase bg-trust-surface text-trust px-2 py-0.5 rounded-full">Paid</span>
                            </div>
                          </div>
                          {/* Fee breakdown */}
                          <div className="bg-canvas rounded-xl px-3.5 py-3 text-xs space-y-1.5 mb-3">
                            <div className="flex justify-between text-ink-dim"><span>Provider</span><span className="font-medium text-ink-sub">{b.provider?.user?.name}</span></div>
                            <div className="flex justify-between text-ink-dim"><span>Service fee</span><span>€{serviceFee}</span></div>
                            <div className="flex justify-between text-ink-dim"><span>Platform fee (12%)</span><span>€{platformFee}</span></div>
                            <div className="flex justify-between font-semibold pt-2 border-t border-border-dim text-ink"><span>Total</span><span>€{b.totalAmount?.toFixed(2)}</span></div>
                          </div>
                          {/* Actions */}
                          <div className="flex gap-2">
                            <Link href={`/bookings/${b.id}`} className="flex-1 text-center py-2.5 bg-surface-alt rounded-xl text-xs font-semibold text-ink-sub active:bg-border transition-colors">View booking</Link>
                            <button
                              onClick={() => {
                                const rows = [['Invoice', invoiceNo], ['Date', date], ['Service', b.quote?.request?.category?.name ?? 'Service'], ['Pro', b.provider?.user?.name ?? ''], ['Service fee', `€${serviceFee}`], ['Platform fee', `€${platformFee}`], ['Total', `€${b.totalAmount?.toFixed(2)}`]];
                                const csv = rows.map(r => r.join(',')).join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a'); a.href = url; a.download = `${invoiceNo}.csv`; a.click(); URL.revokeObjectURL(url);
                              }}
                              className="flex items-center gap-1.5 px-4 py-2.5 bg-brand text-white rounded-xl text-xs font-semibold"
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
              className="w-full flex items-center gap-3.5 px-4 py-4 active:bg-surface-alt/60 transition-colors"
            >
              <div className="w-9 h-9 bg-brand-muted rounded-xl flex items-center justify-center shrink-0">
                <Gift className="w-[18px] h-[18px] text-brand" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-ink">Credits & Referrals</p>
                <p className="text-[12px] text-ink-dim mt-0.5">€0.00 balance · Earn by referring</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-ink-dim/40 shrink-0 transition-transform duration-200 ${showCredits ? 'rotate-90' : ''}`} />
            </button>

            {showCredits && (
              <div className="border-t border-border-dim bg-surface-alt/50 p-3 space-y-2.5">
                <div className="bg-brand rounded-2xl p-4 text-white">
                  <p className="text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">Credit Balance</p>
                  <p className="text-2xl font-bold leading-none">€0.00</p>
                  <p className="text-xs text-white/60 mt-2 leading-relaxed">Earn €10 for every friend who completes their first booking.</p>
                </div>
                {referralLink && (
                  <div className="bg-white rounded-xl border border-border-dim p-3">
                    <p className="text-[10px] font-semibold text-ink-dim uppercase tracking-wider mb-2">Your referral link</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-sub flex-1 truncate font-mono bg-canvas rounded-lg px-3 py-2 border border-border-dim">{referralLink}</span>
                      <button onClick={() => navigator.clipboard?.writeText(referralLink)} className="shrink-0 px-3.5 py-2 bg-brand text-white rounded-lg text-xs font-semibold">Copy</button>
                    </div>
                  </div>
                )}
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-border-dim rounded-xl text-sm font-semibold text-ink active:bg-surface-alt transition-colors">
                  <Share2 className="w-4 h-4 text-ink-sub" /> Share with friends
                </button>
              </div>
            )}
          </div>
        </Section>

        {/* Personal */}
        <Section title="Personal">
          <SettingsRow icon={MapPin} label="Saved Addresses" sub="Manage your home & work" href="/account" />
          <SettingsRow icon={Heart} label="Favourite Pros" sub="Bookmarked professionals" href="/browse" />
        </Section>

        {/* Quick action — New Service Request (demoted) */}
        <div className="px-4">
          <Link
            href="/requests/new"
            className="flex items-center gap-3.5 bg-white border border-border-dim rounded-2xl px-4 py-3.5 active:bg-surface-alt transition-colors shadow-sm"
          >
            <div className="w-9 h-9 bg-surface-alt rounded-xl flex items-center justify-center shrink-0">
              <Search className="w-[18px] h-[18px] text-ink-sub" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">New Service Request</p>
              <p className="text-[12px] text-ink-dim mt-0.5">Post a job and get quotes</p>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-dim/40 shrink-0" />
          </Link>
        </div>

        {/* Support */}
        <Section title="Support">
          <SettingsRow icon={MessageCircle} label="Chat with us" sub="Avg. reply under 1 hour" href="mailto:support@dispatch.com" />
          <SettingsRow icon={HelpCircle} label="Help Centre" sub="FAQs and how-to guides" href="/account" />
          <SettingsRow icon={LifeBuoy} label="Dispute a booking" sub="Report an issue with a job" href="/bookings" />
          <SettingsRow icon={Mail} label="Email us" sub="support@dispatch.com" href="mailto:support@dispatch.com" muted />
        </Section>

        {/* Sign out */}
        <div className="px-4 pb-4">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-border-dim rounded-2xl text-sm font-medium text-ink-sub active:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 text-ink-dim" /> Log Out
          </button>
        </div>

      </div>

      <MobileNav />
    </div>
  );
}
