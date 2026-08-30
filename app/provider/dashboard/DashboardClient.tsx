'use client';

import React from 'react';
import Link from 'next/link';
import {
  Star, CheckCircle2, ArrowRight,
  Inbox, Briefcase, DollarSign, AlertCircle, ChevronRight,
  TrendingUp, ShieldCheck, Calendar, MapPin, Users,
  Zap, Timer,
} from 'lucide-react';
import { formatVilnius } from '@/lib/time';
import { providerNet } from '@/lib/fees';
import { useTranslation, type Dictionary } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  Avatar, Card, EmptyState, StatCard, StatusBadge,
  buttonVariants, verificationTierVariant,
} from '@/components/ui';

function capitalize(name?: string | null) {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/* ─── CompletenessRing ───────────────────────────────────────────────────────
 * One ring, two sizes. The two previous copies used hand-tuned dash constants
 * (× 0.8168 / × 1.005) that didn't match their radii; this derives the dash
 * array from the real circumference (2πr) so both sizes are accurate.
 * ────────────────────────────────────────────────────────────────────────── */
const RING = {
  sm: { box: 'w-8 h-8',   vb: 32, stroke: 3, label: 'text-3xs' },
  md: { box: 'w-10 h-10', vb: 40, stroke: 3, label: 'text-2xs' },
} as const;

function CompletenessRing({ pct, size = 'md' }: { pct: number; size?: keyof typeof RING }) {
  const { box, vb, stroke, label } = RING[size];
  const r = (vb - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (Math.min(Math.max(pct, 0), 100) / 100) * circumference;

  return (
    <div className={cn('relative shrink-0', box)}>
      <svg className={cn('-rotate-90', box)} viewBox={`0 0 ${vb} ${vb}`}>
        <circle cx={vb / 2} cy={vb / 2} r={r} fill="none" stroke="currentColor"
          className="text-border-dim" strokeWidth={stroke} />
        <circle cx={vb / 2} cy={vb / 2} r={r} fill="none" stroke="currentColor"
          className="text-brand" strokeWidth={stroke}
          strokeDasharray={`${filled} ${circumference}`} strokeLinecap="round" />
      </svg>
      <span className={cn('absolute inset-0 flex items-center justify-center font-bold text-brand', label)}>
        {pct}%
      </span>
    </div>
  );
}

function getAgeLabel(createdAt: string, t: Dictionary) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins < 60) return `${t.messagesPage.agoPrefix}${mins}${t.messagesPage.minutesSuffix}`;
  if (mins < 1440) return `${t.messagesPage.agoPrefix}${Math.floor(mins / 60)}${t.messagesPage.hoursSuffix}`;
  return `${t.messagesPage.agoPrefix}${Math.floor(mins / 1440)}${t.messagesPage.daysSuffix}`;
}

type DashboardClientProps = {
  initialUser: { name: string | null; image: string | null };
  initialProfile: any | null;
  initialLeads: any[];
  initialBookings: any[];
  loadError: boolean;
};

export default function DashboardClient({
  initialUser,
  initialProfile,
  initialLeads,
  initialBookings,
  loadError,
}: DashboardClientProps) {
  const t = useTranslation();
  const profile = initialProfile ?? {};
  const leads = initialLeads;
  const bookings = initialBookings;

  const firstName = capitalize(initialUser.name?.split(' ')[0]);
  const activeJobs = bookings.filter((b: any) => b.status === 'SCHEDULED' || b.status === 'IN_PROGRESS');
  const completedJobs = bookings.filter((b: any) => b.status === 'COMPLETED');
  const urgentLeads = leads.filter((l: any) => l.isUrgent);
  const totalEarnings = completedJobs.reduce((s: number, b: any) => s + providerNet(b.totalAmount ?? 0), 0);

  const isVerified = profile?.verificationTier && profile.verificationTier !== 'TIER0_BASIC';

  // Profile completeness
  const hasAvatar = !!initialUser.image;
  const hasBio = (profile?.bio ?? '').trim().length >= 50;
  const hasArea = (profile?.serviceArea ?? '').trim().length > 0;
  const hasCategories = (profile?.categories ?? []).length > 0;
  const hasOfferings = (profile?.offerings ?? []).length > 0;
  const completenessSteps = [
    { done: hasAvatar, label: t.providerDashboard.stepAddPhoto },
    { done: hasBio, label: t.providerDashboard.stepWriteBio },
    { done: hasArea, label: t.providerDashboard.stepSetArea },
    { done: hasCategories, label: t.providerDashboard.stepChooseCategories },
    { done: hasOfferings, label: t.providerDashboard.stepAddOfferings },
  ];
  const completedCount = completenessSteps.filter(s => s.done).length;
  const completePct = Math.round((completedCount / completenessSteps.length) * 100);
  const nextStep = completenessSteps.find(s => !s.done);
  const verificationProgress =
    profile?.verificationTier === 'TIER3_ENHANCED' ? 100 :
    profile?.verificationTier === 'TIER2_TRADE_VERIFIED' ? 75 :
    profile?.verificationTier === 'TIER1_ID_VERIFIED' ? 50 : 25;

  const freshLeads = leads.filter((l: any) => {
    const age = (Date.now() - new Date(l.createdAt).getTime()) / 60000;
    return age <= 120;
  });

  const ctaLabel = freshLeads.length > 0
    ? `${t.providerDashboard.ctaViewPrefix} ${freshLeads.length} ${freshLeads.length > 1 ? t.providerDashboard.newLeadsPlural : t.providerDashboard.newLeadSingular}`
    : leads.length > 0 ? t.providerDashboard.viewLeads : t.providerDashboard.browseLeads;

  const stats = [
    {
      label: t.providerDashboard.statNewLeads,
      value: leads.length,
      sub: leads.length > 0 ? `${freshLeads.length} ${t.providerDashboard.newTodaySuffix}` : t.providerDashboard.noneYet,
      icon: Inbox,
      href: '/provider/leads',
      badge: urgentLeads.length > 0 ? urgentLeads.length : null,
    },
    {
      label: t.providerDashboard.statActiveJobs,
      value: activeJobs.length,
      sub: activeJobs.length > 0 ? `${activeJobs.filter((b: any) => b.status === 'IN_PROGRESS').length} ${t.providerDashboard.inProgressSuffix}` : t.providerDashboard.noneScheduled,
      icon: Briefcase,
      href: '/provider/jobs',
      badge: null,
    },
    {
      label: t.providerDashboard.statCompleted,
      value: completedJobs.length,
      sub: t.providerDashboard.allTime,
      icon: CheckCircle2,
      href: '/provider/jobs',
      badge: null,
    },
    {
      label: t.providerDashboard.statEarnings,
      value: `€${totalEarnings.toFixed(0)}`,
      sub: t.providerDashboard.netEarned,
      icon: DollarSign,
      href: '/provider/earnings',
      badge: null,
    },
  ];

  const tierLabel = profile?.verificationTier === 'TIER3_ENHANCED' ? t.verificationPage.tierEnhanced
    : profile?.verificationTier === 'TIER2_TRADE_VERIFIED' ? t.verificationPage.tierTradeVerified
    : profile?.verificationTier === 'TIER1_ID_VERIFIED' ? t.verificationPage.tierIdVerified
    : t.verificationPage.tierBasic;

  /* ── Nudges ──────────────────────────────────────────────────────────────
   * One priority-ordered list replaces the old mobile-header / desktop-banner
   * pair. The highest-priority open nudge (verification → completeness →
   * fresh leads) renders as the single prominent banner; anything else below
   * it collapses to a quiet one-line row.
   * ─────────────────────────────────────────────────────────────────────── */
  type Nudge = {
    key: string;
    tone: 'brand' | 'caution';
    icon: React.ElementType;
    ring?: boolean;
    title: string;
    desc: string;
    quiet: React.ReactNode;
    href: string;
    cta: string;
  };

  const nudges: Nudge[] = [];

  if (!isVerified) nudges.push({
    key: 'verification',
    tone: 'brand',
    icon: ShieldCheck,
    title: t.providerDashboard.verifyBannerTitle,
    desc: t.providerDashboard.verifyBannerDesc,
    quiet: <><span className="font-bold">{t.providerDashboard.completeVerificationBold}</span> {t.providerDashboard.completeVerificationRest}</>,
    href: '/provider/onboarding',
    cta: t.providerDashboard.getVerified,
  });

  if (completePct < 100) nudges.push({
    key: 'completeness',
    tone: 'brand',
    icon: TrendingUp,
    ring: true,
    title: `${t.providerDashboard.profileBannerPrefix} ${completePct}% ${t.providerDashboard.completeSuffix}`,
    desc: `${nextStep ? `${t.providerDashboard.nextStepPrefix} ${nextStep.label}` : t.providerDashboard.almostThere} ${t.providerDashboard.completeProfilesAttract}`,
    quiet: <><span className="font-bold">{t.providerDashboard.profilePrefix} {completePct}% {t.providerDashboard.completeSuffix}</span>{nextStep ? ` · ${t.providerDashboard.nextPrefix} ${nextStep.label}` : ''}</>,
    href: '/provider/settings',
    cta: t.providerDashboard.completeProfileBtn,
  });

  if (freshLeads.length > 0) nudges.push({
    key: 'fresh-leads',
    tone: 'caution',
    icon: Timer,
    title: `${freshLeads.length} ${freshLeads.length > 1 ? t.providerDashboard.freshWaitingPlural : t.providerDashboard.freshWaitingSingular}`,
    desc: t.providerDashboard.respondHint,
    quiet: <><span className="font-bold">{freshLeads.length} {freshLeads.length > 1 ? t.providerDashboard.freshLeadsPlural : t.providerDashboard.freshLeadSingular}</span> {t.providerDashboard.freshLeadMobileRest}</>,
    href: '/provider/leads',
    cta: t.providerDashboard.respondNow,
  });

  const [primaryNudge, ...quietNudges] = nudges;

  return (
    <div className="max-w-5xl mx-auto">

      {loadError && (
        <div className="mb-4 flex items-center gap-2.5 bg-caution-surface border border-caution-edge rounded-input px-3 py-2.5 sm:px-4 sm:py-3">
          <AlertCircle className="w-4 h-4 text-caution shrink-0" />
          <p className="text-xs sm:text-sm text-caution flex-1">
            <span className="font-bold">{t.providerDashboard.loadErrorBold}</span> {t.providerDashboard.loadErrorRest}
          </p>
        </div>
      )}

      {/* ── Greeting — one tree, scaled by breakpoint ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <Avatar
            src={initialUser.image}
            name={initialUser.name ?? '?'}
            size="lg"
            className="w-12 h-12 sm:w-16 sm:h-16"
          />
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink truncate">
              {t.providerDashboard.hello} {firstName}
            </h1>
            <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
              <StatusBadge
                variant={verificationTierVariant(profile?.verificationTier ?? 'TIER0_BASIC')}
                label={tierLabel}
              />
              {profile?.ratingAvg > 0 && (
                <span className="flex items-center gap-1 text-xs sm:text-sm font-medium text-ink-sub">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand fill-brand" />
                  {profile.ratingAvg.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          href="/provider/leads"
          className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'w-full sm:w-auto')}
        >
          {ctaLabel} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ── Nudges — one prominent banner, the rest as quiet rows ── */}
      {primaryNudge && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-card border px-3 py-3 sm:px-4',
            quietNudges.length > 0 ? 'mb-2' : 'mb-4 sm:mb-6',
            primaryNudge.tone === 'caution'
              ? 'bg-caution-surface border-caution-edge'
              : 'bg-brand-muted border-brand/20',
          )}
        >
          {primaryNudge.ring ? (
            <CompletenessRing pct={completePct} size="md" />
          ) : (
            <div
              className={cn(
                'w-9 h-9 rounded-input flex items-center justify-center shrink-0',
                primaryNudge.tone === 'caution' ? 'bg-caution-edge text-caution' : 'bg-card/70 text-brand',
              )}
            >
              <primaryNudge.icon className="w-4 h-4" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-bold', primaryNudge.tone === 'caution' ? 'text-caution' : 'text-brand')}>
              {primaryNudge.title}
            </p>
            <p className={cn('text-xs mt-0.5 line-clamp-2', primaryNudge.tone === 'caution' ? 'text-caution/80' : 'text-brand/70')}>
              {primaryNudge.desc}
            </p>
          </div>
          <Link
            href={primaryNudge.href}
            className={cn(
              buttonVariants({ variant: 'primary', size: 'sm' }),
              'shrink-0',
              primaryNudge.tone === 'caution' && 'bg-caution hover:bg-caution/90',
            )}
          >
            {primaryNudge.cta}
          </Link>
        </div>
      )}

      {quietNudges.length > 0 && (
        <div className="space-y-0.5 mb-4 sm:mb-6">
          {quietNudges.map(n => (
            <Link
              key={n.key}
              href={n.href}
              className="group flex items-center gap-2.5 rounded-input px-3 py-2 hover:bg-surface-alt transition-colors"
            >
              {n.ring ? (
                <CompletenessRing pct={completePct} size="sm" />
              ) : (
                <n.icon className={cn('w-3.5 h-3.5 shrink-0', n.tone === 'caution' ? 'text-caution' : 'text-ink-dim')} />
              )}
              <p className="flex-1 min-w-0 truncate text-xs text-ink-sub">{n.quiet}</p>
              <ChevronRight className="w-3.5 h-3.5 text-ink-dim shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      )}

      {/* ── KPI row — one grid, StatCard everywhere ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
        {stats.map(({ label, value, sub, icon, href, badge }) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            sub={sub}
            icon={icon}
            iconClassName="bg-brand-muted text-brand"
            href={href}
            badge={badge}
            className="p-3.5 sm:p-5"
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left + center: Leads & Jobs */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">

          {/* Urgent leads */}
          {urgentLeads.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                <AlertCircle className="w-4 h-4 text-caution" />
                <h2 className="font-bold text-xs uppercase tracking-widest text-caution">
                  {urgentLeads.length} {urgentLeads.length > 1 ? t.providerDashboard.urgentLeadsPlural : t.providerDashboard.urgentLeadSingular}
                </h2>
              </div>
              <div className="space-y-2.5 sm:space-y-3">
                {urgentLeads.slice(0, 2).map((lead: any) => (
                  <React.Fragment key={lead.id}>
                    <LeadCard lead={lead} urgent />
                  </React.Fragment>
                ))}
              </div>
            </section>
          )}

          {/* Recent leads */}
          <section>
            <div className="flex items-center justify-between mb-2.5 sm:mb-4">
              <h2 className="text-base sm:text-xl font-semibold text-ink">{t.providerDashboard.recentLeads}</h2>
              <Link href="/provider/leads" className="text-xs sm:text-sm font-semibold text-brand hover:text-brand-dark transition-colors">
                {t.providerDashboard.viewAll}
              </Link>
            </div>
            {leads.length === 0 ? (
              // The setup checklist is only useful while the profile is
              // incomplete — a fully-set-up provider with zero open leads was
              // seeing a card of crossed-out to-dos instead of a plain
              // "no leads right now" state.
              completePct < 100 ? (
                <Card padding="md" className="sm:p-8">
                  <EmptyState
                    icon={Inbox}
                    size="sm"
                    title={t.providerDashboard.emptyLeadsTitle}
                    description={t.providerDashboard.emptyLeadsDesc}
                    action={
                      <div className="text-left">
                        <div className="space-y-2 mb-4">
                          {completenessSteps.map(({ done, label }) => (
                            <div key={label} className="flex items-center gap-2.5 text-xs">
                              <CheckCircle2 className={`w-4 h-4 shrink-0 ${done ? 'text-brand' : 'text-ink-dim/30'}`} />
                              <span className={done ? 'text-ink-sub line-through' : 'text-ink font-medium'}>{label}</span>
                            </div>
                          ))}
                        </div>
                        <Link href="/provider/settings" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                          {t.providerDashboard.completeYourProfile} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    }
                  />
                </Card>
              ) : (
                <Card padding="md" className="border-dashed sm:p-8">
                  <EmptyState
                    icon={Inbox}
                    size="sm"
                    title={t.providerDashboard.noLeadsTitle}
                    description={t.providerDashboard.noLeadsDesc}
                    action={
                      <Link href="/provider/leads" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
                        {t.providerDashboard.browseLeads} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    }
                  />
                </Card>
              )
            ) : (
              <div className="space-y-2.5 sm:space-y-4">
                {leads.slice(0, 3).map((lead: any) => (
                  <React.Fragment key={lead.id}>
                    <LeadCard lead={lead} />
                  </React.Fragment>
                ))}
              </div>
            )}
          </section>

          {/* Active jobs */}
          <section>
            <div className="flex items-center justify-between mb-2.5 sm:mb-4">
              <h2 className="text-base sm:text-xl font-semibold text-ink">{t.providerDashboard.activeJobs}</h2>
              <Link href="/provider/jobs" className="text-xs sm:text-sm font-semibold text-brand hover:text-brand-dark transition-colors">
                {t.providerDashboard.viewAll}
              </Link>
            </div>
            {activeJobs.length === 0 ? (
              <Card padding="md" className="sm:p-8">
                <EmptyState
                  icon={Briefcase}
                  size="sm"
                  title={t.providerDashboard.emptyJobsTitle}
                  description={t.providerDashboard.emptyJobsDesc}
                  action={
                    <Link href="/provider/leads" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
                      {t.providerDashboard.browseAvailableLeads} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  }
                />
              </Card>
            ) : (
              <div className="space-y-2.5 sm:space-y-4">
                {activeJobs.slice(0, 2).map((b: any) => (
                  <Link key={b.id} href={`/provider/jobs/${b.id}`}
                    className="flex items-center gap-3 sm:gap-4 bg-card rounded-card border border-border-dim p-3.5 sm:p-5 hover:border-brand/30 hover:shadow-elevated transition-all shadow-card">
                    <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${b.status === 'IN_PROGRESS' ? 'bg-caution' : 'bg-info'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate text-ink">{b.quote?.request?.category?.name ?? t.providerDashboard.jobFallback}</p>
                      <p className="text-xs sm:text-sm text-ink-sub flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        {formatVilnius(b.scheduledAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="font-bold text-sm text-ink">€{b.totalAmount?.toFixed(0)}</span>
                    <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Right column — business health. In the grid it sits in the rail
             at lg and stacks under the main column below it, so there is one
             implementation instead of a desktop rail + mobile copy. ── */}
        <div className="space-y-4 lg:space-y-5">
          {/* Quick actions — the mobile bottom nav already covers these links */}
          <Card padding="md" radius="panel" className="hidden lg:block">
            <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-4">{t.providerDashboard.quickActions}</p>
            <div className="space-y-1">
              {[
                { label: t.providerDashboard.browseLeads,    href: '/provider/leads',       icon: Inbox },
                { label: t.providerDashboard.manageSettings, href: '/provider/settings',    icon: Calendar },
                { label: t.providerDashboard.viewEarnings,   href: '/provider/earnings',    icon: DollarSign },
                { label: t.mobileNav.stats,                  href: '/provider/performance', icon: TrendingUp },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-input text-sm font-medium text-ink-sub hover:text-ink hover:bg-surface-alt transition-all">
                  <div className="w-7 h-7 bg-brand-muted rounded-input flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-brand" />
                  </div>
                  {label}
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-ink-dim" />
                </Link>
              ))}
            </div>
          </Card>

          {/* Business health — verification + rating in one divided card */}
          <Card padding="none" className="overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-border-dim">
              <div className="p-3.5 sm:p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                  <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest">{t.providerNav.verification}</p>
                </div>
                <p className="text-sm font-semibold text-ink mb-2">{tierLabel}</p>
                <div className="w-full bg-surface-alt rounded-full h-1">
                  <div className="bg-brand h-1 rounded-full transition-all" style={{ width: `${verificationProgress}%` }} />
                </div>
              </div>
              <div className="p-3.5 sm:p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Star className="w-3.5 h-3.5 text-brand" />
                  <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest">{t.providerProfile.rating}</p>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-xl font-bold text-ink leading-none">{profile?.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : '—'}</p>
                  {profile?.ratingAvg > 0 && <Star className="w-3 h-3 text-brand fill-brand" />}
                </div>
                <p className="text-3xs text-ink-dim mt-1">{profile?.completedJobs ?? completedJobs.length} {t.providerDashboard.jobsDoneSuffix}</p>
              </div>
            </div>

            <Link href="/provider/onboarding" className="border-t border-border-dim flex items-center justify-between px-3.5 py-2.5 group hover:bg-surface-alt/50 transition-colors">
              <span className="text-xs font-semibold text-ink-sub group-hover:text-ink transition-colors">
                {verificationProgress < 100 ? t.providerDashboard.completeVerification : t.providerDashboard.manageVerification}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-ink-dim group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link href="/provider/performance" className="border-t border-border-dim flex items-center justify-between px-3.5 py-2.5 group hover:bg-surface-alt/50 transition-colors">
              <span className="text-xs font-semibold text-brand">{t.providerDashboard.viewFullPerformance}</span>
              <ChevronRight className="w-3.5 h-3.5 text-brand group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── Lead Card Component ─── */
function LeadCard({ lead, urgent }: { lead: any; urgent?: boolean }) {
  const t = useTranslation();
  const ageLabel = getAgeLabel(lead.createdAt, t);
  const responders = lead.quotes?.length ?? 0;
  const hasBudget = lead.budget != null && lead.budget > 0;

  return (
    <div className={`rounded-card border transition-all hover:shadow-elevated ${
      urgent
        ? 'bg-caution-surface border-caution/30 hover:border-caution/50 p-3.5 sm:p-5'
        : 'bg-card border-border-dim hover:border-brand/30 shadow-card p-3.5 sm:p-5'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          {/* Category + urgent badge */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5 sm:mb-2">
            <span className={`text-3xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 uppercase tracking-widest rounded-full ${
              urgent ? 'bg-caution text-white' : 'bg-surface-alt text-ink-sub'
            }`}>
              {lead.category?.name}
            </span>
            {lead.isUrgent && (
              <span className="flex items-center gap-0.5 text-3xs font-bold text-caution">
                <Zap className="w-3 h-3" /> {t.providerDashboard.urgent}
              </span>
            )}
            <span className="text-3xs text-ink-dim ml-auto sm:ml-0">{ageLabel}</span>
          </div>

          {/* Description */}
          <p className="text-sm sm:text-base font-semibold text-ink line-clamp-1 mb-2 sm:mb-3">{lead.description}</p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-2">
            {lead.address && (
              <span className="flex items-center gap-1 text-xs sm:text-sm text-ink-sub">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="truncate max-w-[140px] sm:max-w-none">{lead.address}</span>
              </span>
            )}
            {responders > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-caution">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                {responders} {responders > 1 ? t.requestsList.quotesPlural : t.requestsList.quoteSingular}
              </span>
            )}
            {hasBudget && (
              <span className="text-xs font-semibold text-trust">~€{lead.budget}</span>
            )}
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/provider/quote/${lead.id}`}
          className={cn(
            buttonVariants({ variant: 'primary', size: 'md' }),
            'w-full sm:w-auto',
            urgent && 'bg-caution hover:bg-caution/90',
          )}
        >
          {t.providerDashboard.respond}
        </Link>
      </div>
    </div>
  );
}
