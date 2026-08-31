'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, Gift, LogOut,
  ChevronRight, User, Receipt, Download,
  Mail, MessageCircle, HelpCircle, LifeBuoy,
  Search, ShieldCheck, Camera, Plus,
} from 'lucide-react';
import CustomerLayout from '@/components/CustomerLayout';
import { Section, SettingsRow, HeroCard } from '@/components/settings';
import { Button, StatusBadge, statusVariant, useToast } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { fetchJsonOr } from '@/lib/fetch-retry';

/* Anchor ids for the desktop rail — also the scroll-spy observation set. */
const SECTION_IDS = ['profile', 'activity', 'services', 'support', 'account'] as const;

export default function AccountPage({
  initialBookings = [],
}: { initialBookings?: any[] } = {}) {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const t = useTranslation();
  const { toast } = useToast();
  const hasInitial = initialBookings.length > 0;
  const [bookings, setBookings] = useState<any[]>(initialBookings);
  const [loading, setLoading] = useState(!hasInitial);
  const [showInvoices, setShowInvoices] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>(SECTION_IDS[0]);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (hasInitial) { setLoading(false); return; }
    if (status === 'authenticated') {
      // Retried on cold-start / 5xx — this list feeds the invoices/credits
      // sections, which read as "nothing here" when the fetch drops.
      fetchJsonOr<any[]>('/api/bookings', [])
        .then(d => { setBookings(Array.isArray(d) ? d : []); setLoading(false); });
    }
  }, [status, router, hasInitial]);

  /* Scroll-spy for the desktop anchor rail. The top inset clears the 64px
   * sticky header (+ the sections' scroll-mt-24); the bottom inset keeps the
   * "current" section pinned to whatever owns the upper part of the viewport
   * instead of flickering between every section that happens to be visible. */
  useEffect(() => {
    if (loading || typeof IntersectionObserver === 'undefined') return;
    const els = SECTION_IDS
      .map(id => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        });
        const first = SECTION_IDS.find(id => visible.has(id));
        if (first) setActiveSection(first);
      },
      { rootMargin: '-96px 0px -55% 0px', threshold: 0 },
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, status]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <CustomerLayout maxWidth="max-w-4xl">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      </CustomerLayout>
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
        })
          .then(res => {
            // Server rejected the upload — drop the optimistic preview so the
            // user isn't left looking at a photo that was never saved.
            if (!res.ok) throw new Error(String(res.status));
            return updateSession();
          })
          .catch(() => {
            setLocalAvatar(null);
            toast.error(t.accountPage.uploadFailed);
          })
          .finally(() => setAvatarUploading(false));
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

  const role = (user as any)?.role;
  const roleLabel =
    role === 'PROVIDER' ? t.accountPage.roleProvider
    : role === 'ADMIN'  ? t.accountPage.roleAdmin
    : t.accountPage.roleCustomer;

  const navItems = [
    { id: 'profile',  label: t.accountPage.navProfile  },
    { id: 'activity', label: t.accountPage.navActivity },
    { id: 'services', label: t.accountPage.navServices },
    { id: 'support',  label: t.accountPage.navSupport  },
    { id: 'account',  label: t.accountPage.navAccount  },
  ];

  /* Same tri-state the invoice list has always shown, expressed once. */
  const invoicePaymentStatus = (b: any): string =>
    b.payment?.status === 'PAID' ? 'PAID'
    : b.payment?.status === 'REFUNDED' ? 'REFUNDED'
    : b.payment?.status === 'PROCESSING' || b.status === 'COMPLETED' ? 'PROCESSING'
    : 'PENDING';

  const invoiceStatusLabel = (s: string): string =>
    s === 'PAID' ? t.accountPage.statusPaid
    : s === 'REFUNDED' ? t.accountPage.statusRefunded
    : s === 'PROCESSING' ? t.accountPage.statusProcessing
    : t.accountPage.statusPending;

  return (
    <CustomerLayout maxWidth="max-w-4xl">

      {/* ── Desktop shell: section rail + content pane ── */}
      <div className="lg:flex lg:gap-10">

        {/* Section rail — desktop only, scroll-spied */}
        <aside className="hidden lg:block w-48 shrink-0">
          <nav aria-label={t.accountPage.sectionsNav} className="sticky top-24 space-y-1">
            {navItems.map(s => {
              const active = activeSection === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  aria-current={active ? 'location' : undefined}
                  className={cn(
                    'block px-3 py-2 rounded-input text-sm font-medium border transition-all',
                    active
                      ? 'bg-card shadow-card border-border-dim text-brand'
                      : 'border-transparent text-ink-sub hover:bg-card/60 hover:text-ink'
                  )}
                >
                  {s.label}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Content pane */}
        <div className="flex-1 min-w-0">

          {/* ── Identity hero — this is the page title ── */}
          <div id="profile" className="scroll-mt-24">
            <HeroCard className="p-6 sm:p-8">
              <div className="relative z-10 flex items-center gap-4">
                <label className="relative w-16 h-16 shrink-0 cursor-pointer" title={t.accountPage.changePhoto}>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label={t.accountPage.changePhoto}
                    onChange={handleAvatarChange}
                  />
                  <div className="w-16 h-16 rounded-input bg-white/20 border-2 border-white/30 overflow-hidden flex items-center justify-center">
                    {localAvatar || user?.image
                      ? <img src={localAvatar ?? user?.image ?? ''} alt={user?.name ?? ''} className="w-full h-full object-cover" />
                      : <User className="w-8 h-8 text-white/80" />
                    }
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-card rounded-full flex items-center justify-center shadow-card">
                    {avatarUploading
                      ? <Loader2 className="w-3 h-3 text-brand animate-spin" />
                      : <Camera className="w-3 h-3 text-brand" />
                    }
                  </div>
                </label>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-white truncate leading-tight">{user?.name}</h1>
                  <p className="text-xs text-white/50 truncate mt-0.5">{user?.email}</p>
                  <span className="inline-flex items-center gap-1 mt-2 bg-white/12 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-white/70" />
                    <span className="text-3xs font-semibold text-white/70">{roleLabel}</span>
                  </span>
                </div>
              </div>

              {/* Stats — one tree at every width */}
              <div className="relative z-10 grid grid-cols-3 divide-x divide-white/15 mt-5 pt-4 border-t border-white/10">
                {[
                  { value: bookings.length,              label: t.accountPage.statBookings },
                  { value: `€${totalSpent.toFixed(0)}`,  label: t.accountPage.statSpent    },
                  { value: reviewsGiven,                 label: t.accountPage.statReviews  },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <p className="text-base font-bold text-white leading-tight">{stat.value}</p>
                    <p className="text-3xs font-semibold text-white/45 uppercase tracking-wider mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </HeroCard>
          </div>

          {/* ── Sections ── */}
          <div className="pt-6 pb-4 flex flex-col gap-6">

            {/* Activity */}
            <Section title={t.accountPage.navActivity} id="activity">

              {/* Invoices — expands to a flat list inside this same card */}
              <div>
                <SettingsRow
                  icon={Receipt}
                  label={t.accountPage.invoices}
                  sub={`${completedBookings.length} ${completedBookings.length !== 1 ? t.accountPage.invoicesPlural : t.accountPage.invoiceSingular} · €${totalSpent.toFixed(2)}`}
                  onClick={() => setShowInvoices(v => !v)}
                  trailing={
                    <ChevronRight
                      className={cn(
                        'w-3.5 h-3.5 text-ink-dim/40 shrink-0 transition-transform duration-200',
                        showInvoices && 'rotate-90'
                      )}
                    />
                  }
                />

                {showInvoices && (
                  <div className="border-t border-border-dim divide-y divide-border-dim bg-surface-alt/40">
                    {completedBookings.length === 0 ? (
                      <p className="px-4 py-4 text-xs text-ink-dim text-center">{t.accountPage.invoicesEmpty}</p>
                    ) : (
                      completedBookings.map(b => {
                        const invoiceNo = `AL-${b.id.slice(0, 8).toUpperCase()}`;
                        const date = new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                        const payStatus = invoicePaymentStatus(b);
                        return (
                          <div key={b.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/bookings/${b.id}`}
                                className="block text-sm font-semibold text-ink truncate hover:text-brand transition-colors"
                              >
                                {b.quote?.request?.category?.name ?? t.accountPage.invoiceServiceFallback}
                              </Link>
                              <p className="text-3xs text-ink-dim mt-0.5">
                                <span className="font-mono">{invoiceNo}</span> · {date}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-ink leading-tight">€{b.totalAmount?.toFixed(2)}</p>
                              <StatusBadge
                                className="mt-1"
                                variant={statusVariant('payment', payStatus)}
                                label={invoiceStatusLabel(payStatus)}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="xs"
                              aria-label={t.accountPage.invoiceDownload}
                              onClick={() => {
                                const rows = [['Invoice', invoiceNo], ['Date', date], ['Service', b.quote?.request?.category?.name ?? 'Service'], ['Pro', b.provider?.user?.name ?? ''], ['Total', `€${b.totalAmount?.toFixed(2)}`]];
                                const csv = rows.map(r => r.join(',')).join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a'); a.href = url; a.download = `${invoiceNo}.csv`; a.click(); URL.revokeObjectURL(url);
                              }}
                            >
                              <Download className="w-3.5 h-3.5" />
                              CSV
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Credits — expands to a quiet balance row */}
              <div>
                <SettingsRow
                  icon={Gift}
                  label={t.accountPage.credits}
                  sub={`€0.00 ${t.accountPage.creditsAvailable}`}
                  onClick={() => setShowCredits(v => !v)}
                  trailing={
                    <ChevronRight
                      className={cn(
                        'w-3.5 h-3.5 text-ink-dim/40 shrink-0 transition-transform duration-200',
                        showCredits && 'rotate-90'
                      )}
                    />
                  }
                />

                {showCredits && (
                  <div className="border-t border-border-dim bg-surface-alt/40 px-4 py-4 space-y-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-xs font-semibold text-ink-sub">{t.accountPage.creditBalance}</p>
                      <p className="text-lg font-bold text-brand leading-none">€0.00</p>
                    </div>
                    <p className="text-2xs text-ink-dim leading-relaxed">{t.accountPage.creditsHint}</p>
                    {referralLink && (
                      <div className="flex items-center gap-2">
                        <span className="text-2xs text-ink-sub flex-1 truncate font-mono">{referralLink}</span>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            navigator.clipboard?.writeText(referralLink);
                            toast.success(t.accountPage.copied);
                          }}
                        >
                          {t.accountPage.copy}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Section>

            {/* Services */}
            <Section title={t.accountPage.navServices} id="services">
              <SettingsRow icon={Plus}    label={t.accountPage.newRequest} sub={t.accountPage.newRequestSub} href="/requests/new" />
              <SettingsRow icon={Search}  label={t.accountPage.findPros}   sub={t.accountPage.findProsSub}   href="/browse" />
            </Section>

            {/* Support */}
            <Section title={t.accountPage.navSupport} id="support">
              <SettingsRow icon={MessageCircle} label={t.accountPage.chatWithUs}     sub={t.accountPage.chatWithUsSub}     href="mailto:aladdin@gmail.com" />
              <SettingsRow icon={HelpCircle}    label={t.accountPage.helpCentre}     sub={t.accountPage.helpCentreSub}     href="/support" />
              <SettingsRow icon={LifeBuoy}      label={t.accountPage.disputeBooking} sub={t.accountPage.disputeBookingSub} href="/bookings" />
              <SettingsRow icon={Mail}          label={t.accountPage.emailUs}        sub="aladdin@gmail.com"               href="mailto:aladdin@gmail.com" muted />
            </Section>

            {/* Account */}
            <Section title={t.accountPage.navAccount} id="account">
              <SettingsRow
                icon={LogOut}
                label={t.nav.logOut}
                muted
                onClick={() => signOut({ callbackUrl: '/' })}
                trailing={<span aria-hidden="true" className="w-3.5 shrink-0" />}
              />
            </Section>

          </div>
        </div>
      </div>

    </CustomerLayout>
  );
}
