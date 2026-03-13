'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, Clock, CheckCircle2, Loader2, ArrowRight,
  Inbox, Briefcase, DollarSign, AlertCircle, ChevronRight,
  TrendingUp, ShieldCheck, Calendar,
} from 'lucide-react';

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
    return <div className="flex-1 flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>;
  }
  if (!data) return null;

  const { profile, leads, bookings } = data;
  const activeJobs = bookings.filter((b: any) => b.status === 'SCHEDULED' || b.status === 'IN_PROGRESS');
  const completedJobs = bookings.filter((b: any) => b.status === 'COMPLETED');
  const urgentLeads = leads.filter((l: any) => l.isUrgent);
  const totalEarnings = completedJobs.reduce((s: number, b: any) => s + (b.totalAmount ?? 0) * 0.88, 0);

  const stats = [
    { label: 'New Leads', value: leads.length, icon: Inbox, color: 'bg-blue-50 text-blue-600', href: '/provider/leads', badge: urgentLeads.length > 0 ? urgentLeads.length : null },
    { label: 'Active Jobs', value: activeJobs.length, icon: Briefcase, color: 'bg-orange-50 text-orange-600', href: '/provider/jobs', badge: null },
    { label: 'Completed', value: completedJobs.length, icon: CheckCircle2, color: 'bg-green-50 text-green-600', href: '/provider/jobs', badge: null },
    { label: 'Earnings', value: `€${totalEarnings.toFixed(0)}`, icon: DollarSign, color: 'bg-purple-50 text-purple-600', href: '/provider/earnings', badge: null },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            Sveiki, {session?.user?.name?.split(' ')[0]}!
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              profile?.verificationTier === 'TIER2_TRADE_VERIFIED' || profile?.verificationTier === 'TIER3_ENHANCED'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-gray-100 text-gray-500'
            }`}>
              <ShieldCheck className="w-3 h-3" />
              {profile?.verificationTier?.replace('_', ' ') ?? 'Basic'}
            </span>
            {profile?.ratingAvg > 0 && (
              <span className="flex items-center gap-1 text-sm font-semibold text-gray-600">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                {profile.ratingAvg.toFixed(1)}
              </span>
            )}
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
        {stats.map(({ label, value, icon: Icon, color, href, badge }) => (
          <Link key={label} href={href} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-black transition-all shadow-sm relative">
            {badge && (
              <span className="absolute top-3 right-3 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{badge}</span>
            )}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Urgent leads */}
        <div className="lg:col-span-2 space-y-5">
          {urgentLeads.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <h2 className="font-bold text-sm uppercase tracking-widest text-orange-600">{urgentLeads.length} Urgent Lead{urgentLeads.length > 1 ? 's' : ''}</h2>
              </div>
              <div className="space-y-3">
                {urgentLeads.slice(0, 2).map((lead: any) => (
                  <div key={lead.id} className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{lead.category?.name}</p>
                      <p className="text-xs text-gray-600 truncate mt-0.5">{lead.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{lead.address}</p>
                    </div>
                    <Link href={`/provider/quote/${lead.id}`} className="shrink-0 bg-orange-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors">
                      Quote
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent leads */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold">Recent Leads</h2>
              <Link href="/provider/leads" className="text-xs font-bold text-black border-b border-black pb-0.5 hover:opacity-70">View all</Link>
            </div>
            {leads.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <Inbox className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="font-bold text-sm mb-1">No leads yet</p>
                <p className="text-xs text-gray-400">New service requests in your area will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.slice(0, 3).map((lead: any) => {
                  const age = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 60000);
                  const ageLabel = age < 60 ? `${age}m ago` : `${Math.floor(age / 60)}h ago`;
                  return (
                    <div key={lead.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start justify-between gap-3 hover:border-black transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{lead.category?.name}</span>
                          {lead.isUrgent && <span className="text-xs font-bold text-orange-600">⚡ Urgent</span>}
                          <span className="text-xs text-gray-400 ml-auto">{ageLabel}</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-1">{lead.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{lead.address}</p>
                      </div>
                      <Link href={`/provider/quote/${lead.id}`} className="shrink-0 border border-black text-black px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-black hover:text-white transition-all">
                        Quote
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Active jobs */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold">Active Jobs</h2>
              <Link href="/provider/jobs" className="text-xs font-bold text-black border-b border-black pb-0.5 hover:opacity-70">View all</Link>
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
                { label: 'Browse Leads', href: '/provider/leads', icon: Inbox },
                { label: 'Manage Schedule', href: '/provider/settings', icon: Calendar },
                { label: 'View Earnings', href: '/provider/earnings', icon: DollarSign },
                { label: 'Performance', href: '/provider/performance', icon: TrendingUp },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-semibold transition-all">
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Verification card */}
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
              <div className="bg-blue-500 h-1.5 rounded-full" style={{
                width: profile?.verificationTier === 'TIER3_ENHANCED' ? '100%' :
                       profile?.verificationTier === 'TIER2_TRADE_VERIFIED' ? '75%' :
                       profile?.verificationTier === 'TIER1_ID_VERIFIED' ? '50%' : '25%'
              }} />
            </div>
            <Link href="/provider/onboarding" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
              Complete verification <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Rating */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Your Rating</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-bold tracking-tight">{profile?.ratingAvg?.toFixed(1) ?? '—'}</span>
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
