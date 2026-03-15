'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, MessageSquare, CheckCircle2,
  ChevronRight, Star, Loader2, LayoutDashboard,
  Search, LogOut, MapPin, ShieldCheck, Bell,
  Inbox, Plus, Users, Zap, ArrowRight, Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

const POPULAR_SERVICES = [
  { label: 'Plumber',     slug: 'plumber',     emoji: '🔧' },
  { label: 'Electrician', slug: 'electrician', emoji: '⚡' },
  { label: 'Cleaning',    slug: 'cleaning',    emoji: '🧹' },
  { label: 'Handyman',    slug: 'handyman',    emoji: '🔨' },
  { label: 'Moving Help', slug: 'moving-help', emoji: '📦' },
  { label: 'Painting',    slug: 'painting',    emoji: '🎨' },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
  NEW:      { label: 'Waiting for quotes',  color: 'bg-blue-50 text-blue-600' },
  CHATTING: { label: 'In discussion',       color: 'bg-purple-50 text-purple-600' },
  QUOTED:   { label: 'Quotes received',     color: 'bg-green-50 text-green-700' },
  ACCEPTED: { label: 'Accepted',            color: 'bg-green-50 text-green-700' },
  DECLINED: { label: 'Declined',            color: 'bg-gray-50 text-gray-400' },
  EXPIRED:  { label: 'Expired',             color: 'bg-gray-50 text-gray-400' },
};

function capitalize(s?: string | null) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getInitials(name?: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests]   = useState<any[]>([]);
  const [bookings, setBookings]   = useState<any[]>([]);
  const [topPros, setTopPros]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role === 'ADMIN')    { router.push('/admin/dashboard'); return; }
      if (role === 'PROVIDER') { router.push('/provider/dashboard'); return; }

      Promise.all([
        fetch('/api/requests').then(r => r.json()),
        fetch('/api/bookings').then(r => r.json()),
        fetch('/api/providers').then(r => r.json()),
      ]).then(([reqData, bookData, prosData]) => {
        setRequests(Array.isArray(reqData)  ? reqData  : []);
        setBookings(Array.isArray(bookData) ? bookData : []);
        setTopPros(Array.isArray(prosData)  ? prosData.slice(0, 3) : []);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [status, session, router]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }
  if (!session) return null;

  const firstName   = capitalize(session.user?.name?.split(' ')[0]);
  const upcoming    = bookings.filter(b => b.status === 'SCHEDULED');
  const completed   = bookings.filter(b => b.status === 'COMPLETED');
  const activeReqs  = requests.filter(r => r.status === 'NEW' || r.status === 'QUOTED' || r.status === 'CHATTING');
  const totalQuotes = requests.reduce((s: number, r: any) => s + (r.quotes?.length ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ── */}
      <aside className="w-16 lg:w-60 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen shrink-0">
        {/* Logo */}
        <div className="p-4 lg:p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-base tracking-tight hidden lg:block">VilniusPro</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 lg:px-3 py-4 space-y-5 overflow-y-auto">
          {/* Overview */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:block px-2 mb-1.5">Overview</p>
            <Link href="/dashboard" className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl font-semibold text-sm bg-black text-white">
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block">Dashboard</span>
            </Link>
          </div>

          {/* Discover */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:block px-2 mb-1.5">Discover</p>
            <Link href="/browse" className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:text-black hover:bg-gray-50 transition-all">
              <Search className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block">Find Pros</span>
            </Link>
          </div>

          {/* Account */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:block px-2 mb-1.5">Account</p>
            <Link href="/messages" className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl font-semibold text-sm text-gray-500 hover:text-black hover:bg-gray-50 transition-all">
              <MessageSquare className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block">Messages</span>
            </Link>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-2 lg:p-3 border-t border-gray-100">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="hidden lg:block">Log Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main wrapper ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-end gap-2 sticky top-0 z-10">
          <Link href="/messages" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors text-gray-500 hover:text-black">
            <MessageSquare className="w-5 h-5" />
          </Link>
          <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors text-gray-500 hover:text-black">
            <Bell className="w-5 h-5" />
            {totalQuotes > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white" />
            )}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">

            {/* ── Hero ── */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center text-base font-bold shrink-0 select-none">
                  {getInitials(session.user?.name)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Sveiki, {firstName}!</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Find, book, and manage trusted home service professionals.</p>
                </div>
              </div>
              <Link
                href="/requests/new"
                className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                Request a Service
              </Link>
            </div>

            {/* ── Activity banner ── */}
            {totalQuotes > 0 && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-800">
                    {totalQuotes} professional{totalQuotes > 1 ? 's have' : ' has'} responded to your requests
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">Review their quotes and book the best match.</p>
                </div>
                <Link href={`/requests/${requests.find((r: any) => r.quotes?.length > 0)?.id}`} className="shrink-0 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-colors">
                  Review Quotes
                </Link>
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              {/* ── Left / centre column ── */}
              <div className="lg:col-span-2 space-y-6">

                {/* Upcoming Bookings */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg">Upcoming Bookings</h2>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{upcoming.length} scheduled</span>
                  </div>

                  {upcoming.length > 0 ? (
                    <div className="space-y-3">
                      {upcoming.map(b => (
                        <div key={b.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-black transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-2xl overflow-hidden grayscale group-hover:grayscale-0 transition-all shrink-0">
                              <img
                                src={b.provider?.user?.image || `https://i.pravatar.cc/150?u=${b.id}`}
                                alt="Provider"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{b.provider?.user?.name ?? 'Professional'}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-400 font-medium mt-0.5">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">€{b.totalAmount?.toFixed(2)}</p>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider mt-1 inline-block">Scheduled</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="font-bold text-sm mb-1">No upcoming bookings yet</p>
                      <p className="text-xs text-gray-400 mb-4">Find trusted professionals and book your first service.</p>
                      <Link href="/browse" className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all">
                        <Search className="w-3.5 h-3.5" /> Find a Pro
                      </Link>
                    </div>
                  )}
                </section>

                {/* Recent Requests */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg">Recent Requests</h2>
                    {requests.length > 0 && (
                      <Link href="/requests" className="text-xs font-bold text-black border-b border-black pb-0.5 hover:opacity-70">View all</Link>
                    )}
                  </div>

                  {requests.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Inbox className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="font-bold text-sm mb-1">No service requests yet</p>
                      <p className="text-xs text-gray-400 mb-4">Post a job and get quotes from verified local professionals.</p>
                      <Link href="/requests/new" className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all">
                        <Plus className="w-3.5 h-3.5" /> Request a Service
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {requests.slice(0, 4).map(req => {
                        const meta = STATUS_META[req.status] ?? { label: req.status, color: 'bg-gray-50 text-gray-400' };
                        const quoteCount = req.quotes?.length ?? 0;
                        return (
                          <div key={req.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-black transition-all">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                  <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                                    {req.category?.name}
                                  </span>
                                  {req.isUrgent && (
                                    <span className="flex items-center gap-0.5 text-xs font-bold text-orange-600">
                                      <Zap className="w-3 h-3" /> Urgent
                                    </span>
                                  )}
                                </div>
                                <p className="font-bold text-sm line-clamp-1">{req.description}</p>
                                <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                  <MapPin className="w-3 h-3" /> {req.address}
                                </p>
                              </div>
                              <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${meta.color}`}>
                                {meta.label}
                              </span>
                            </div>

                            {/* Activity row */}
                            {quoteCount > 0 ? (
                              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                <div className="flex items-center gap-2">
                                  <div className="flex -space-x-1.5">
                                    {req.quotes.slice(0, 3).map((_: any, i: number) => (
                                      <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white" />
                                    ))}
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700">
                                    {quoteCount} professional{quoteCount > 1 ? 's' : ''} responded
                                  </span>
                                </div>
                                <Link href={`/requests/${req.id}`} className="flex items-center gap-1 text-xs font-bold text-black hover:gap-2 transition-all">
                                  Review Quotes <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            ) : (
                              <div className="pt-3 border-t border-gray-50">
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Waiting for professionals to respond…
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Popular Services */}
                <section>
                  <h2 className="font-bold text-lg mb-4">Popular Services</h2>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {POPULAR_SERVICES.map(({ label, slug, emoji }) => (
                      <Link
                        key={slug}
                        href={`/browse?category=${slug}`}
                        className="bg-white border border-gray-100 rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center hover:border-black hover:shadow-sm transition-all group"
                      >
                        <span className="text-2xl">{emoji}</span>
                        <span className="text-xs font-bold text-gray-600 group-hover:text-black transition-colors">{label}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              </div>

              {/* ── Right column ── */}
              <div className="space-y-5">

                {/* Recommended Pros */}
                <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm">Recommended for You</h3>
                    <Link href="/browse" className="text-xs font-bold text-black border-b border-black pb-0.5 hover:opacity-70">See all</Link>
                  </div>

                  {topPros.length === 0 ? (
                    <div className="space-y-3">
                      {[
                        { label: 'Electricians', slug: 'electrician', emoji: '⚡', desc: 'Wiring, repairs and installs' },
                        { label: 'Plumbers', slug: 'plumber', emoji: '🔧', desc: 'Leaks, pipes and fixtures' },
                        { label: 'Cleaners', slug: 'cleaning', emoji: '🧹', desc: 'Deep cleaning and upkeep' },
                      ].map((service) => (
                        <Link
                          key={service.slug}
                          href={`/browse?category=${service.slug}`}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-black hover:bg-gray-50 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg shrink-0">
                            {service.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{service.label}</p>
                            <p className="text-[11px] text-gray-400 truncate">{service.desc}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors shrink-0" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topPros.map(pro => (
                        <Link
                          key={pro.id}
                          href={`/providers/${pro.id}`}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden shrink-0 grayscale group-hover:grayscale-0 transition-all">
                            <img
                              src={pro.user?.image || `https://i.pravatar.cc/100?u=${pro.id}`}
                              alt={pro.user?.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{pro.user?.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                <span className="text-xs font-semibold text-gray-700">{pro.ratingAvg?.toFixed(1) ?? '—'}</span>
                              </div>
                              <span className="text-[10px] text-gray-400">·</span>
                              <span className="text-[10px] text-gray-400 truncate">
                                {pro.categories?.[0]?.name ?? 'Professional'}
                              </span>
                            </div>
                          </div>
                          {pro.isVerified && (
                            <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0">
                              <ShieldCheck className="w-3 h-3" />
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}

                  <Link
                    href={topPros.length > 0 ? "/requests/new" : "/browse"}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all"
                  >
                    {topPros.length > 0 ? <Plus className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
                    {topPros.length > 0 ? 'Post a Job' : 'Browse Categories'}
                  </Link>
                </div>

                {/* Your Stats */}
                <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                  <h3 className="font-bold text-sm mb-4">Your Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">Completed Jobs</span>
                      <span className="font-bold">{completed.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">Active Requests</span>
                      <span className="font-bold">{activeReqs.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">Quotes Received</span>
                      <span className="font-bold text-green-600">{totalQuotes}</span>
                    </div>
                    {completed.length > 0 && (
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> Avg Rating Given
                        </span>
                        <span className="font-bold">4.9</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trusted Professionals */}
                <div className="bg-black text-white rounded-3xl p-5 shadow-xl">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-sm mb-1.5">Trusted Professionals</h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-4">
                    Every professional on VilniusPro is identity-verified and background-checked so you can book with confidence.
                  </p>
                  <Link
                    href="/browse"
                    className="w-full flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all"
                  >
                    Browse Verified Pros <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
