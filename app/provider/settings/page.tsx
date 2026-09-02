'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2, User, Camera, Shield, ShieldCheck,
  Receipt,
  UserCircle2, Briefcase, Calendar,
  LifeBuoy, Mail, BarChart2, LogOut, AlertCircle,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { Section, SettingsRow, HeroCard } from '@/components/settings';
import { Button, PageHeader, useToast } from '@/components/ui';

export default function ProviderSettingsPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const t = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [verificationTier, setVerificationTier] = useState('TIER0_BASIC');
  const [completedJobs, setCompletedJobs] = useState(0);
  const [ratingAvg, setRatingAvg] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

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
            // 503 = photo storage isn't reachable. The route deliberately
            // refuses to fall back to storing a base64 data URL, so this is a
            // "try again later" not a "try again now" — say so in the user's
            // language instead of echoing the server's English string.
            toast.error(
              res.status === 503
                ? t.common.photoStorageUnavailable
                : err.error || `${t.providerSettingsHub.uploadFailedPrefix} (${res.status}). ${t.providerSettingsHub.uploadFailedSuffix}`,
            );
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
          toast.error(t.common.networkError);
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-base font-semibold text-ink">{t.providerSettingsHub.loadErrorTitle}</p>
        <p className="text-sm text-ink-sub max-w-xs leading-relaxed">{t.providerSettingsHub.loadErrorDesc}</p>
        <Button variant="secondary" onClick={() => { setLoading(true); setRetryCount(c => c + 1); }}>
          {t.providerSettingsHub.retry}
        </Button>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user;
  const totalEarned = invoices.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);

  return (
    <div className="max-w-2xl mx-auto">

      <PageHeader title={t.providerSettingsHub.headerAccount} className="mb-5" />

      {/* ── Profile hero ── */}
      <HeroCard>
          <div className="relative z-10 flex items-center gap-3.5">
            <label className="relative w-14 h-14 shrink-0 cursor-pointer">
              <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
              <div className="w-14 h-14 rounded-input bg-white/20 border-2 border-white/30 overflow-hidden flex items-center justify-center">
                {localAvatar || user?.image
                  ? <img src={localAvatar ?? user?.image ?? ''} alt={user?.name ?? ''} className="w-full h-full object-cover" />
                  : <User className="w-7 h-7 text-white/80" />
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
              <h2 className="text-lg font-bold text-white truncate leading-tight">{user?.name}</h2>
              <p className="text-xs text-white/50 truncate mt-0.5">{user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1.5 bg-white/12 px-2 py-0.5 rounded-full">
                {verificationTier === 'TIER0_BASIC' ? (
                  <>
                    <Shield className="w-3 h-3 text-white/70" />
                    <span className="text-3xs font-semibold text-white/70">{t.providerSettingsHub.notVerified}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3 text-white/70" />
                    <span className="text-3xs font-semibold text-white/70">
                      {verificationTier === 'TIER1_ID_VERIFIED' ? t.verificationPage.tierIdVerified
                        : verificationTier === 'TIER2_TRADE_VERIFIED' ? t.verificationPage.tierTradeVerified
                        : t.verificationPage.tierEnhanced}
                    </span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-3 mt-3.5 pt-3 border-t border-white/10">
            {[
              { value: completedJobs, label: t.providerProfile.statJobsDone },
              { value: ratingAvg != null ? ratingAvg.toFixed(1) : '—', label: t.providerProfile.rating },
              { value: reviewCount, label: t.providerProfile.reviewsTitle },
            ].map((stat, i) => (
              <div key={stat.label} className={`text-center ${i > 0 ? 'border-l border-white/10' : ''}`}>
                <p className="text-base font-bold text-white leading-tight">{stat.value}</p>
                <p className="text-3xs font-semibold text-white/45 uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
      </HeroCard>

      {/* ── Sections ── */}
      <div className="flex flex-col gap-6 pt-6">

        {/* Setup */}
        <Section title={t.providerSettingsHub.sectionSetup}>
          <SettingsRow icon={UserCircle2} label={t.common.profile} sub={t.providerSettingsHub.rowProfileSub} href="/provider/settings/profile" />
          <SettingsRow icon={Briefcase} label={t.providerSettingsHub.rowServices} sub={t.providerSettingsHub.rowServicesSub} href="/provider/settings/services" />
          <SettingsRow icon={Calendar} label={t.providerSettingsHub.rowAvailability} sub={t.providerSettingsHub.rowAvailabilitySub} href="/provider/settings/availability" />
        </Section>

        {/* Activity */}
        <Section title={t.providerSettingsHub.sectionActivity}>
          <SettingsRow
            icon={Receipt}
            label={t.providerSettingsHub.invoices}
            sub={`${invoices.length} ${invoices.length !== 1 ? t.providerSettingsHub.invoicesPlural : t.providerSettingsHub.invoiceSingular} · €${totalEarned.toFixed(2)}`}
            href="/provider/earnings"
          />
        </Section>

        {/* Support */}
        <Section title={t.providerSettingsHub.sectionSupport}>
          <SettingsRow icon={AlertCircle} label={t.bookingDetail.reportIssue} sub={t.providerSettingsHub.rowReportIssueSub} href="/provider/disputes" />
          <SettingsRow icon={LifeBuoy} label={t.providerSettingsHub.helpCentre} sub={t.providerSettingsHub.helpCentreSub} href="/support" />
          <SettingsRow icon={Mail} label={t.providerSettingsHub.emailUs} sub="support@aladdin.lt" href="mailto:support@aladdin.lt" muted />
        </Section>

        {/* Account */}
        <Section title={t.providerSettingsHub.sectionAccount}>
          <SettingsRow icon={ShieldCheck} label={t.providerNav.verification} sub={t.providerSettingsHub.rowVerificationSub} href="/provider/verification" />
          <SettingsRow icon={BarChart2} label={t.providerNav.earnings} sub={t.providerSettingsHub.rowEarningsSub} href="/provider/earnings" />
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
  );
}
