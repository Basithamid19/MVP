'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Star,
  ShieldCheck,
  MapPin,
  Clock,
  Languages,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ThumbsUp,
  Calendar,
  Zap,
  CalendarOff,
  Sparkles,
  Droplets,
  Hammer,
  Truck,
  Package,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import CustomerLayout from '@/components/CustomerLayout';
import { Avatar, EmptyState, buttonVariants } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

/* Category tint + mark used by the cover strip. Keyed on the real category
   slugs seeded in prisma/seed.ts, with the token slug names aliased in so a
   renamed/imported category still lands on its tint. Anything unknown falls
   back to the brand tint. */
const CATEGORY_THEME: Record<string, { bg: string; ink: string; Icon: React.ElementType }> = {
  cleaning:             { bg: 'bg-cat-cleaning',   ink: 'text-cat-cleaning-ink',   Icon: Sparkles },
  plumber:              { bg: 'bg-cat-plumbing',   ink: 'text-cat-plumbing-ink',   Icon: Droplets },
  plumbing:             { bg: 'bg-cat-plumbing',   ink: 'text-cat-plumbing-ink',   Icon: Droplets },
  electrician:          { bg: 'bg-cat-electrical', ink: 'text-cat-electrical-ink', Icon: Zap },
  electrical:           { bg: 'bg-cat-electrical', ink: 'text-cat-electrical-ink', Icon: Zap },
  handyman:             { bg: 'bg-cat-repairs',    ink: 'text-cat-repairs-ink',    Icon: Hammer },
  repairs:              { bg: 'bg-cat-repairs',    ink: 'text-cat-repairs-ink',    Icon: Hammer },
  'moving-help':        { bg: 'bg-cat-logistics',  ink: 'text-cat-logistics-ink',  Icon: Truck },
  logistics:            { bg: 'bg-cat-logistics',  ink: 'text-cat-logistics-ink',  Icon: Truck },
  'furniture-assembly': { bg: 'bg-cat-assembly',   ink: 'text-cat-assembly-ink',   Icon: Package },
  assembly:             { bg: 'bg-cat-assembly',   ink: 'text-cat-assembly-ink',   Icon: Package },
};
const FALLBACK_THEME = { bg: 'bg-brand-muted', ink: 'text-brand-dark', Icon: Wrench };

/* Quiet section shell — every content card below the hero shares this. The
   hero is the only elevated surface on the page. */
const SECTION = 'bg-card rounded-card border border-border-dim shadow-card p-4 sm:p-6';
const EYEBROW = 'text-xs font-bold uppercase tracking-widest text-ink-dim';

export default function ProviderProfilePage() {
  const { id }   = useParams();
  const router   = useRouter();
  const { data: session } = useSession();
  const t = useTranslation();

  // Day-of-week index (0 = Sun … 6 = Sat) → short label. Matches DB convention
  // used by `AvailabilitySlot.dayOfWeek`.
  const DAY_LABELS = [
    t.providerProfile.daySun,
    t.providerProfile.dayMon,
    t.providerProfile.dayTue,
    t.providerProfile.dayWed,
    t.providerProfile.dayThu,
    t.providerProfile.dayFri,
    t.providerProfile.daySat,
  ];
  const [provider, setProvider] = useState<any>(null);
  const [reviews,  setReviews]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const [provRes, revRes] = await Promise.all([
          fetch(`/api/providers?id=${id}`),
          fetch(`/api/reviews?providerId=${id}`).catch(() => null),
        ]);
        const provData = await provRes.json();
        setProvider(provData?.id ? provData : null);
        if (revRes?.ok) {
          const revData = await revRes.json();
          if (Array.isArray(revData)) setReviews(revData);
        }
      } catch (error) {
        console.error('Failed to fetch provider', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProvider();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">{t.providerProfile.notFound}</h1>
        <Link href="/browse" className="text-brand font-bold hover:underline">{t.providerProfile.backToBrowse}</Link>
      </div>
    );
  }

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));
  const maxCount = Math.max(...ratingDistribution.map(r => r.count), 1);

  const primaryCategory = provider.categories?.[0] ?? null;
  const theme = (primaryCategory?.slug && CATEGORY_THEME[primaryCategory.slug]) || FALLBACK_THEME;
  const CoverMark = theme.Icon;

  // Price anchor for the rail — cheapest real offering price, if any.
  const offeringPrices = ((provider.offerings ?? []) as any[])
    .map((o) => Number(o?.price))
    .filter((n) => !isNaN(n) && n > 0);
  const fromPrice = offeringPrices.length ? Math.min(...offeringPrices) : null;

  const reviewCount = provider._count?.reviews ?? reviews.length;

  // One stat set, one label set — rendered once for every breakpoint.
  const heroStats = [
    { label: t.providerProfile.statResponse,  value: provider.responseTime,                                            icon: Clock },
    { label: t.providerProfile.statLanguages, value: provider.languages?.length ? provider.languages.join(', ') : '—', icon: Languages },
    { label: t.providerProfile.statJobsDone,  value: `${provider.completedJobs}+`,                                     icon: CheckCircle2 },
  ];

  const bioText = provider.bio && provider.bio.trim().length > 0
    ? provider.bio
    : `${provider.categories?.map((c: any) => c.name).join(', ') || t.providerProfile.professionalFallback}${provider.serviceArea ? ` ${t.providerProfile.inArea} ${provider.serviceArea}` : ''}`;

  const requestHref = !session
    ? `/login?callbackUrl=/providers/${provider.id}`
    : (provider.categories?.length ?? 0) === 1
      // Single-service pro: pre-select it and skip to the details step.
      ? `/requests/new?providerId=${provider.id}&category=${provider.categories[0].slug}`
      : (provider.categories?.length ?? 0) > 1
        // Multi-service pro: let the customer choose which service, scoped to
        // just this pro's services (no more defaulting to the first category /
        // skipping the picker).
        ? `/requests/new?providerId=${provider.id}&providerCategories=${provider.categories.map((c: any) => c.slug).join(',')}`
        : `/requests/new?providerId=${provider.id}`;

  return (
    <CustomerLayout maxWidth="max-w-5xl">
      {/* Sub-header */}
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <button
          onClick={() => router.back()}
          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface-alt rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-base sm:text-lg flex-1">{t.providerProfile.title}</h1>
      </div>

      <div className="space-y-4 sm:space-y-6">

        {/* ── Hero card — the only elevated surface on the page ───────────── */}
        <div className="bg-card rounded-panel border border-border-dim shadow-elevated overflow-hidden">

          {/* Cover strip — category tint + oversized category mark */}
          <div className={cn('relative h-24 sm:h-32 overflow-hidden', theme.bg)}>
            <CoverMark
              aria-hidden
              strokeWidth={1}
              className={cn('absolute -right-6 -top-6 w-40 h-40 sm:w-52 sm:h-52 opacity-15', theme.ink)}
            />
            <CoverMark
              aria-hidden
              strokeWidth={1}
              className={cn('absolute left-1/3 -bottom-10 w-24 h-24 sm:w-28 sm:h-28 opacity-10', theme.ink)}
            />
            {primaryCategory && (
              <span className={cn(
                'absolute top-3 left-4 sm:top-4 sm:left-6 inline-flex items-center gap-1.5',
                'px-2.5 py-1 rounded-chip bg-card/80 backdrop-blur-sm',
                'text-3xs sm:text-2xs font-bold uppercase tracking-widest',
                theme.ink,
              )}>
                <CoverMark className="w-3 h-3" />
                {primaryCategory.name}
              </span>
            )}
          </div>

          <div className="px-4 sm:px-8 pb-5 sm:pb-8">
            {/* Avatar overlapping the cover's bottom edge */}
            <div className="relative w-fit -mt-10 sm:-mt-14">
              <Avatar
                src={provider.user.image}
                name={provider.user.name}
                size="xl"
                className="sm:w-28 sm:h-28 ring-4 ring-card shadow-card"
              />
              {provider.isVerified && (
                <span
                  title={t.common.verified}
                  className="absolute bottom-0.5 right-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-card flex items-center justify-center shadow-card"
                >
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-trust" />
                </span>
              )}
            </div>

            {/* Identity */}
            <div className="mt-3 sm:mt-4">
              <div className="flex items-start gap-2 flex-wrap mb-1.5">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight">
                  {provider.user.name}
                </h2>
                {provider.instantBook && (
                  <span className="flex items-center gap-1 bg-brand-muted text-brand-dark px-2.5 py-1 rounded-chip text-2xs font-bold uppercase tracking-wide mt-1 shrink-0">
                    <Zap className="w-3 h-3" />
                    {t.providerProfile.instantBook}
                  </span>
                )}
              </div>

              {/* Company name (from onboarding), if provided */}
              {provider.companyName && (
                <p className="text-sm text-ink-sub font-medium mb-1.5">
                  {provider.companyName}
                </p>
              )}

              {/* Rating + location */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-4">
                <div className="flex items-center gap-1 text-brand">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-ink font-bold text-sm">{provider.ratingAvg.toFixed(1)}</span>
                  <span className="text-ink-dim text-2xs sm:text-sm font-medium ml-0.5">
                    ({reviewCount} {t.meetPros.reviews})
                  </span>
                </div>
                <div className="flex items-center gap-1 text-ink-dim text-2xs sm:text-sm font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  {provider.serviceArea}
                </div>
              </div>

              {/* Bio — one tree, both breakpoints */}
              <p className="text-sm sm:text-base text-ink-sub leading-relaxed mt-3 sm:mt-4">
                {bioText}
              </p>

              {/* Stat tiles — one set, one label set, centered on mobile */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5">
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="p-3 sm:p-4 bg-surface-alt rounded-card border border-border-dim text-center sm:text-left"
                  >
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-ink-dim text-3xs sm:text-2xs font-bold uppercase tracking-widest mb-1">
                      <stat.icon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{stat.label}</span>
                    </div>
                    <p className="text-2xs sm:text-sm font-bold text-ink leading-tight">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body: content sections + conversion rail ─────────────────────
            On mobile the rail folds directly under the hero (order-1) so the
            CTA sits above the long content sections. */}
        {/* No `items-start` here: the rail's grid item must stretch to the full
            row height for `lg:sticky` to have travel room. */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">

          {/* ── Conversion rail ── */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-card rounded-panel border border-border-dim shadow-elevated p-5 sm:p-6 lg:sticky lg:top-24">

              {/* Price anchor */}
              {fromPrice !== null && (
                <div className="mb-4">
                  <p className={cn(EYEBROW, 'mb-0.5')}>{t.providerProfile.priceFrom}</p>
                  <p className="text-3xl font-bold tracking-tight text-ink">€{fromPrice.toFixed(0)}</p>
                </div>
              )}

              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-ink mb-1.5">
                {t.providerProfile.needHelp}
              </h3>
              <p className="text-sm text-ink-sub mb-4">
                {t.providerProfile.sendRequestTo} {provider.user.name.split(' ')[0]} {t.providerProfile.ctaDescSuffix}
              </p>

              {/* The single primary action on the page. */}
              <Link
                href={requestHref}
                className={cn(buttonVariants({ variant: 'primary', size: 'xl' }), 'w-full shadow-elevated')}
              >
                {t.providerProfile.sendServiceRequest}
              </Link>

              {/* Chat entry removed: messaging only unlocks after a booking is
                  confirmed (deposit paid) — see lib/chat-access.ts. */}

              {/* Reassurance — response time + verification, then guarantees */}
              <div className="mt-4 pt-4 border-t border-border-dim space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-ink-sub">
                  <span className="w-5 h-5 rounded-full bg-surface-alt flex items-center justify-center shrink-0">
                    <Clock className="w-3 h-3 text-ink-dim" />
                  </span>
                  <span className="min-w-0">
                    {t.providerProfile.responseTime}
                    <span className="text-ink font-bold"> · {provider.responseTime}</span>
                  </span>
                </div>
                {provider.isVerified && (
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-ink-sub">
                    <span className="w-5 h-5 rounded-full bg-trust-surface flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-3 h-3 text-trust" />
                    </span>
                    {t.providerProfile.idVerified}
                  </div>
                )}
                {[t.providerProfile.noUpfrontPayment, t.providerProfile.freeCancellation, t.providerProfile.aladdinGuarantee].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-ink-sub">
                    <span className="w-5 h-5 rounded-full bg-trust-surface flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-trust" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>

              {/* Compact reviews summary — replaces the old 7-dot mini-week */}
              <div className="mt-4 pt-4 border-t border-border-dim flex items-center gap-2.5">
                <div className="flex items-center gap-0.5 shrink-0">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i <= Math.round(provider.ratingAvg) ? 'text-brand fill-current' : 'text-border'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-ink">{provider.ratingAvg.toFixed(1)}</span>
                <span className="text-2xs sm:text-xs text-ink-dim font-medium">
                  {reviewCount} {t.meetPros.reviews}
                </span>
              </div>
            </div>
          </div>

          {/* ── Content sections ── */}
          <div className="lg:col-span-2 order-2 lg:order-1 space-y-4 sm:space-y-6">

            {/* Services */}
            <div className={SECTION}>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-3.5 h-3.5 text-ink-dim shrink-0" />
                <h3 className={EYEBROW}>{t.providerProfile.services}</h3>
              </div>

              {/* Categories the pro is qualified in */}
              {provider.categories?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {provider.categories.map((cat: any) => (
                    <span
                      key={cat.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-alt border border-border-dim rounded-chip text-xs sm:text-sm font-bold text-ink"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-trust" />
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Flat list of specific offerings with their real prices */}
              {provider.offerings?.length > 0 ? (
                <div className="space-y-2.5 sm:space-y-3">
                  {provider.offerings.map((offering: any) => {
                    const price = Number(offering.price);
                    const priceLabel = offering.priceType === 'FIXED' ? t.providerProfile.priceFixed
                      : offering.priceType === 'FROM' ? t.providerProfile.priceFrom
                      : t.providerProfile.priceHourly;
                    const priceSuffix = offering.priceType === 'HOURLY' ? (
                      <span className="text-ink-dim text-2xs sm:text-xs font-medium ml-1">{t.providerProfile.priceHourly}</span>
                    ) : null;
                    const priceHeader = offering.priceType === 'FROM' ? (
                      <div className="text-3xs sm:text-2xs font-bold text-ink-dim uppercase tracking-widest mb-0.5">{t.providerProfile.priceFrom}</div>
                    ) : null;
                    return (
                      <div
                        key={offering.id}
                        className="flex items-start justify-between gap-3 p-3 sm:p-4 bg-surface-alt rounded-card border border-border-dim"
                      >
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-card rounded-input flex items-center justify-center shadow-card shrink-0">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-trust" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm sm:text-base truncate">{offering.name}</div>
                            {offering.description && (
                              <p className="text-2xs sm:text-xs text-ink-sub leading-relaxed mt-0.5 line-clamp-2">
                                {offering.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {!isNaN(price) ? (
                            <>
                              {priceHeader}
                              <div className="text-base sm:text-lg font-bold">
                                €{price.toFixed(0)}
                                {priceSuffix}
                              </div>
                              {offering.priceType === 'FIXED' && (
                                <div className="text-3xs sm:text-2xs text-ink-dim">{priceLabel}</div>
                              )}
                            </>
                          ) : (
                            <div className="text-xs sm:text-sm font-medium text-ink-dim">{t.providerProfile.priceOnRequest}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-ink-dim">{t.providerProfile.noOfferings}</p>
              )}
            </div>

            {/* Availability — rendered from the provider's saved AvailabilitySlot
                rows. Single source: the rail's 7-dot mini-week is gone. */}
            {(() => {
              const slotsByDay: Record<number, { startTime: string; endTime: string }[]> = {};
              for (const s of (provider.availability ?? []) as any[]) {
                if (typeof s?.dayOfWeek !== 'number') continue;
                (slotsByDay[s.dayOfWeek] ??= []).push({ startTime: s.startTime, endTime: s.endTime });
              }
              // Sort each day's slots by start time so the rendered order is stable.
              for (const d of Object.keys(slotsByDay)) {
                slotsByDay[Number(d)].sort((a, b) => a.startTime.localeCompare(b.startTime));
              }
              const hasAnyAvailability = Object.values(slotsByDay).some(arr => arr.length > 0);

              return (
                <div className={SECTION}>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-3.5 h-3.5 text-ink-dim shrink-0" />
                    <h3 className={EYEBROW}>{t.providerProfile.typicalAvailability}</h3>
                  </div>

                  {hasAnyAvailability ? (
                    <div className="space-y-1.5">
                      {DAY_LABELS.map((label, idx) => {
                        const daySlots = slotsByDay[idx] ?? [];
                        const isOff = daySlots.length === 0;
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-input border ${
                              isOff ? 'bg-surface-alt border-border-dim' : 'bg-trust-surface border-trust-edge'
                            }`}
                          >
                            <span className={`w-10 text-xs font-bold uppercase tracking-wide shrink-0 ${isOff ? 'text-ink-dim' : 'text-trust'}`}>
                              {label}
                            </span>
                            {isOff ? (
                              <span className="text-xs text-ink-dim font-medium">{t.providerProfile.off}</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {daySlots.map((s, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-card border border-trust-edge rounded-chip text-2xs sm:text-xs font-bold text-trust"
                                  >
                                    {s.startTime} – {s.endTime}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-ink-dim">{t.providerProfile.noHours}</p>
                  )}

                  {/* Upcoming days off (blackout dates the provider has set) */}
                  {(() => {
                    const today = new Date().toISOString().slice(0, 10);
                    const upcoming = ((provider.blackoutDates ?? []) as string[])
                      .filter((d) => typeof d === 'string' && d >= today)
                      .sort()
                      .slice(0, 6);
                    if (upcoming.length === 0) return null;
                    return (
                      <div className="mt-4 pt-4 border-t border-border-dim">
                        <div className="flex items-center gap-1.5 text-ink-dim text-2xs font-bold uppercase tracking-widest mb-2">
                          <CalendarOff className="w-3 h-3" /> {t.providerProfile.upcomingDaysOff}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {upcoming.map((d) => (
                            <span
                              key={d}
                              className="px-2.5 py-1 bg-caution-surface border border-caution-edge text-caution rounded-chip text-2xs sm:text-xs font-medium"
                            >
                              {new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <p className="text-3xs text-ink-dim/60 mt-3">{t.providerProfile.timesApproximate}</p>
                </div>
              );
            })()}

            {/* Reviews — the proof section (no portfolio images in the API select) */}
            <div className={SECTION}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Star className="w-3.5 h-3.5 text-ink-dim shrink-0" />
                  <h3 className={EYEBROW}>{t.providerProfile.reviewsTitle}</h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Star className="w-4 h-4 text-brand fill-current" />
                  <span className="font-bold text-sm">{provider.ratingAvg.toFixed(1)}</span>
                  <span className="text-xs sm:text-sm text-ink-dim">({reviews.length})</span>
                </div>
              </div>

              {reviews.length > 0 && (
                <div className="space-y-1.5 mb-4 p-3.5 sm:p-4 bg-surface-alt rounded-card">
                  {ratingDistribution.map(({ star, count }) => (
                    <div key={star} className="flex items-center gap-2.5 sm:gap-3">
                      <span className="text-2xs font-bold text-ink-sub w-3 text-right shrink-0">{star}</span>
                      <Star className="w-3 h-3 text-brand fill-current shrink-0" />
                      <div className="flex-1 h-1.5 sm:h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full transition-all"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-2xs text-ink-dim w-3 shrink-0">{count}</span>
                    </div>
                  ))}
                </div>
              )}

              {reviews.length === 0 ? (
                <EmptyState icon={ThumbsUp} title={t.providerProfile.noReviews} size="sm" />
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {reviews.slice(0, 5).map((review: any) => (
                    <div key={review.id} className="p-3 sm:p-4 bg-surface-alt rounded-card border border-border-dim">
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={review.customer?.user?.image}
                          name={review.customer?.user?.name ?? t.providerProfile.customerFallback}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold truncate">
                              {review.customer?.user?.name ?? t.providerProfile.customerFallback}
                            </span>
                            <span className="text-2xs text-ink-dim shrink-0">
                              {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'text-brand fill-current' : 'text-border'}`} />
                            ))}
                          </div>
                          {review.comment && (
                            <p className="text-sm text-ink-sub leading-relaxed mt-1.5">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {reviews.length > 5 && (
                    <p className="text-sm text-ink-dim text-center pt-1">+ {reviews.length - 5} {t.providerProfile.moreReviews}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
