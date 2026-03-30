'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, CheckCircle2, Loader2, ArrowRight,
  Inbox, Briefcase, DollarSign, AlertCircle, ChevronRight,
  TrendingUp, ShieldCheck, Calendar, MapPin, Clock, Users,
  Zap, Timer, Settings,
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
  const verificationProgress =
    profile?.verificationTier === 'TIER3_ENHANCED' ? 100 :
    profile?.verificationTier === 'TIER2_TRADE_VERIFIED' ? 75 :
    profile?.verificationTier === 'TIER1_ID_VERIFIED' ? 50 : 25;

  // Most recently added leads (within last 2h)
  const freshLeads = leads.filter((l: any) => {
    const age = (Date.now() - new Date(l.createdAt).getTime()) / 60000;
    return age <= 120;
  });

  // State-aware CTA label
  const ctaLabel = freshLeads.length > 0
    ? `View ${freshLeads.length} New Lead${freshLeads.length > 1 ? 's' : ''}`
    : leads.length > 0
      ? 'View Leads'
      : 'Browse Leads';

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
      sub: 'This month',
      icon: DollarSign,
      color: 'bg-brand-muted text-brand',
      href: '/provider/earnings',
      badge: null,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">

      {/* Response timer banner — shown when there are fresh unresponded leads */}
      {freshLeads.length > 0 && (
        <div className="mb-5 sm:mb-6 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Timer className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-800">
              {freshLeads.length} fresh lead{freshLeads.length > 1 ? 's' : ''} waiting
            </p>
            <p className="text-xs text-amber-600 mt-0.5 hidden sm:block">
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

      {/* Verification banner — desktop only (mobile shows in Business Health) */}
      {!isVerified && (
        <div className="hidden sm:flex mb-6 bg-brand-muted border border-brand/20 rounded-2xl px-4 py-3 items-center gap-3">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6 mb-6 sm:mb-10">
        <div className="flex items-center gap-3.5 sm:gap-5">
          {/* Avatar */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-brand text-white flex items-center justify-center text-base sm:text-xl font-semibold shrink-0 select-none shadow-sm">
            {getInitials(session?.user?.name)}
          </div>
          <div>
            <h1 className="text-xl sm:text-4xl font-semibold tracking-tight text-ink">
              Hello, {firstName}
            </h1>
            <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2">
              <span className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                profile?.verificationTier === 'TIER2_TRADE_VERIFIED' || profile?.verificationTier === 'TIER3_ENHANCED'
                  ? 'bg-brand-muted text-brand'
                  : 'bg-surface-alt text-ink-dim'
              }`}>
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {profile?.verificationTier?.replace(/_/g, ' ') ?? 'Basic'}
              </span>
              {profile?.ratingAvg > 0 && (
                <span className="flex items-center gap-1 text-sm font-medium text-ink-sub">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand fill-brand" />
                  {profile.ratingAvg.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          href="/provider/leads"
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand text-white px-6 py-3.5 sm:py-3.5 rounded-full text-sm font-semibold hover:bg-brand-dark transition-all shadow-sm hover:shadow-md"
        >
          {ctaLabel} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6 mb-6 sm:mb-10">
        {stats.map(({ label, value, sub, icon: Icon, color, href, badge }) => (
          <Link key={label} href={href} className="bg-white rounded-2xl border border-border-dim p-3.5 sm:p-6 hover:shadow-md hover:border-brand/30 transition-all shadow-sm relative group">
            {badge && (
              <span className="absolute top-3 right-3 sm:top-4 sm:right-4 w-5 h-5 bg-caution text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">{badge}</span>
            )}
            <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-4 ${color}`}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">{value}</p>
            <p className="text-xs sm:text-sm text-ink-sub font-medium mt-0.5 sm:mt-1">{label}</p>
            <p className="text-[11px] text-ink-dim mt-0.5 font-medium hidden sm:block">{sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left + center: Leads & Jobs */}
        <div className="lg:col-span-2 space-y-6">

          {/* Urgent leads */}
          {urgentLeads.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <h2 className="font-bold text-sm uppercase tracking-widest text-orange-600">
                  {urgentLeads.length} Urgent Lead{urgentLeads.length > 1 ? 's' : ''}
                </h2>
              </div>
              <div className="space-y-3">
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
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-ink">Recent Leads</h2>
              <Link href="/provider/leads" className="text-sm font-medium text-brand hover:text-brand-dark transition-colors">
                View all
              </Link>
            </div>
            {leads.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-border-dim p-6 sm:p-12 text-center">
                <div className="w-11 h-11 sm:w-16 sm:h-16 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Inbox className="w-5 h-5 sm:w-6 sm:h-6 text-ink-dim" />
                </div>
                <p className="font-semibold text-sm sm:text-base mb-1">No leads yet</p>
                <p className="text-sm text-ink-sub max-w-xs mx-auto">New service requests matching your skills will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {leads.slice(0, 4).map((lead: any) => (
                  <React.Fragment key={lead.id}>
                    <LeadCard lead={lead} />
                  </React.Fragment>
                ))}
              </div>
            )}
          </section>

          {/* Active jobs */}
          <section>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-ink">Active Jobs</h2>
              <Link href="/provider/jobs" className="text-sm font-medium text-brand hover:text-brand-dark transition-colors">
                View all
              </Link>
            </div>
            {activeJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-border-dim p-5 sm:p-8 text-center">
                <p className="text-sm text-ink-sub font-medium">No active jobs · Accepted quotes will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {activeJobs.slice(0, 2).map((b: any) => (
                  <Link key={b.id} href={`/provider/jobs/${b.id}`} className="flex items-center gap-3.5 sm:gap-4 bg-white rounded-2xl border border-border-dim p-4 sm:p-5 hover:border-brand/30 hover:shadow-md transition-all shadow-sm">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${b.status === 'IN_PROGRESS' ? 'bg-caution' : 'bg-info'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate text-ink">{b.quote?.request?.category?.name ?? 'Job'}</p>
                      <p className="text-xs sm:text-sm text-ink-sub flex items-center gap-1.5 mt-0.5 sm:mt-1">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="font-bold text-sm">€{b.totalAmount?.toFixed(2)}</span>
                    <ChevronRight className="w-4 h-4 text-ink-dim/50" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Business Health — mobile only */}
          <section className="lg:hidden">
            <h2 className="text-lg font-semibold text-ink mb-3">Business Health</h2>
            <div className="bg-white rounded-2xl border border-border-dim p-4 shadow-sm">
              {/* Verification row */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-muted rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-[18px] h-[18px] text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-semibold text-ink">Verification</p>
                    <p className="text-xs text-ink-dim">{verificationProgress}%</p>
                  </div>
                  <div className="w-full bg-surface-alt rounded-full h-1.5">
                    <div
                      className="bg-brand h-1.5 rounded-full transition-all"
                      style={{ width: `${verificationProgress}%` }}
                    />
                  </div>
                </div>
              </div>
              {verificationProgress < 100 && (
                <Link
                  href="/provider/onboarding"
                  className="block text-xs font-bold text-brand mt-3 ml-12"
                >
                  Complete verification to get more leads →
                </Link>
              )}

              {/* Divider */}
              <div className="border-t border-border-dim my-4" />

              {/* Rating + performance row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Star className="w-5 h-5 text-brand fill-yellow-500" />
                  <span className="text-2xl font-bold tracking-tight text-ink">
                    {profile?.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : '—'}
                  </span>
                  <span className="text-xs text-ink-dim">
                    · {completedJobs.length} jobs
                  </span>
                </div>
                <Link
                  href="/provider/performance"
                  className="text-xs font-bold text-brand flex items-center gap-0.5"
                >
                  Details <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Divider */}
              <div className="border-t border-border-dim my-4" />

              {/* Manage profile shortcut */}
              <Link
                href="/provider/settings"
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 bg-surface-alt rounded-xl flex items-center justify-center shrink-0">
                  <Settings className="w-[18px] h-[18px] text-ink-dim" />
                </div>
                <p className="text-sm font-medium text-ink-sub flex-1">Manage Profile</p>
                <ChevronRight className="w-4 h-4 text-ink-dim/40" />
              </Link>
            </div>
          </section>
        </div>

        {/* Right column — desktop only */}
        <div className="hidden lg:block space-y-5">
          {/* Verification card (detail) */}
          <div className="bg-white border border-border-dim rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-muted rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="font-bold text-sm">Verification</p>
                <p className="text-xs text-ink-dim">{profile?.verificationTier?.replace(/_/g, ' ') ?? 'Basic'}</p>
              </div>
            </div>
            <div className="w-full bg-surface-alt rounded-full h-1.5 mb-3">
              <div
                className="bg-brand h-1.5 rounded-full transition-all"
                style={{ width: `${verificationProgress}%` }}
              />
            </div>
            <Link href="/provider/onboarding" className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
              Complete verification <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Rating */}
          <div className="bg-white border border-border-dim rounded-3xl p-5 shadow-sm">
            <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-3">Your Rating</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold tracking-tight">
                {profile?.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : '—'}
              </span>
              <Star className="w-6 h-6 text-brand fill-yellow-500 mb-1" />
            </div>
            <p className="text-xs text-ink-dim">{profile?.completedJobs ?? 0} completed jobs</p>
            <Link href="/provider/performance" className="text-xs font-bold text-ink hover:underline flex items-center gap-1 mt-3">
              Full performance <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
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
    <div className={`rounded-2xl border p-3.5 sm:p-5 transition-all hover:shadow-md ${
      urgent
        ? 'bg-caution-surface border-caution/30 hover:border-caution/50'
        : 'bg-white border-border-dim hover:border-brand/30 shadow-sm'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          {/* Category + urgent badge */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5 sm:mb-2">
            <span className={`text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest rounded-full ${
              urgent ? 'bg-caution text-white' : 'bg-surface-alt text-ink-sub'
            }`}>
              {lead.category?.name}
            </span>
            {lead.isUrgent && (
              <span className="flex items-center gap-1 text-xs font-bold text-caution">
                <Zap className="w-3.5 h-3.5" /> Urgent
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm sm:text-base font-semibold text-ink line-clamp-1 mb-2 sm:mb-3">{lead.description}</p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1.5">
            {lead.address && (
              <span className="flex items-center gap-1 text-xs sm:text-sm text-ink-sub">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {lead.address}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs sm:text-sm text-ink-sub">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {ageLabel}
            </span>
            {responders > 0 && (
              <span className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-caution">
                <Users className="w-4 h-4" />
                {responders} provider{responders > 1 ? 's' : ''} responded
              </span>
            )}
          </div>

          {/* Budget */}
          {hasBudget && (
            <p className="text-sm font-semibold text-trust mt-2 sm:mt-3">
              💰 Budget ~€{lead.budget}
            </p>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/provider/quote/${lead.id}`}
          className={`w-full sm:w-auto shrink-0 px-5 py-2.5 sm:py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shadow-sm hover:shadow-md text-center ${
            urgent
              ? 'bg-caution text-white hover:bg-caution/90'
              : 'bg-brand text-white hover:bg-brand-dark'
          }`}
        >
          Respond Now
        </Link>
      </div>
    </div>
  );
}
