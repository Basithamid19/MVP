'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useSession } from 'next-auth/react';
import {
  Search, MapPin, Star, ShieldCheck, Droplets, Zap, Hammer,
  Sparkles, Box, Truck, ArrowRight, AlertCircle, Clock,
  ChevronRight, CheckCircle2, Users, FileText, CalendarCheck,
  BadgeCheck, MessageCircle, Brush,
} from 'lucide-react';

/* ─── Static data ─── */
const categories = [
  { name: 'Plumber',     slug: 'plumber',            icon: Droplets, color: 'text-blue-500',   bg: 'bg-blue-50' },
  { name: 'Electrician', slug: 'electrician',         icon: Zap,      color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { name: 'Handyman',    slug: 'handyman',            icon: Hammer,   color: 'text-orange-500', bg: 'bg-orange-50' },
  { name: 'Cleaning',    slug: 'cleaning',            icon: Sparkles, color: 'text-green-500',  bg: 'bg-green-50' },
  { name: 'Furniture',   slug: 'furniture-assembly',  icon: Box,      color: 'text-purple-500', bg: 'bg-purple-50' },
  { name: 'Moving',      slug: 'moving-help',         icon: Truck,    color: 'text-red-500',    bg: 'bg-red-50' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: FileText,
    title: 'Describe your job',
    desc: 'Tell us what you need done, your location, and when you need it. Takes under 2 minutes.',
  },
  {
    step: '02',
    icon: Users,
    title: 'Compare professionals',
    desc: 'Browse verified local pros, read real reviews, and compare transparent prices.',
  },
  {
    step: '03',
    icon: CalendarCheck,
    title: 'Book with confidence',
    desc: 'Secure your booking, pay safely, and leave a review when the job is done.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Found an amazing electrician in just 5 minutes. Everything was clear from the start — price, timing, reviews. Will use again.',
    name: 'Anna K.',
    city: 'Vilnius',
    service: 'Electrical Installation',
    rating: 5,
    avatar: 11,
  },
  {
    quote: 'The plumber arrived within an hour, fixed the leak, and the price matched the quote exactly. Exactly what I needed.',
    name: 'Marius T.',
    city: 'Vilnius',
    service: 'Plumbing Repair',
    rating: 5,
    avatar: 12,
  },
  {
    quote: 'Booked a cleaner for my apartment before moving in. She did an incredible job. VilniusPro made the whole process effortless.',
    name: 'Eglė S.',
    city: 'Vilnius',
    service: 'Deep Cleaning',
    rating: 5,
    avatar: 13,
  },
];

const BOOKING_STATUS_STYLES: Record<string, string> = {
  SCHEDULED:   'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  COMPLETED:   'bg-green-100 text-green-700',
  CANCELED:    'bg-red-100 text-red-600',
};

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery]   = useState('');
  const [isUrgent, setIsUrgent]         = useState(false);
  const [savedAddress, setSavedAddress] = useState('');
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [topPros, setTopPros]           = useState<any[]>([]);

  useEffect(() => {
    const addr = localStorage.getItem('vp_saved_address');
    if (addr) setSavedAddress(addr);
    // Fetch top pros for homepage
    fetch('/api/providers')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTopPros(d.slice(0, 4)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (session) {
      fetch('/api/bookings')
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setRecentBookings(d.slice(0, 3)); })
        .catch(() => {});
    }
  }, [session]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(searchQuery.trim() ? `/browse?q=${encodeURIComponent(searchQuery.trim())}` : '/browse');
  };

  const handleCategoryRequest = (slug: string) => {
    const params = new URLSearchParams({ category: slug });
    if (isUrgent) params.set('urgent', '1');
    router.push(`/requests/new?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <span className="font-bold text-xl tracking-tight">VilniusPro</span>
          </Link>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">My Account</Link>
                <Link href="/requests/new" className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all">Book a Pro</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Log in</Link>
                <Link href="/register" className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all">Join as Pro</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── 1. Hero ── */}
      <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-[11px] font-bold uppercase tracking-widest rounded-full mb-5">
                Trusted local pros in Vilnius
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-[0.95] mb-5">
                Find trusted home service professionals in Vilnius.
              </h1>
              <p className="text-base sm:text-lg text-gray-500 mb-7 leading-relaxed max-w-xl">
                Compare plumbers, electricians, cleaners and more.<br />
                Transparent pricing. Real reviews. Fast responses.
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="What do you need? e.g. 'plumber'…"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                    />
                  </div>
                  <button type="submit" className="bg-black text-white px-6 py-4 rounded-2xl font-semibold hover:bg-gray-800 transition-all shrink-0">
                    Search
                  </button>
                </div>
              </form>

              {/* Address + urgency */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={savedAddress}
                    onChange={e => { setSavedAddress(e.target.value); localStorage.setItem('vp_saved_address', e.target.value); }}
                    placeholder="Your address in Vilnius"
                    className="bg-transparent text-sm font-medium text-gray-700 outline-none placeholder:text-gray-400 w-44"
                  />
                </div>
                <button
                  onClick={() => setIsUrgent(!isUrgent)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${isUrgent ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-400'}`}
                >
                  <AlertCircle className={`w-4 h-4 ${isUrgent ? 'text-orange-500' : 'text-gray-400'}`} />
                  {isUrgent ? 'Urgent — on' : 'Mark as urgent'}
                  <div className={`w-8 h-5 rounded-full relative transition-colors ${isUrgent ? 'bg-orange-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isUrgent ? 'left-3.5' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>

              {/* Quick category pills */}
              <div className="flex flex-wrap gap-2 mb-7">
                {categories.slice(0, 4).map(cat => (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoryRequest(cat.slug)}
                    className="px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:text-black hover:border-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    {cat.name}{isUrgent && <span className="ml-1 text-orange-500">⚡</span>}
                  </button>
                ))}
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap items-center gap-5 pt-5 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> 4.9 average rating
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Zap className="w-4 h-4 text-orange-500" /> &lt;1h response time
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <ShieldCheck className="w-4 h-4 text-blue-500" /> 100% verified pros
                </div>
              </div>
            </motion.div>

            {/* Hero right card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="hidden lg:block"
            >
              <div className="bg-gray-50 rounded-[40px] border border-gray-100 p-8 shadow-sm">
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: 'Avg. Rating', value: '4.9' },
                    { label: 'Response',    value: '<1h' },
                    { label: 'Verified',    value: '100%' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className="text-2xl font-bold tracking-tight">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">Emergency plumber</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Available now</span>
                    </div>
                    <p className="text-sm text-gray-500">From €35 · 4.9 rating · 220+ jobs</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">Licensed electrician</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">Fast reply</span>
                    </div>
                    <p className="text-sm text-gray-500">From €40 · 4.8 rating · 180+ jobs</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">Professional cleaner</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">Top rated</span>
                    </div>
                    <p className="text-sm text-gray-500">From €25 · 5.0 rating · 310+ jobs</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gray-50 -z-10 rounded-l-[100px] hidden lg:block">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
        </div>
      </section>

      {/* ── Recent Bookings (logged-in only) ── */}
      {session && recentBookings.length > 0 && (
        <section className="py-12 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Recent bookings</h2>
                <p className="text-sm text-gray-500">Pick up where you left off.</p>
              </div>
              <Link href="/dashboard" className="text-sm font-bold text-black border-b-2 border-black pb-0.5 hover:opacity-70">View all</Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentBookings.map(b => (
                <Link key={b.id} href={`/bookings/${b.id}`} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:border-black transition-all">
                  <img src={b.provider?.user?.image || `https://i.pravatar.cc/60?u=${b.providerId}`} alt="" className="w-10 h-10 rounded-xl object-cover grayscale shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{b.provider?.user?.name}</p>
                    <p className="text-xs text-gray-400">{b.quote?.request?.category?.name ?? 'Service'}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${BOOKING_STATUS_STYLES[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 2. Popular Services ── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Popular Services</h2>
              <p className="text-gray-500">Whatever you need, we have a pro for that.</p>
            </div>
            <Link href="/browse" className="text-sm font-bold text-black border-b-2 border-black pb-1 hover:opacity-70">View all</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, idx) => (
              <motion.div key={cat.slug} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.07 }} viewport={{ once: true }}>
                <button
                  onClick={() => handleCategoryRequest(cat.slug)}
                  className="group block w-full p-6 bg-white rounded-3xl border border-gray-100 hover:border-black hover:shadow-xl hover:-translate-y-1 transition-all text-left cursor-pointer"
                >
                  <div className={`w-12 h-12 ${cat.bg} ${cat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm">{cat.name}</h3>
                  {isUrgent && <p className="text-[10px] text-orange-500 font-bold mt-1">⚡ Urgent</p>}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. How It Works ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-3">How VilniusPro Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">From posting a job to booking a professional — it takes less than 5 minutes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gray-200" />
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }, idx) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.12 }}
                viewport={{ once: true }}
                className="relative text-center"
              >
                <div className="w-20 h-20 bg-black text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Icon className="w-8 h-8" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Step {step}</span>
                <h3 className="text-lg font-bold mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/requests/new" className="inline-flex items-center gap-2 bg-black text-white px-7 py-3.5 rounded-2xl font-bold hover:bg-gray-800 transition-all">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. Top Rated Professionals ── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Top Rated Professionals</h2>
              <p className="text-gray-500">Verified experts trusted by Vilnius homeowners.</p>
            </div>
            <Link href="/browse" className="text-sm font-bold text-black border-b-2 border-black pb-1 hover:opacity-70">Browse all</Link>
          </div>

          {topPros.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topPros.map((pro, idx) => (
                <motion.div key={pro.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }} viewport={{ once: true }}>
                  <Link href={`/providers/${pro.id}`} className="group block bg-white rounded-3xl border border-gray-100 p-6 hover:border-black hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden shrink-0 grayscale group-hover:grayscale-0 transition-all">
                        <img src={pro.user?.image || `https://i.pravatar.cc/100?u=${pro.id}`} alt={pro.user?.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="font-bold text-sm truncate">{pro.user?.name}</p>
                          {pro.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{pro.categories?.[0]?.name ?? 'Professional'}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold">{pro.ratingAvg?.toFixed(1) ?? '—'}</span>
                        <span className="text-xs text-gray-400">({pro.completedJobs ?? 0} jobs)</span>
                      </div>
                      {pro.responseTime && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" /> {pro.responseTime}
                        </div>
                      )}
                      {pro.offerings?.[0] && (
                        <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold">
                          From €{pro.offerings[0].price}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {pro.serviceArea?.split(',')[0] ?? 'Vilnius'}
                      </span>
                      <span className="text-xs font-bold text-black flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Placeholder cards while no data / loading */
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { cat: 'Electrician', from: '€40', jobs: '180+', rating: '4.9', tag: 'Fast reply',     tagColor: 'bg-blue-100 text-blue-700' },
                { cat: 'Plumber',     from: '€35', jobs: '220+', rating: '4.8', tag: 'Available today', tagColor: 'bg-green-100 text-green-700' },
                { cat: 'Cleaner',     from: '€25', jobs: '310+', rating: '5.0', tag: 'Top rated',      tagColor: 'bg-purple-100 text-purple-700' },
                { cat: 'Handyman',    from: '€30', jobs: '140+', rating: '4.7', tag: 'Verified',       tagColor: 'bg-gray-100 text-gray-700' },
              ].map((p, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }} viewport={{ once: true }}>
                  <Link href="/browse" className="group block bg-white rounded-3xl border border-gray-100 p-6 hover:border-black hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden shrink-0 grayscale group-hover:grayscale-0 transition-all">
                        <img src={`https://i.pravatar.cc/100?img=${idx + 20}`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{p.cat} Pro</p>
                        <p className="text-xs text-gray-400">{p.cat}</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold">{p.rating}</span>
                        <span className="text-xs text-gray-400">({p.jobs} jobs)</span>
                      </div>
                      <p className="text-xs text-green-700 font-semibold">From {p.from}</p>
                    </div>
                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${p.tagColor}`}>{p.tag}</span>
                      <span className="text-xs font-bold text-black flex items-center gap-0.5 group-hover:gap-1.5 transition-all">View <ChevronRight className="w-3.5 h-3.5" /></span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 5. Why VilniusPro ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-square bg-gray-100 rounded-[60px] overflow-hidden">
              <img
                src="https://picsum.photos/seed/vilnius/800/800"
                alt="Vilnius Professional"
                className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute bottom-8 left-8 right-8 p-5 bg-white/90 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex -space-x-2">
                    {[11, 12, 13].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i}`} alt="" />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-black font-bold text-sm">4.9/5</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-800 italic">&ldquo;Found an amazing electrician in just 5 minutes. Highly recommend!&rdquo;</p>
                <p className="text-xs text-gray-400 mt-1">— Anna K., Vilnius</p>
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-10">Why VilniusPro?</h2>
              <div className="space-y-7">
                {[
                  { icon: BadgeCheck, bg: 'bg-black', iconColor: 'text-white', title: 'Verified Experts', desc: 'All professionals are ID-verified and trade-certified before joining the platform.' },
                  { icon: Star,       bg: 'bg-gray-100', iconColor: 'text-black', title: 'Real Reviews',    desc: 'Only customers with completed bookings can leave reviews — 100% authentic.' },
                  { icon: Zap,        bg: 'bg-gray-100', iconColor: 'text-black', title: 'Fast Response',   desc: 'Local pros ready to help. Most requests get a reply within 1 hour.' },
                  { icon: MessageCircle, bg: 'bg-gray-100', iconColor: 'text-black', title: 'Direct Messaging', desc: 'Chat with professionals before booking to align on scope and price.' },
                ].map(({ icon: Icon, bg, iconColor, title, desc }) => (
                  <div key={title} className="flex gap-5">
                    <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">{title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Testimonials ── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">What Customers Say</h2>
            <p className="text-gray-500">Real reviews from real homeowners in Vilnius.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} viewport={{ once: true }}
                className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed flex-1 mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                    <img src={`https://i.pravatar.cc/100?img=${t.avatar}`} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.city} · {t.service}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Join as a Professional ── */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 bg-white/10 text-white text-[11px] font-bold uppercase tracking-widest rounded-full mb-5">
                For professionals
              </span>
              <h2 className="text-4xl font-bold tracking-tight mb-5">
                Are you a professional?<br />Get new customers in Vilnius.
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-lg">
                Join hundreds of local pros already growing their business on VilniusPro. Receive verified leads, manage bookings, and build your reputation.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/register" className="flex items-center gap-2 bg-white text-black px-6 py-3.5 rounded-2xl font-bold hover:bg-gray-100 transition-all">
                  Join as a Pro <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/browse" className="flex items-center gap-2 border border-white/20 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-white/10 transition-all">
                  Learn More
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Brush,        title: 'Your own profile',    desc: 'Showcase your skills, certifications, and reviews.' },
                { icon: Zap,          title: 'Instant leads',       desc: 'Get notified the moment a relevant job is posted.' },
                { icon: ShieldCheck,  title: 'Verified badge',      desc: 'Build trust with a verified professional badge.' },
                { icon: CheckCircle2, title: 'Secure payments',     desc: 'Get paid on time, every time — no chasing invoices.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <Icon className="w-5 h-5 text-white mb-3" />
                  <p className="font-bold text-sm mb-1">{title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Final CTA ── */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Ready to get your job done?</h2>
          <p className="text-gray-500 text-lg mb-10">
            Find a trusted professional in minutes or post your job and receive quotes today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/browse" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all text-base">
              <Search className="w-5 h-5" /> Find a Professional
            </Link>
            <Link href="/requests/new" className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-black text-black px-8 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all text-base">
              Post a Job <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-6">Free to post · No commitment · Instant quotes</p>
        </div>
      </section>

      {/* ── 9. Footer ── */}
      <footer className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold text-xl">V</span>
                </div>
                <span className="font-bold text-xl tracking-tight">VilniusPro</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Connecting Vilnius residents with the best local service professionals. Quality work, guaranteed.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-sm uppercase tracking-widest">Services</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><Link href="/browse?category=plumber"      className="hover:text-white transition-colors">Plumbing</Link></li>
                <li><Link href="/browse?category=electrician"  className="hover:text-white transition-colors">Electrical</Link></li>
                <li><Link href="/browse?category=cleaning"     className="hover:text-white transition-colors">Cleaning</Link></li>
                <li><Link href="/browse?category=handyman"     className="hover:text-white transition-colors">Handyman</Link></li>
                <li><Link href="/browse?category=moving-help"  className="hover:text-white transition-colors">Moving Help</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-sm uppercase tracking-widest">For Professionals</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><Link href="/register"              className="hover:text-white transition-colors">Join as a Pro</Link></li>
                <li><Link href="/provider/dashboard"    className="hover:text-white transition-colors">Pro Dashboard</Link></li>
                <li><Link href="/provider/onboarding"   className="hover:text-white transition-colors">Get Verified</Link></li>
                <li><Link href="/provider/earnings"     className="hover:text-white transition-colors">Earnings</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-sm uppercase tracking-widest">Company</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><Link href="/about"   className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
                <li><Link href="/terms"   className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>© 2026 VilniusPro Marketplace. All rights reserved.</p>
            <div className="flex gap-6">
              <span>Vilnius, Lithuania</span>
              <span>English / Lietuvių</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
