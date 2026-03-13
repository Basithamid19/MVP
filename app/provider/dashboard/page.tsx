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
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
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

  const stats = [
    {
      label: 'New Leads',
      value: leads.length,
      sub: leads.length > 0 ? `${freshLeads.length} new today` : 'None yet',
      icon: Inbox,
      color: 'bg-blue-50 text-blue-600',
      href: '/provider/leads',
      badge: urgentLeads.length > 0 ? urgentLeads.length : null,
    },
    {
      label: 'Active Jobs',
      value: activeJobs.length,
      sub: activeJobs.length > 0 ? `${activeJobs.filter((b: any) => b.status === 'IN_PROGRESS').length} in progress` : 'None scheduled',
      icon: Briefcase,
      color: 'bg-orange-50 text-orange-600',
      href: '/provider/jobs',
      badge: null,
    },
    {
      label: 'Completed',
      value: completedJobs.length,
      sub: 'All time',
      icon: CheckCircle2,
      color: 'bg-green-50 text-green-600',
      href: '/provider/jobs',
      badge: null,
    },
    {
      label: 'Earnings',
      value: `€${totalEarnings.toFixed(0)}`,
      sub: 'This month',
      icon: DollarSign,
      color: 'bg-purple-50 text-purple-600',
      href: '/provider/earnings',
      badge: null,
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">

      {/* Response timer banner — shown when there are fresh unresponded leads */}
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

      {/* Verification banner — shown when not verified */}
      {!isVerified && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-blue-800">Complete verification to receive more leads</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Verified providers get up to 3× more visibility in search results.
            </p>
          </div>
          <Link
            href="/provider/onboarding"
            className="shrink-0 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
          >
            Get Verified
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center text-base font-bold shrink-0 select-none">
            {getInitials(session?.user?.name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Sveiki, {firstName}!
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                profile?.verificationTier === 'TIER2_TRADE_VERIFIED' || profile?.verificationTier === 'TIER3_ENHANCED'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                <ShieldCheck className="w-3 h-3" />
                {profile?.verificationTier?.replace(/_/g, ' ') ?? 'Basic'}
              </span>
              {profile?.ratingAvg > 0 && (
                <span className="flex items-center gap-1 text-sm font-semibold text-gray-600">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  {profile.ratingAvg.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          href="/provider/leads"
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all"
        >
          View Leads <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, sub, icon: Icon, color, href, badge }) => (
          <Link key={label} href={href} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-black transition-all shadow-sm relative group">
            {badge && (
              <span className="absolute top-3 right-3 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{badge}</span>
            )}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">{sub}</p>
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
                  <LeadCard key={lead.id} lead={lead} urgent />
                ))}
              </div>
            </section>
          )}

          {/* Recent leads */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold">Recent Leads</h2>
              <Link href="/provider/leads" className="text-xs font-bold text-black border-b border-black pb-0.5 hover:opacity-70">
                View all
              </Link>
            </div>
            {leads.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <Inbox className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="font-bold text-sm mb-1">No leads yet</p>
                <p className="text-xs text-gray-400">New service requests in your area will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.slice(0, 4).map((lead: any) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            )}
          </section>

          {/* Active jobs */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold">Active Jobs</h2>
              <Link href="/provider/jobs" className="text-xs font-bold text-black border-b border-black pb-0.5 hover:opacity-70">
                View all
              </Link>
            </div>
            {activeJobs.length === 0 ? (
              <p className="text-sm text-gray-400">No active jobs right now.</p>
            ) : (
              <div className="space-y-3">
                {activeJobs.slice(0, 2).map((b: any) => (
                  <Link key={b.id} href={`/provider/jobs/${b.id}`} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:border-black transition-all">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${b.status === 'IN_PROGRESS' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{b.quote?.request?.category?.name ?? 'Job'}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="font-bold text-sm">€{b.totalAmount?.toFixed(2)}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick actions */}
          <div className="bg-black text-white rounded-3xl p-6">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Browse Leads',    href: '/provider/leads',       icon: Inbox },
                { label: 'Manage Schedule', href: '/provider/settings',    icon: Calendar },
                { label: 'View Earnings',   href: '/provider/earnings',    icon: DollarSign },
                { label: 'Performance',     href: '/provider/performance', icon: TrendingUp },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-all">
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Verification card (detail) */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-sm">Verification</p>
                <p className="text-xs text-gray-400">{profile?.verificationTier?.replace(/_/g, ' ') ?? 'Basic'}</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${verificationProgress}%` }}
              />
            </div>
            <Link href="/provider/onboarding" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              Complete verification <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Rating */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Your Rating</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold tracking-tight">
                {profile?.ratingAvg > 0 ? profile.ratingAvg.toFixed(1) : '—'}
              </span>
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 mb-1" />
            </div>
            <p className="text-xs text-gray-400">{profile?.completedJobs ?? 0} completed jobs</p>
            <Link href="/provider/performance" className="text-xs font-bold text-black hover:underline flex items-center gap-1 mt-3">
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
    <div className={`rounded-2xl border p-4 transition-all hover:shadow-sm ${
      urgent
        ? 'bg-orange-50 border-orange-200 hover:border-orange-400'
        : 'bg-white border-gray-100 hover:border-black'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Category + urgent badge */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              urgent ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {lead.category?.name}
            </span>
            {lead.isUrgent && (
              <span className="flex items-center gap-0.5 text-xs font-bold text-orange-600">
                <Zap className="w-3 h-3" /> Urgent
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm font-semibold text-gray-800 line-clamp-1 mb-2">{lead.description}</p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {lead.address && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                {lead.address}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              Posted {ageLabel}
            </span>
            {responders > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-orange-600">
                <Users className="w-3 h-3" />
                {responders} provider{responders > 1 ? 's' : ''} responded
              </span>
            )}
          </div>

          {/* Budget */}
          {hasBudget && (
            <p className="text-xs font-bold text-green-700 mt-2">
              💰 Budget ~€{lead.budget}
            </p>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/provider/quote/${lead.id}`}
          className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            urgent
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          Respond Now
        </Link>
      </div>
    </div>
  );
}
