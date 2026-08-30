'use client';

import React from 'react';
import Link from 'next/link';
import {
  Star, CheckCircle2, ArrowRight,
  Inbox, Briefcase, DollarSign, AlertCircle, ChevronRight,
  TrendingUp, ShieldCheck, Calendar, MapPin, Clock, Users,
  Zap, Timer,
} from 'lucide-react';
import { formatVilnius } from '@/lib/time';
import { providerNet } from '@/lib/fees';
import { useTranslation, type Dictionary } from '@/lib/i18n';

function capitalize(name?: string | null) {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getInitials(name?: string | null) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
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
      color: 'bg-brand-muted text-brand',
      href: '/provider/leads',
      badge: urgentLeads.length > 0 ? urgentLeads.length : null,
    },
    {
      label: t.providerDashboard.statActiveJobs,
      value: activeJobs.length,
      sub: activeJobs.length > 0 ? `${activeJobs.filter((b: any) => b.status === 'IN_PROGRESS').length} ${t.providerDashboard.inProgressSuffix}` : t.providerDashboard.noneScheduled,
      icon: Briefcase,
      color: 'bg-brand-muted text-brand',
      href: '/provider/jobs',
      badge: null,
    },
    {
      label: t.providerDashboard.statCompleted,
      value: completedJobs.length,
      sub: t.providerDashboard.allTime,
      icon: CheckCircle2,
      color: 'bg-brand-muted text-brand',
      href: '/provider/jobs',
      badge: null,
    },
    {
      label: t.providerDashboard.statEarnings,
      value: `€${totalEarnings.toFixed(0)}`,
      sub: t.providerDashboard.netEarned,
      icon: DollarSign,
      color: 'bg-brand-muted text-brand',
      href: '/provider/earnings',
      badge: null,
    },
  ];

  const tierLabel = profile?.verificationTier === 'TIER3_ENHANCED' ? t.verificationPage.tierEnhanced
    : profile?.verificationTier === 'TIER2_TRADE_VERIFIED' ? t.verificationPage.tierTradeVerified
    : profile?.verificationTier === 'TIER1_ID_VERIFIED' ? t.verificationPage.tierIdVerified
    : t.verificationPage.tierBasic;

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

      {/* ── Mobile: Hero / Business Summary ── */}
      <div className="sm:hidden mb-4">
        {/* Identity + CTA */}
        <div className="bg-brand rounded-card p-4 shadow-md text-white mb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-bold shrink-0 select-none">
              {initialUser.image
                ? <img src={initialUser.image} alt="" className="w-full h-full rounded-full object-cover" />
                : getInitials(initialUser.name)
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold tracking-tight truncate">{t.providerDashboard.hello} {firstName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-3xs font-bold uppercase tracking-widest text-white/60">
                  <ShieldCheck className="w-3 h-3" /> {tierLabel}
                </span>
                {profile?.ratingAvg > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-white/80">
                    <Star className="w-3 h-3 fill-white/80" /> {profile.ratingAvg.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            href="/provider/leads"
            className="flex items-center justify-center gap-2 w-full bg-card text-brand py-2.5 rounded-input text-sm font-semibold hover:bg-white/90 transition-all"
          >
            {ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Fresh leads alert */}
        {freshLeads.length > 0 && (
          <div className="flex items-center gap-2.5 bg-caution-surface border border-caution-edge rounded-input px-3 py-2.5 mb-3">
            <Timer className="w-4 h-4 text-caution shrink-0" />
            <p className="text-xs text-caution flex-1">
              <span className="font-bold">{freshLeads.length} {freshLeads.length > 1 ? t.providerDashboard.freshLeadsPlural : t.providerDashboard.freshLeadSingular}</span> {t.providerDashboard.freshLeadMobileRest}
            </p>
            <Link href="/provider/leads" className="text-3xs font-bold text-caution uppercase tracking-wide shrink-0">{t.providerDashboard.go}</Link>
          </div>
        )}

        {/* Verification nudge — compact, only if not verified */}
        {!isVerified && (
          <Link href="/provider/onboarding" className="flex items-center gap-2.5 bg-brand-muted rounded-input px-3 py-2.5 mb-3 group">
            <ShieldCheck className="w-4 h-4 text-brand shrink-0" />
            <p className="text-xs text-brand flex-1">
              <span className="font-bold">{t.providerDashboard.completeVerificationBold}</span> {t.providerDashboard.completeVerificationRest}
            </p>
            <ChevronRight className="w-3.5 h-3.5 text-brand shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* Profile completeness nudge */}
        {completePct < 100 && (
          <Link href="/provider/settings" className="flex items-center gap-2.5 bg-surface-alt border border-border-dim rounded-input px-3 py-2.5 mb-3 group">
            <div className="relative w-8 h-8 shrink-0">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" className="text-border-dim" strokeWidth="3" />
                <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" className="text-brand" strokeWidth="3"
                  strokeDasharray={`${completePct * 0.8168} 81.68`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-3xs font-bold text-brand">{completePct}%</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-ink">{t.providerDashboard.profilePrefix} {completePct}% {t.providerDashboard.completeSuffix}</p>
              {nextStep && <p className="text-3xs text-ink-sub mt-0.5">{t.providerDashboard.nextPrefix} {nextStep.label}</p>}
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-ink-dim shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* ── Desktop: Original header ── */}
      <div className="hidden sm:block">
        {/* Response timer banner */}
        {freshLeads.length > 0 && (
          <div className="mb-6 bg-caution-surface border border-caution-edge rounded-card px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-caution-edge rounded-input flex items-center justify-center shrink-0">
              <Timer className="w-4 h-4 text-caution" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-caution">
                {freshLeads.length} {freshLeads.length > 1 ? t.providerDashboard.freshWaitingPlural : t.providerDashboard.freshWaitingSingular}
              </p>
              <p className="text-xs text-caution/80 mt-0.5">
                {t.providerDashboard.respondHint}
              </p>
            </div>
            <Link
              href="/provider/leads"
              className="shrink-0 bg-caution text-white px-4 py-2 rounded-input text-xs font-bold hover:opacity-90 transition-opacity"
            >
              {t.providerDashboard.respondNow}
            </Link>
          </div>
        )}

        {/* Verification banner */}
        {!isVerified && (
          <div className="mb-6 bg-brand-muted border border-brand/20 rounded-card px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/60 rounded-input flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-brand">{t.providerDashboard.verifyBannerTitle}</p>
              <p className="text-xs text-brand/70 mt-0.5">
                {t.providerDashboard.verifyBannerDesc}
              </p>
            </div>
            <Link
              href="/provider/onboarding"
              className="shrink-0 bg-brand text-white px-4 py-2 rounded-input text-xs font-bold hover:bg-brand-dark transition-colors"
            >
              {t.providerDashboard.getVerified}
            </Link>
          </div>
        )}

        {/* Profile completeness banner */}
        {completePct < 100 && (
          <div className="mb-6 bg-surface-alt border border-border-dim rounded-card px-4 py-3 flex items-center gap-3">
            <div className="relative w-10 h-10 shrink-0">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" className="text-border-dim" strokeWidth="3" />
                <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" className="text-brand" strokeWidth="3"
                  strokeDasharray={`${completePct * 1.005} 100.5`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xs font-bold text-brand">{completePct}%</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink">{t.providerDashboard.profileBannerPrefix} {completePct}% {t.providerDashboard.completeSuffix}</p>
              <p className="text-xs text-ink-sub mt-0.5">
                {nextStep ? `${t.providerDashboard.nextStepPrefix} ${nextStep.label}` : t.providerDashboard.almostThere} {t.providerDashboard.completeProfilesAttract}
              </p>
            </div>
            <Link
              href="/provider/settings"
              className="shrink-0 bg-brand text-white px-4 py-2 rounded-input text-xs font-bold hover:bg-brand-dark transition-colors"
            >
              {t.providerDashboard.completeProfileBtn}
            </Link>
          </div>
        )}

        {/* Desktop greeting */}
        <div className="flex items-start justify-between gap-6 mb-8 sm:mb-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-brand text-white flex items-center justify-center text-xl font-semibold shrink-0 select-none shadow-card">
              {getInitials(initialUser.name)}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                {t.providerDashboard.hello} {firstName}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-3xs font-bold uppercase tracking-widest ${
                  isVerified ? 'bg-brand-muted text-brand' : 'bg-surface-alt text-ink-dim'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {tierLabel}
                </span>
                {profile?.ratingAvg > 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-ink-sub">
                    <Star className="w-4 h-4 text-brand fill-brand" />
                    {profile.ratingAvg.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            href="/provider/leads"
            className="flex items-center gap-2 bg-brand text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-brand-dark transition-all shadow-card hover:shadow-md"
          >
            {ctaLabel} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── Mobile: KPI strip ── */}
      <div className="sm:hidden grid grid-cols-4 gap-1.5 mb-4">
        {stats.map(({ label, value, icon: Icon, href, badge }) => (
          <Link key={label} href={href} className="relative bg-card rounded-input border border-border-dim p-2.5 text-center shadow-card hover:shadow-md transition-all">
            {badge && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-caution text-white text-3xs font-bold rounded-full flex items-center justify-center">{badge}</span>
            )}
            <div className="w-7 h-7 bg-brand-muted rounded-lg flex items-center justify-center mx-auto mb-1.5">
              <Icon className="w-3.5 h-3.5 text-brand" />
            </div>
            <p className="text-lg font-bold tracking-tight text-ink leading-none">{value}</p>
            <p className="text-3xs font-medium text-ink-dim mt-1 uppercase tracking-wide">{label}</p>
          </Link>
        ))}
      </div>

      {/* ── Desktop: KPI cards grid ── */}
      <div className="hidden sm:grid lg:grid-cols-4 sm:grid-cols-2 gap-6 mb-10">
        {stats.map(({ label, value, sub, icon: Icon, color, href, badge }) => (
          <Link key={label} href={href} className="bg-card rounded-card border border-border-dim p-6 hover:shadow-md hover:border-brand/30 transition-all shadow-card relative group">
            {badge && (
              <span className="absolute top-4 right-4 w-5 h-5 bg-caution text-white text-3xs font-bold rounded-full flex items-center justify-center shadow-card">{badge}</span>
            )}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-semibold tracking-tight text-ink">{value}</p>
            <p className="text-sm text-ink-sub font-medium mt-1">{label}</p>
            <p className="text-2xs text-ink-dim mt-1 font-medium">{sub}</p>
          </Link>
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
                <div className="bg-card rounded-card border border-border-dim p-5 sm:p-8 shadow-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-brand-muted rounded-card flex items-center justify-center shrink-0">
                      <Inbox className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-ink">{t.providerDashboard.emptyLeadsTitle}</p>
                      <p className="text-xs text-ink-sub mt-0.5">{t.providerDashboard.emptyLeadsDesc}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {completenessSteps.map(({ done, label }) => (
                      <div key={label} className="flex items-center gap-2.5 text-xs">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${done ? 'text-brand' : 'text-ink-dim/30'}`} />
                        <span className={done ? 'text-ink-sub line-through' : 'text-ink font-medium'}>{label}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/provider/settings" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-dark transition-colors">
                    {t.providerDashboard.completeYourProfile} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="bg-card rounded-card border border-dashed border-border-dim p-5 sm:p-8 shadow-card text-center">
                  <div className="w-10 h-10 bg-surface-alt rounded-card flex items-center justify-center mx-auto mb-3">
                    <Inbox className="w-4 h-4 text-ink-dim" />
                  </div>
                  <p className="font-semibold text-sm text-ink mb-1">{t.providerDashboard.noLeadsTitle}</p>
                  <p className="text-xs text-ink-sub mb-4 max-w-xs mx-auto">{t.providerDashboard.noLeadsDesc}</p>
                  <Link href="/provider/leads" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-dark transition-colors">
                    {t.providerDashboard.browseLeads} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
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
              <div className="bg-card rounded-card border border-border-dim p-5 sm:p-8 shadow-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-surface-alt rounded-card flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 text-ink-dim" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-ink">{t.providerDashboard.emptyJobsTitle}</p>
                    <p className="text-xs text-ink-sub mt-0.5">{t.providerDashboard.emptyJobsDesc}</p>
                  </div>
                </div>
                <Link href="/provider/leads" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-dark transition-colors mt-2">
                  {t.providerDashboard.browseAvailableLeads} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-4">
                {activeJobs.slice(0, 2).map((b: any) => (
                  <Link key={b.id} href={`/provider/jobs/${b.id}`}
                    className="flex items-center gap-3 sm:gap-4 bg-card rounded-card border border-border-dim p-3.5 sm:p-5 hover:border-brand/30 hover:shadow-md transition-all shadow-card">
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

        {/* ── Right column (desktop only) ── */}
        <div className="hidden lg:block space-y-5">
          {/* Quick actions */}
          <div className="bg-card border border-border-dim rounded-panel p-5 shadow-card">
            <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-4">{t.providerDashboard.quickActions}</p>
            <div className="space-y-1">
              {[
                { label: t.providerDashboard.browseLeads,    href: '/provider/leads',       icon: Inbox },
                { label: t.providerDashboard.manageSettings, href: '/provider/settings',    icon: Calendar },
                { label: t.providerDashboard.viewEarnings,   href: '/provider/earnings',    icon: DollarSign },
                { label: t.mobileNav.stats,                  href: '/provider/performance', icon: TrendingUp },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-input text-sm font-medium text-ink-sub hover:text-ink hover:bg-surface-alt transition-all">
                  <div className="w-7 h-7 bg-brand-muted rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-brand" />
                  </div>
                  {label}
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-ink-dim" />
                </Link>
              ))}
            </div>
          </div>

          {/* Verification card */}
          <div className="bg-card border border-border-dim rounded-panel p-5 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-muted rounded-input flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="font-bold text-sm">{t.providerNav.verification}</p>
                <p className="text-xs text-ink-dim">{tierLabel}</p>
              </div>
            </div>
            <div className="w-full bg-surface-alt rounded-full h-1.5 mb-3">
              <div className="bg-brand h-1.5 rounded-full transition-all" style={{ width: `${verificationProgress}%` }} />
            </div>
            <Link href="/provider/onboarding" className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
              {verificationProgress < 100 ? t.providerDashboard.completeVerification : t.providerDashboard.manageVerification} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Rating */}
          <div className="bg-card border border-border-dim rounded-panel p-5 shadow-card">
            <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-3">{t.providerDashboard.yourRating}</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold tracking-tight">
                {profile?.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : '—'}
              </span>
              <Star className="w-6 h-6 text-brand fill-brand mb-1" />
            </div>
            <p className="text-xs text-ink-dim">{profile?.completedJobs ?? completedJobs.length} {t.providerDashboard.completedJobsSuffix}</p>
            <Link href="/provider/performance" className="text-xs font-bold text-ink hover:underline flex items-center gap-1 mt-3">
              {t.providerDashboard.fullPerformance} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mobile: Business Health ── */}
      <div className="lg:hidden mt-4">
        <div className="bg-card rounded-card border border-border-dim shadow-card overflow-hidden">
          {/* Verification + Rating in one row */}
          <div className="grid grid-cols-2 divide-x divide-border-dim">
            <div className="p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest">{t.providerNav.verification}</p>
              </div>
              <p className="text-sm font-semibold text-ink mb-2">{tierLabel}</p>
              <div className="w-full bg-surface-alt rounded-full h-1">
                <div className="bg-brand h-1 rounded-full transition-all" style={{ width: `${verificationProgress}%` }} />
              </div>
            </div>
            <div className="p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Star className="w-3.5 h-3.5 text-brand" />
                <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest">{t.providerProfile.rating}</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-bold text-ink leading-none">{profile?.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : '—'}</p>
                {profile?.ratingAvg > 0 && <Star className="w-3 h-3 text-brand fill-brand" />}
              </div>
              <p className="text-3xs text-ink-dim mt-1">{completedJobs.length} {t.providerDashboard.jobsDoneSuffix}</p>
            </div>
          </div>
          {/* CTA row */}
          <Link href="/provider/performance" className="border-t border-border-dim flex items-center justify-between px-3.5 py-2.5 group hover:bg-surface-alt/50 transition-colors">
            <span className="text-xs font-semibold text-brand">{t.providerDashboard.viewFullPerformance}</span>
            <ChevronRight className="w-3.5 h-3.5 text-brand group-hover:translate-x-0.5 transition-transform" />
          </Link>
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
    <div className={`rounded-card border transition-all hover:shadow-md ${
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
          className={`w-full sm:w-auto shrink-0 px-4 sm:px-5 py-2.5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shadow-card hover:shadow-md text-center ${
            urgent
              ? 'bg-caution text-white hover:bg-caution/90'
              : 'bg-brand text-white hover:bg-brand-dark'
          }`}
        >
          {t.providerDashboard.respond}
        </Link>
      </div>
    </div>
  );
}
