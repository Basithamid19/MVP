'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2, User, Camera, Shield, ShieldCheck,
  Receipt, Download, ChevronRight,
  UserCircle2, Briefcase, Calendar,
  LifeBuoy, Mail, BarChart2, LogOut, AlertCircle,
} from 'lucide-react';

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
    <div className="flex items-center gap-3 px-4 py-3 active:bg-surface-alt/50 transition-colors">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${muted ? 'bg-surface-alt' : 'bg-brand-muted'}`}>
        <Icon className={`w-4 h-4 ${muted ? 'text-ink-dim' : 'text-brand'}`} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold ${muted ? 'text-ink-sub' : 'text-ink'}`}>{label}</p>
        {sub && <p className="text-[11px] text-ink-dim mt-0.5 leading-snug">{sub}</p>}
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-ink-dim/40 shrink-0" />
    </div>
  );

  if (href) return <Link href={href} className="block">{inner}</Link>;
  return <button onClick={onClick} className="w-full text-left">{inner}</button>;
}

/* ── Section wrapper ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4">
      <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-0.5">{title}</p>
      <div className="bg-white rounded-2xl border border-border-dim shadow-sm overflow-hidden divide-y divide-border-dim">
        {children}
      </div>
    </div>
  );
}

export default function ProviderSettingsPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showInvoices, setShowInvoices] = useState(false);
  const [verificationTier, setVerificationTier] = useState('TIER0_BASIC');
  const [completedJobs, setCompletedJobs] = useState(0);
  const [ratingAvg, setRatingAvg] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      setLoadError(false);
      Promise.all([
        fetch('/api/provider/profile', { cache: 'no-store' }).then(async r => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok) console.error('[settings hub] GET /api/provider/profile failed:', r.status, data);
          return data;
        }),
        fetch('/api/provider/bookings', { cache: 'no-store' }).then(r => r.json()).catch(() => []),
      ]).then(([profile, bookings]) => {
        const p = profile ?? {};
        setVerificationTier(p.verificationTier ?? 'TIER0_BASIC');
        setCompletedJobs(p.completedJobs ?? 0);
        setRatingAvg(p.ratingAvg ?? null);
        setReviewCount(p._count?.reviews ?? 0);
        if (Array.isArray(bookings)) setInvoices(bookings);
        setLoading(false);
      }).catch(() => { setLoading(false); setLoadError(true); });
    }
  }, [status, router, retryCount]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError(null);
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const size = 300;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setLocalAvatar(dataUrl);
        try {
          const res = await fetch('/api/user/avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl }),
          });
          if (!res.ok) {
            // Server rejected the upload — revert optimistic UI so the user
            // doesn't see a photo that isn't actually saved.
            const err = await res.json().catch(() => ({}));
            setLocalAvatar(null);
            setAvatarError(err.error || `Upload failed (${res.status}). Please try again.`);
            return;
          }
          const data = await res.json().catch(() => ({}));
          // Treat the server response as ground truth. Pass the persisted
          // image into updateSession so next-auth forces a fresh JWT with the
          // new value — the bare `update()` in this beta of next-auth isn't
          // reliable at refreshing token.image on its own.
          const persistedImage = typeof data?.image === 'string' ? data.image : dataUrl;
          setLocalAvatar(persistedImage);
          await updateSession({ user: { image: persistedImage } });
        } catch {
          setLocalAvatar(null);
          setAvatarError('Network error. Please check your connection and try again.');
        } finally {
          setAvatarUploading(false);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <p className="text-base font-semibold text-ink">Could not load your profile</p>
        <p className="text-sm text-ink-sub max-w-xs leading-relaxed">There was a problem fetching your data. Check your connection and try again.</p>
        <button
          onClick={() => { setLoading(true); setRetryCount(c => c + 1); }}
          className="px-6 py-2.5 bg-brand text-white rounded-full font-medium text-sm hover:bg-brand-dark transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user;
  const totalEarned = invoices.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);

  return (
    <div className="min-h-screen bg-canvas overflow-x-hidden w-full flex flex-col pb-28">

      {/* ── Top bar (mobile only — desktop has sidebar) ── */}
      <header className="bg-white border-b border-border-dim sticky top-0 z-20 w-full md:hidden">
        <div className="flex items-center px-4 h-14">
          <h1 className="text-base font-bold text-ink">Account</h1>
        </div>
      </header>

      {/* Avatar error surfaced above hero — keeps the upload failure visible
          since the optimistic localAvatar is reverted on error. */}
      {avatarError && (
        <div className="mx-4 mt-4 px-4 py-3 bg-caution-surface border border-caution-edge rounded-xl text-sm text-caution font-medium flex items-center justify-between gap-2">
          <span>{avatarError}</span>
          <button onClick={() => setAvatarError(null)} className="shrink-0 text-caution hover:opacity-70" aria-label="Dismiss">
            <span className="text-base leading-none">×</span>
          </button>
        </div>
      )}

      {/* ── Profile hero ── */}
      <div className="px-4 pt-5 pb-1">
        <div className="bg-brand rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
          <div className="relative z-10 flex items-center gap-3.5">
            <label className="relative w-14 h-14 shrink-0 cursor-pointer">
              <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
              <div className="w-14 h-14 rounded-xl bg-white/20 border-2 border-white/30 overflow-hidden flex items-center justify-center">
                {localAvatar || user?.image
                  ? <img src={localAvatar ?? user?.image ?? ''} alt={user?.name ?? ''} className="w-full h-full object-cover" />
                  : <User className="w-7 h-7 text-white/80" />
                }
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                {avatarUploading
                  ? <Loader2 className="w-3 h-3 text-brand animate-spin" />
                  : <Camera className="w-3 h-3 text-brand" />
                }
              </div>
            </label>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-white truncate leading-tight">{user?.name}</h2>
              <p className="text-xs text-white/50 truncate mt-0.5">{user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1.5 bg-white/12 px-2 py-0.5 rounded-full">
                {verificationTier === 'TIER0_BASIC' ? (
                  <>
                    <Shield className="w-3 h-3 text-white/70" />
                    <span className="text-[10px] font-semibold text-white/70">Not verified</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3 text-white/70" />
                    <span className="text-[10px] font-semibold text-white/70">
                      {verificationTier === 'TIER1_ID_VERIFIED' ? 'ID Verified'
                        : verificationTier === 'TIER2_TRADE_VERIFIED' ? 'Trade Verified'
                        : 'Enhanced'}
                    </span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-3 mt-3.5 pt-3 border-t border-white/10">
            {[
              { value: completedJobs, label: 'Jobs done' },
              { value: ratingAvg != null ? ratingAvg.toFixed(1) : '—', label: 'Rating' },
              { value: reviewCount, label: 'Reviews' },
            ].map((stat, i) => (
              <div key={stat.label} className={`text-center ${i > 0 ? 'border-l border-white/10' : ''}`}>
                <p className="text-base font-bold text-white leading-tight">{stat.value}</p>
                <p className="text-[9px] font-semibold text-white/45 uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="flex flex-col gap-6 pt-4">

        {/* Setup */}
        <Section title="Setup">
          <SettingsRow icon={UserCircle2} label="Profile" sub="Bio, coverage area, languages" href="/provider/settings/profile" />
          <SettingsRow icon={Briefcase} label="Services" sub="Offerings, pricing, instant book" href="/provider/settings/services" />
          <SettingsRow icon={Calendar} label="Availability" sub="Working hours, days off" href="/provider/settings/availability" />
        </Section>

        {/* Activity */}
        <Section title="Activity">
          <div>
            <button
              onClick={() => setShowInvoices(v => !v)}
              className="w-full flex items-center gap-3 px-4 py-3 active:bg-surface-alt/50 transition-colors"
            >
              <div className="w-8 h-8 bg-brand-muted rounded-lg flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4 text-brand" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-semibold text-ink">Invoices</p>
                <p className="text-[11px] text-ink-dim mt-0.5">
                  {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} · €{totalEarned.toFixed(2)}
                </p>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-ink-dim/40 shrink-0 transition-transform duration-200 ${showInvoices ? 'rotate-90' : ''}`} />
            </button>

            {showInvoices && (
              <div className="border-t border-border-dim bg-surface-alt/50">
                {invoices.length === 0 ? (
                  <p className="px-5 py-4 text-xs text-ink-dim text-center">No invoices yet.</p>
                ) : (
                  <div className="p-3 space-y-2">
                    {invoices.map(b => {
                      const invoiceNo = `VP-${b.id.slice(0, 8).toUpperCase()}`;
                      const date = new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                      return (
                        <div key={b.id} className="bg-white rounded-xl p-3.5 shadow-sm border border-border-dim">
                          {/* Top: service + amount */}
                          <div className="flex items-start justify-between gap-2 mb-2.5">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-ink truncate">{b.quote?.request?.category?.name ?? 'Service'}</p>
                              <p className="text-[10px] text-ink-dim mt-0.5">{date} · <span className="font-mono">{invoiceNo}</span></p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-lg font-bold text-ink leading-tight">€{Number(b.totalAmount).toFixed(2)}</p>
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                                b.payment?.status === 'PAID' ? 'bg-trust-surface text-trust'
                                : b.payment?.status === 'REFUNDED' ? 'bg-surface-alt text-ink-sub'
                                : b.payment?.status === 'PROCESSING' || b.status === 'COMPLETED' ? 'bg-info-surface text-info'
                                : 'bg-surface-alt text-ink-sub'
                              }`}>{
                                b.payment?.status === 'PAID' ? 'Paid'
                                : b.payment?.status === 'REFUNDED' ? 'Refunded'
                                : b.payment?.status === 'PROCESSING' || b.status === 'COMPLETED' ? 'Processing'
                                : 'Pending'
                              }</span>
                            </div>
                          </div>
                          {/* Details */}
                          <div className="bg-surface-alt rounded-lg p-2.5 text-[11px] space-y-1 mb-2.5">
                            <div className="flex justify-between text-ink-sub">
                              <span>Customer</span>
                              <span className="font-medium text-ink truncate ml-2">{b.customer?.user?.name ?? 'Customer'}</span>
                            </div>
                            <div className="flex justify-between text-ink-sub">
                              <span>Service</span>
                              <span>€{Number(b.totalAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-medium text-ink pt-1 border-t border-border-dim">
                              <span>Total earned</span>
                              <span>€{Number(b.totalAmount).toFixed(2)}</span>
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex gap-2">
                            <Link
                              href={`/provider/jobs/${b.id}`}
                              className="flex-1 text-center py-2 border border-border-dim rounded-lg text-[11px] font-semibold text-ink hover:bg-surface-alt transition-colors"
                            >
                              View booking
                            </Link>
                            <button
                              onClick={() => {
                                const rows = [
                                  ['Invoice', invoiceNo],
                                  ['Date', date],
                                  ['Service', b.quote?.request?.category?.name ?? 'Service'],
                                  ['Customer', b.customer?.user?.name ?? ''],
                                  ['Total', `€${Number(b.totalAmount).toFixed(2)}`],
                                ];
                                const csv = rows.map(r => r.join(',')).join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url; a.download = `${invoiceNo}.csv`; a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="flex items-center gap-1 px-3 py-2 bg-brand text-white rounded-lg text-[11px] font-semibold"
                            >
                              <Download className="w-3 h-3" /> CSV
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
        </Section>

        {/* Support */}
        <Section title="Support">
          <SettingsRow icon={AlertCircle} label="Report an issue" sub="Disputes, refunds, no-shows" href="/provider/disputes" />
          <SettingsRow icon={LifeBuoy} label="Help Centre" sub="FAQs and how-to guides" href="/provider/disputes" />
          <SettingsRow icon={Mail} label="Email us" sub="support@aladdin.lt" href="mailto:support@aladdin.lt" muted />
        </Section>

        {/* Account */}
        <Section title="Account">
          <SettingsRow icon={ShieldCheck} label="Verification" sub="ID, trade certificates, insurance" href="/provider/verification" />
          <SettingsRow icon={BarChart2} label="Earnings" sub="Payouts & revenue history" href="/provider/earnings" />
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-4 py-3 active:bg-surface-alt/50 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-surface-alt rounded-lg flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4 text-ink-dim" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-danger">Log out</p>
            </div>
          </button>
        </Section>

      </div>
    </div>
  );
}
