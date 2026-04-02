'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, CheckCircle2, Loader2, ArrowRight,
  Inbox, Briefcase, DollarSign, AlertCircle, ChevronRight,
  TrendingUp, ShieldCheck, Calendar, MapPin, Clock, Users,
  Zap, Timer,
} from 'lucide-react';

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

function getAgeLabel(createdAt: string) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function ProviderDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'PROVIDER') { router.push('/dashboard'); return; }
      Promise.all([
        fetch('/api/provider/profile').then(r => r.json()),
        fetch('/api/provider/leads').then(r => r.json()),
        fetch('/api/bookings').then(r => r.json()),
      ]).then(([profile, leads, bookings]) => {
        setData({ profile, leads: Array.isArray(leads) ? leads : [], bookings: Array.isArray(bookings) ? bookings : [] });
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [status, session, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
      </div>
    );
  }
  if (!data) return null;

  const { profile, leads, bookings } = data;
  const firstName = capitalize(session?.user?.name?.split(' ')[0]);
  const activeJobs = bookings.filter((b: any) => b.status === 'SCHEDULED' || b.status === 'IN_PROGRESS');
  const completedJobs = bookings.filter((b: any) => b.status === 'COMPLETED');
  const urgentLeads = leads.filter((l: any) => l.isUrgent);
  const totalEarnings = completedJobs.reduce((s: number, b: any) => s + (b.totalAmount ?? 0) * 0.88, 0);

  const isVerified = profile?.verificationTier && profile.verificationTier !== 'TIER0_BASIC';

  // Profile completeness
  const hasAvatar = !!session?.user?.image;
  const hasBio = (profile?.bio ?? '').trim().length >= 50;
  const hasArea = (profile?.serviceArea ?? '').trim().length > 0;
  const hasCategories = (profile?.categories ?? []).length > 0;
  const hasOfferings = (profile?.offerings ?? []).length > 0;
  const completenessSteps = [
    { done: hasAvatar, label: 'Add a profile photo' },
    { done: hasBio, label: 'Write a bio (50+ chars)' },
    { done: hasArea, label: 'Set your service area' },
    { done: hasCategories, label: 'Choose service categories' },
    { done: hasOfferings, label: 'Add service offerings' },
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
    ? `View ${freshLeads.length} New Lead${freshLeads.length > 1 ? 's' : ''}`
    : leads.length > 0 ? 'View Leads' : 'Browse Leads';

  const stats = [
    {
      label: 'New Leads',
      value: leads.length,
      sub: leads.length > 0 ? `${freshLeads.length} new today` : 'None yet',
      icon: Inbox,
      color: 'bg-brand-muted text-brand',
      href: '/provider/leads',
      badge: urgentLeads.length > 0 ? urgentLeads.length : null,
    },
    {
      label: 'Active Jobs',
      value: activeJobs.length,
      sub: activeJobs.length > 0 ? `${activeJobs.filter((b: any) => b.status === 'IN_PROGRESS').length} in progress` : 'None scheduled',
      icon: Briefcase,
      color: 'bg-brand-muted text-brand',
      href: '/provider/jobs',
      badge: null,
    },
    {
      label: 'Completed',
      value: completedJobs.length,
      sub: 'All time',
      icon: CheckCircle2,
      color: 'bg-brand-muted text-brand',
      href: '/provider/jobs',
      badge: null,
    },
    {
      label: 'Earnings',
      value: `€${totalEarnings.toFixed(0)}`,
      sub: 'Net earned',
      icon: DollarSign,
      color: 'bg-brand-muted text-brand',
      href: '/provider/earnings',
      badge: null,
    },
  ];

  const tierLabel = profile?.verificationTier === 'TIER3_ENHANCED' ? 'Enhanced'
    : profile?.verificationTier === 'TIER2_TRADE_VERIFIED' ? 'Trade Verified'
    : profile?.verificationTier === 'TIER1_ID_VERIFIED' ? 'ID Verified'
    : 'Basic';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">

      {/* ── Mobile: Hero / Business Summary ── */}
      <div className="sm:hidden mb-4">
        {/* Identity + CTA */}
        <div className="bg-brand rounded-2xl p-4 shadow-md text-white mb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-bold shrink-0 select-none">
              {session?.user?.image
                ? <img src={session.user.image} alt="" className="w-full h-full rounded-full object-cover" />
                : getInitials(session?.user?.name)
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold tracking-tight truncate">Hello, {firstName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/60">
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
            className="flex items-center justify-center gap-2 w-full bg-white text-brand py-2.5 rounded-xl text-sm font-semibold hover:bg-white/90 transition-all"
          >
            {ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Fresh leads alert */}
        {freshLeads.length > 0 && (
          <div className="flex items-center gap-2.5 bg-caution-surface border border-caution-edge rounded-xl px-3 py-2.5 mb-3">
            <Timer className="w-4 h-4 text-caution shrink-0" />
            <p className="text-xs text-caution flex-1">
              <span className="font-bold">{freshLeads.length} fresh lead{freshLeads.length > 1 ? 's' : ''}</span> — respond within 15 min for 40% better odds
            </p>
            <Link href="/provider/leads" className="text-[10px] font-bold text-caution uppercase tracking-wide shrink-0">Go</Link>
          </div>
        )}

        {/* Verification nudge — compact, only if not verified */}
        {!isVerified && (
          <Link href="/provider/onboarding" className="flex items-center gap-2.5 bg-brand-muted rounded-xl px-3 py-2.5 mb-3 group">
            <ShieldCheck className="w-4 h-4 text-brand shrink-0" />
            <p className="text-xs text-brand flex-1">
              <span className="font-bold">Complete verification</span> — get up to 3× more visibility
            </p>
            <ChevronRight className="w-3.5 h-3.5 text-brand shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* Profile completeness nudge */}
        {completePct < 100 && (
          <Link href="/provider/settings" className="flex items-center gap-2.5 bg-surface-alt border border-border-dim rounded-xl px-3 py-2.5 mb-3 group">
            <div className="relative w-8 h-8 shrink-0">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" className="text-border-dim" strokeWidth="3" />
                <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" className="text-brand" strokeWidth="3"
                  strokeDasharray={`${completePct * 0.8168} 81.68`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-brand">{completePct}%</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-ink">Profile {completePct}% complete</p>
              {nextStep && <p className="text-[10px] text-ink-sub mt-0.5">Next: {nextStep.label}</p>}
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-ink-dim shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* ── Desktop: Original header ── */}
      <div className="hidden sm:block">
        {/* Response timer banner */}
        {freshLeads.length > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Timer className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800">
                {freshLeads.length} fresh lead{freshLeads.length > 1 ? 's' : ''} waiting
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Responding within 15 minutes increases your chance of winning the job by 40%.
              </p>
            </div>
            <Link
              href="/provider/leads"
              className="shrink-0 bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors"
            >
              Respond Now
            </Link>
          </div>
        )}

        {/* Verification banner */}
        {!isVerified && (
          <div className="mb-6 bg-brand-muted border border-brand/20 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/60 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-brand">Complete verification to receive more leads</p>
              <p className="text-xs text-brand/70 mt-0.5">
                Verified providers get up to 3× more visibility in search results.
              </p>
            </div>
            <Link
              href="/provider/onboarding"
              className="shrink-0 bg-brand text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-dark transition-colors"
            >
              Get Verified
            </Link>
          </div>
        )}

        {/* Profile completeness banner */}
        {completePct < 100 && (
          <div className="mb-6 bg-surface-alt border border-border-dim rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="relative w-10 h-10 shrink-0">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" className="text-border-dim" strokeWidth="3" />
                <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" className="text-brand" strokeWidth="3"
                  strokeDasharray={`${completePct * 1.005} 100.5`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-brand">{completePct}%</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink">Your profile is {completePct}% complete</p>
              <p className="text-xs text-ink-sub mt-0.5">
                {nextStep ? `Next step: ${nextStep.label}` : 'Almost there!'} — complete profiles attract more customers.
              </p>
            </div>
            <Link
              href="/provider/settings"
              className="shrink-0 bg-brand text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-dark transition-colors"
            >
              Complete Profile
            </Link>
          </div>
        )}

        {/* Desktop greeting */}
        <div className="flex items-start justify-between gap-6 mb-8 sm:mb-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-brand text-white flex items-center justify-center text-xl font-semibold shrink-0 select-none shadow-sm">
              {getInitials(session?.user?.name)}
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-ink">
                Hello, {firstName}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
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
            className="flex items-center gap-2 bg-brand text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-brand-dark transition-all shadow-sm hover:shadow-md"
          >
            {ctaLabel} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── Mobile: KPI strip ── */}
      <div className="sm:hidden grid grid-cols-4 gap-1.5 mb-4">
        {stats.map(({ label, value, icon: Icon, href, badge }) => (
          <Link key={label} href={href} className="relative bg-white rounded-xl border border-border-dim p-2.5 text-center shadow-sm hover:shadow-md transition-all">
            {badge && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-caution text-white text-[8px] font-bold rounded-full flex items-center justify-center">{badge}</span>
            )}
            <div className="w-7 h-7 bg-brand-muted rounded-lg flex items-center justify-center mx-auto mb-1.5">
              <Icon className="w-3.5 h-3.5 text-brand" />
            </div>
            <p className="text-lg font-bold tracking-tight text-ink leading-none">{value}</p>
            <p className="text-[9px] font-medium text-ink-dim mt-1 uppercase tracking-wide">{label}</p>
          </Link>
        ))}
      </div>

      {/* ── Desktop: KPI cards grid ── */}
      <div className="hidden sm:grid lg:grid-cols-4 sm:grid-cols-2 gap-6 mb-10">
        {stats.map(({ label, value, sub, icon: Icon, color, href, badge }) => (
          <Link key={label} href={href} className="bg-white rounded-2xl border border-border-dim p-6 hover:shadow-md hover:border-brand/30 transition-all shadow-sm relative group">
            {badge && (
              <span className="absolute top-4 right-4 w-5 h-5 bg-caution text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">{badge}</span>
            )}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-3xl font-semibold tracking-tight text-ink">{value}</p>
            <p className="text-sm text-ink-sub font-medium mt-1">{label}</p>
            <p className="text-[11px] text-ink-dim mt-1 font-medium">{sub}</p>
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
                  {urgentLeads.length} Urgent Lead{urgentLeads.length > 1 ? 's' : ''}
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
              <h2 className="text-base sm:text-xl font-semibold text-ink">Recent Leads</h2>
              <Link href="/provider/leads" className="text-xs sm:text-sm font-semibold text-brand hover:text-brand-dark transition-colors">
                View all
              </Link>
            </div>
            {leads.length === 0 ? (
              <div className="bg-white rounded-2xl border border-border-dim p-6 sm:p-12 text-center shadow-sm">
                <div className="w-10 h-10 sm:w-16 sm:h-16 bg-brand-muted rounded-2xl sm:rounded-full flex items-center justify-center mx-auto mb-2.5 sm:mb-4">
                  <Inbox className="w-4 h-4 sm:w-6 sm:h-6 text-brand" />
                </div>
                <p className="font-semibold text-sm sm:text-base text-ink mb-1">No leads yet</p>
                <p className="text-xs sm:text-sm text-ink-sub max-w-[240px] mx-auto">New service requests matching your profile will appear here automatically.</p>
              </div>
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
              <h2 className="text-base sm:text-xl font-semibold text-ink">Active Jobs</h2>
              <Link href="/provider/jobs" className="text-xs sm:text-sm font-semibold text-brand hover:text-brand-dark transition-colors">
                View all
              </Link>
            </div>
            {activeJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-border-dim p-5 sm:p-8 text-center shadow-sm">
                <div className="w-10 h-10 bg-surface-alt rounded-2xl flex items-center justify-center mx-auto mb-2.5 sm:hidden">
                  <Briefcase className="w-4 h-4 text-ink-dim" />
                </div>
                <p className="text-sm font-medium text-ink-sub">No active jobs right now</p>
                <p className="text-xs text-ink-dim mt-0.5 sm:hidden">Accepted quotes will appear here as scheduled work.</p>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-4">
                {activeJobs.slice(0, 2).map((b: any) => (
                  <Link key={b.id} href={`/provider/jobs/${b.id}`}
                    className="flex items-center gap-3 sm:gap-4 bg-white rounded-2xl border border-border-dim p-3.5 sm:p-5 hover:border-brand/30 hover:shadow-md transition-all shadow-sm">
                    <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${b.status === 'IN_PROGRESS' ? 'bg-caution' : 'bg-info'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate text-ink">{b.quote?.request?.category?.name ?? 'Job'}</p>
                      <p className="text-xs sm:text-sm text-ink-sub flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
          <div className="bg-white border border-border-dim rounded-3xl p-5 shadow-sm">
            <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-4">Quick Actions</p>
            <div className="space-y-1">
              {[
                { label: 'Browse Leads',    href: '/provider/leads',       icon: Inbox },
                { label: 'Manage Settings', href: '/provider/settings',    icon: Calendar },
                { label: 'View Earnings',   href: '/provider/earnings',    icon: DollarSign },
                { label: 'Stats',           href: '/provider/performance', icon: TrendingUp },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-sub hover:text-ink hover:bg-surface-alt transition-all">
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
          <div className="bg-white border border-border-dim rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-muted rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="font-bold text-sm">Verification</p>
                <p className="text-xs text-ink-dim">{tierLabel}</p>
              </div>
            </div>
            <div className="w-full bg-surface-alt rounded-full h-1.5 mb-3">
              <div className="bg-brand h-1.5 rounded-full transition-all" style={{ width: `${verificationProgress}%` }} />
            </div>
            <Link href="/provider/onboarding" className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
              {verificationProgress < 100 ? 'Complete verification' : 'Manage verification'} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Rating */}
          <div className="bg-white border border-border-dim rounded-3xl p-5 shadow-sm">
            <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-3">Your Rating</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold tracking-tight">
                {profile?.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : '—'}
              </span>
              <Star className="w-6 h-6 text-brand fill-brand mb-1" />
            </div>
            <p className="text-xs text-ink-dim">{profile?.completedJobs ?? completedJobs.length} completed jobs</p>
            <Link href="/provider/performance" className="text-xs font-bold text-ink hover:underline flex items-center gap-1 mt-3">
              Full performance <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mobile: Business Health ── */}
      <div className="lg:hidden mt-4">
        <div className="bg-white rounded-2xl border border-border-dim shadow-sm overflow-hidden">
          {/* Verification + Rating in one row */}
          <div className="grid grid-cols-2 divide-x divide-border-dim">
            <div className="p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest">Verification</p>
              </div>
              <p className="text-sm font-semibold text-ink mb-2">{tierLabel}</p>
              <div className="w-full bg-surface-alt rounded-full h-1">
                <div className="bg-brand h-1 rounded-full transition-all" style={{ width: `${verificationProgress}%` }} />
              </div>
            </div>
            <div className="p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Star className="w-3.5 h-3.5 text-brand" />
                <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest">Rating</p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-bold text-ink leading-none">{profile?.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : '—'}</p>
                {profile?.ratingAvg > 0 && <Star className="w-3 h-3 text-brand fill-brand" />}
              </div>
              <p className="text-[10px] text-ink-dim mt-1">{completedJobs.length} jobs done</p>
            </div>
          </div>
          {/* CTA row */}
          <Link href="/provider/performance" className="border-t border-border-dim flex items-center justify-between px-3.5 py-2.5 group hover:bg-surface-alt/50 transition-colors">
            <span className="text-xs font-semibold text-brand">View full performance</span>
            <ChevronRight className="w-3.5 h-3.5 text-brand group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Lead Card Component ─── */
function LeadCard({ lead, urgent }: { lead: any; urgent?: boolean }) {
  const ageLabel = getAgeLabel(lead.createdAt);
  const responders = lead.quotes?.length ?? 0;
  const hasBudget = lead.budget != null && lead.budget > 0;

  return (
    <div className={`rounded-2xl border transition-all hover:shadow-md ${
      urgent
        ? 'bg-caution-surface border-caution/30 hover:border-caution/50 p-3.5 sm:p-5'
        : 'bg-white border-border-dim hover:border-brand/30 shadow-sm p-3.5 sm:p-5'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          {/* Category + urgent badge */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5 sm:mb-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 uppercase tracking-widest rounded-full ${
              urgent ? 'bg-caution text-white' : 'bg-surface-alt text-ink-sub'
            }`}>
              {lead.category?.name}
            </span>
            {lead.isUrgent && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-caution">
                <Zap className="w-3 h-3" /> Urgent
              </span>
            )}
            <span className="text-[10px] text-ink-dim ml-auto sm:ml-0">{ageLabel}</span>
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
                {responders} quote{responders > 1 ? 's' : ''}
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
          className={`w-full sm:w-auto shrink-0 px-4 sm:px-5 py-2.5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shadow-sm hover:shadow-md text-center ${
            urgent
              ? 'bg-caution text-white hover:bg-caution/90'
              : 'bg-brand text-white hover:bg-brand-dark'
          }`}
        >
          Respond
        </Link>
      </div>
    </div>
  );
}
