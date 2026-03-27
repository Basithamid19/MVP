'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import MobileNav from '@/components/MobileNav';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useSession } from 'next-auth/react';
import {
  Search, MapPin, Star, ShieldCheck,
  ArrowRight, AlertCircle, Clock,
  ChevronRight, CheckCircle2, Users, FileText, CalendarCheck,
  BadgeCheck, MessageCircle, Brush,
  Wrench, Hammer, Truck, Paintbrush, Zap
} from 'lucide-react';
import { buttonVariants } from '@/components/ui';
import { BroomIcon, ElectricianIcon } from '@/components/icons';

/* ─── Static data ─── */
const categories = [
  { name: 'Plumber',     slug: 'plumber',            icon: Wrench },
  { name: 'Electrician', slug: 'electrician',         icon: ElectricianIcon },
  { name: 'Cleaning',    slug: 'cleaning',            icon: BroomIcon },
  { name: 'Handyman',    slug: 'handyman',            icon: Hammer },
  { name: 'Moving Help', slug: 'moving-help',         icon: Truck },
  { name: 'Painting',    slug: 'painting',            icon: Paintbrush },
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
    quote: 'Booked a cleaner for my apartment before moving in. She did an incredible job. Dispatch made the whole process effortless.',
    name: 'Eglė S.',
    city: 'Vilnius',
    service: 'Deep Cleaning',
    rating: 5,
    avatar: 13,
  },
];

const BOOKING_STATUS_STYLES: Record<string, string> = {
  SCHEDULED:   'bg-info-surface text-info',
  IN_PROGRESS: 'bg-caution-surface text-caution',
  COMPLETED:   'bg-trust-surface text-trust',
  CANCELED:    'bg-danger-surface text-danger',
};

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery]   = useState('');
  const [isUrgent, setIsUrgent]         = useState(false);
  const [savedAddress, setSavedAddress] = useState('');
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [topPros, setTopPros]           = useState<any[]>([]);
  const [prosLoading, setProsLoading]   = useState(true);

  useEffect(() => {
    const addr = localStorage.getItem('vp_saved_address');
    if (addr) setSavedAddress(addr);
    fetch('/api/providers')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTopPros(d.slice(0, 4)); })
      .catch(() => {})
      .finally(() => setProsLoading(false));
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
    router.push(`/category/${slug}`);
  };

  return (
    <div className="min-h-screen bg-white pb-safe overflow-x-hidden w-full">

      {/* ── Nav ── */}
      <nav className="border-b border-border-dim sticky top-0 bg-white/90 backdrop-blur-md z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between w-full">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand rounded-input flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm tracking-tight">D</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-ink">Dispatch</span>
          </Link>
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <Link href="/dashboard" className="text-sm font-semibold text-ink-sub hover:text-ink transition-colors">
                  My Account
                </Link>
                <Link
                  href="/requests/new"
                  className={buttonVariants({ variant: 'primary', size: 'sm' })}
                >
                  Book a Pro
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-ink-sub hover:text-ink transition-colors">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className={buttonVariants({ variant: 'primary', size: 'sm' })}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── 1. Hero ── */}
      <section className="relative pt-0 pb-8 sm:pb-28 lg:pb-40 overflow-hidden bg-canvas">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-20 items-start">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="pt-8 lg:pt-12 w-full min-w-0">

              {/* Eyebrow */}
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-border-dim text-brand text-[11px] font-bold uppercase tracking-widest rounded-chip mb-6 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                Trusted local pros in Vilnius
              </span>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[4rem] font-bold tracking-tight leading-[1.05] mb-6 text-ink">
                Premium home services, <br className="hidden lg:block" />
                <span className="text-brand">delivered with trust.</span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-ink-sub mb-10 leading-relaxed max-w-xl">
                Find and book verified plumbers, electricians, and cleaners. 
                Transparent pricing, real reviews, and exceptional quality.
              </p>

              {/* Unified Search Bar */}
              <form onSubmit={handleSearch} className="mb-8">
                <div className="flex flex-col sm:flex-row bg-white p-2 rounded-panel shadow-elevated border border-border-dim gap-2">
                  <div className="flex-1 flex items-center px-4 py-2">
                    <Search className="w-5 h-5 text-ink-dim shrink-0 mr-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="What do you need?"
                      className="w-full bg-transparent text-ink placeholder:text-ink-dim outline-none text-base"
                    />
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-border-dim self-center" />
                  <div className="flex-1 flex items-center px-4 py-2">
                    <MapPin className="w-5 h-5 text-ink-dim shrink-0 mr-3" />
                    <input
                      type="text"
                      value={savedAddress}
                      onChange={e => { setSavedAddress(e.target.value); localStorage.setItem('vp_saved_address', e.target.value); }}
                      placeholder="Your address"
                      className="w-full bg-transparent text-ink placeholder:text-ink-dim outline-none text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    className={buttonVariants({ variant: 'primary', size: 'lg' }) + ' sm:w-auto w-full rounded-input'}
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Quick category pills & Urgency */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                <span className="text-xs font-semibold text-ink-dim uppercase tracking-wider shrink-0">Popular:</span>
                {categories.slice(0, 3).map(cat => {
                  const Icon = cat.icon;
                  return (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoryRequest(cat.slug)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-chip bg-white border border-border-dim text-xs font-medium text-ink-sub hover:text-ink hover:border-brand/30 hover:bg-brand-muted transition-all shadow-sm"
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                    {cat.name}
                  </button>
                )})}
                <div className="w-px h-4 bg-border-dim mx-0.5 shrink-0" />
                <button
                  onClick={() => setIsUrgent(!isUrgent)}
                  className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-chip border text-xs font-medium transition-all shadow-sm ${
                    isUrgent
                      ? 'bg-caution-surface border-caution-edge text-caution'
                      : 'bg-white border-border-dim text-ink-sub hover:text-ink hover:border-border'
                  }`}
                >
                  <AlertCircle className={`w-3.5 h-3.5 ${isUrgent ? 'text-caution' : 'text-ink-dim'}`} />
                  {isUrgent ? 'Urgent' : 'Mark urgent'}
                </button>
              </div>
            </motion.div>

            {/* Hero right — Art Directed Image */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="hidden lg:block relative w-full min-w-0"
            >
              <div className="relative aspect-[4/5] rounded-hero overflow-hidden shadow-float border border-border-dim/50">
                <img 
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1000&auto=format&fit=crop" 
                  alt="Professional at work" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>

              {/* Floating Trust Badge */}
              <div className="absolute -bottom-6 -left-10 bg-white p-5 rounded-panel shadow-float border border-border-dim flex items-center gap-4">
                <div className="w-12 h-12 bg-trust-surface rounded-full flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-trust" />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">100% Verified</p>
                  <p className="text-xs text-ink-dim">Professionals in Vilnius</p>
                </div>
              </div>

              {/* Floating Pro Badge */}
              <div className="absolute top-12 -right-8 bg-white p-4 rounded-card shadow-elevated border border-border-dim flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[11, 12, 13].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-canvas overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i}`} alt="" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-yellow-500 mb-0.5">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-ink font-bold text-xs">4.9</span>
                  </div>
                  <p className="text-[10px] text-ink-dim uppercase tracking-wider font-semibold">Top Rated</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Recent Bookings (logged-in only) ── */}
      {session && recentBookings.length > 0 && (
        <section className="py-6 sm:py-10 bg-white border-t border-border-dim">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-ink tracking-tight">Recent Bookings</h2>
                <p className="text-xs text-ink-dim mt-0.5">Pick up where you left off</p>
              </div>
              <Link href="/dashboard" className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors flex items-center gap-1">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
              {recentBookings.map(b => {
                const categoryName = b.quote?.request?.category?.name;
                const providerName = b.provider?.user?.name;
                return (
                  <Link
                    key={b.id}
                    href={`/bookings/${b.id}`}
                    className="flex items-center gap-3 bg-canvas rounded-xl border border-border-dim p-3.5 hover:border-brand/30 hover:bg-white hover:shadow-sm transition-all"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={b.provider?.user?.image || `https://i.pravatar.cc/60?u=${b.providerId}`}
                        alt={providerName ?? ''}
                        className="w-11 h-11 rounded-xl object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-ink truncate capitalize">{providerName ?? 'Professional'}</p>
                      <p className="text-xs text-ink-sub font-medium">{categoryName ?? 'Home Service'}</p>
                      <p className="text-xs text-ink-dim flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${BOOKING_STATUS_STYLES[b.status] ?? 'bg-surface-alt text-ink-dim'}`}>
                        {b.status.replace('_', ' ')}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-ink-dim" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 2. Popular Services ── */}
      <section className="py-10 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header row — heading + View all on same line */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-1">Services</p>
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-ink">Popular Services</h2>
            </div>
            <Link href="/browse" className="shrink-0 text-sm font-bold text-brand hover:text-brand-dark transition-colors flex items-center gap-1 mt-5">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-sm text-ink-sub mb-6 lg:mb-12">Whatever you need, we have a pro for that.</p>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-x-3 gap-y-6 lg:gap-x-4 lg:gap-y-12 justify-items-center">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="w-full flex justify-center"
              >
                <button
                  onClick={() => handleCategoryRequest(cat.slug)}
                  className="group flex flex-col items-center cursor-pointer outline-none w-full"
                >
                  <div className="relative w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center mb-2 lg:mb-3">
                    <div className="absolute inset-0 bg-brand-muted rounded-2xl lg:rounded-3xl transition-all duration-300 ease-out group-active:scale-95" />
                    <Icon className="w-6 h-6 lg:w-8 lg:h-8 text-brand relative z-10" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs lg:text-sm font-bold text-brand leading-tight text-center">
                    {cat.name}
                  </span>
                </button>
              </motion.div>
            )})}
          </div>
        </div>
      </section>

      {/* ── 3. How It Works ── */}
      <section className="py-24 bg-surface-alt">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight text-ink mb-3">Three steps to getting it done</h2>
            <p className="text-ink-sub max-w-xl mx-auto">
              From posting a job to booking a professional — it takes less than 5 minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-9 left-1/3 right-1/3 h-px bg-border-dim" />

            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }, idx) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.12 }}
                viewport={{ once: true }}
                className="relative text-center"
              >
                <div className="w-18 h-18 bg-brand text-white rounded-panel flex items-center justify-center mx-auto mb-6 shadow-elevated">
                  <Icon className="w-7 h-7" />
                </div>
                <span className="text-[10px] font-bold text-brand/60 uppercase tracking-widest mb-2 block">
                  Step {step}
                </span>
                <h3 className="text-lg font-bold text-ink mb-3">{title}</h3>
                <p className="text-ink-sub text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link
              href="/requests/new"
              className={buttonVariants({ variant: 'primary', size: 'xl' })}
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. Top Rated Professionals ── */}
      <section className="py-10 lg:py-16 bg-canvas overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 mb-6">
          <div>
            <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-1">Our Pros</p>
            <h2 className="text-[22px] font-bold tracking-tight text-ink leading-tight">Top Rated<br />Professionals</h2>
          </div>
          <Link href="/browse" className="flex items-center gap-1 text-xs font-bold text-brand bg-brand-muted px-3 py-1.5 rounded-full shrink-0">
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pl-4 pr-4 pb-1">
          {prosLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="shrink-0 w-[70vw] max-w-[240px] snap-start rounded-3xl overflow-hidden animate-pulse bg-white shadow-lg">
                <div className="h-40 bg-surface-alt" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-surface-alt rounded w-24" />
                  <div className="h-3 bg-surface-alt rounded w-16" />
                  <div className="h-8 bg-surface-alt rounded-xl mt-3 w-full" />
                </div>
              </div>
            ))
          ) : topPros.length > 0 ? (
            topPros.map((pro) => {
              const responseTime = pro.responseTime
                ? pro.responseTime.replace(/^usually responds in\s*/i, '')
                : null;
              const categoryName = pro.categories?.[0]?.name ?? 'Professional';
              return (
                <Link
                  key={pro.id}
                  href={`/providers/${pro.id}`}
                  className="shrink-0 w-[70vw] max-w-[240px] snap-start rounded-3xl overflow-hidden bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] active:scale-[0.97] transition-transform flex flex-col"
                >
                  {/* Photo section */}
                  <div className="relative h-44 bg-surface-alt shrink-0">
                    <img
                      src={pro.user?.image || `https://i.pravatar.cc/300?u=${pro.id}`}
                      alt={pro.user?.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    {/* Category pill */}
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {categoryName}
                      </span>
                    </div>
                    {/* Verified badge */}
                    {pro.isVerified && (
                      <div className="absolute top-3 right-3 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                        <ShieldCheck className="w-4 h-4 text-brand" />
                      </div>
                    )}
                    {/* Name over gradient */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="font-bold text-base text-white leading-tight truncate">{pro.user?.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-white">{pro.ratingAvg?.toFixed(1) ?? '—'}</span>
                        <span className="text-[11px] text-white/60">· {pro.completedJobs ?? 0} jobs</span>
                      </div>
                    </div>
                  </div>

                  {/* Info section */}
                  <div className="p-3.5 flex flex-col flex-1">
                    {responseTime && (
                      <div className="flex items-center gap-1.5 text-[11px] text-ink-sub mb-3">
                        <Clock className="w-3 h-3 text-ink-dim shrink-0" />
                        <span>Responds in {responseTime}</span>
                      </div>
                    )}
                    <Link
                      href={`/providers/${pro.id}`}
                      className="mt-auto w-full flex items-center justify-center gap-1.5 bg-brand text-white text-xs font-bold py-2.5 rounded-xl"
                    >
                      View Profile <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Link>
              );
            })
          ) : (
            [
              { name: 'Electricians', slug: 'electrician', icon: ElectricianIcon },
              { name: 'Plumbers',     slug: 'plumber',     icon: Wrench },
              { name: 'Cleaners',     slug: 'cleaning',    icon: BroomIcon },
              { name: 'Handymen',     slug: 'handyman',    icon: Hammer },
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/browse?category=${cat.slug}`}
                  className="shrink-0 w-[70vw] max-w-[240px] snap-start rounded-3xl overflow-hidden bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] p-5 flex flex-col active:scale-[0.97] transition-transform"
                >
                  <div className="w-14 h-14 bg-brand-muted rounded-2xl flex items-center justify-center mb-4 shrink-0">
                    <Icon className="w-7 h-7 text-brand" strokeWidth={1.5} />
                  </div>
                  <p className="font-bold text-sm text-ink">{cat.name}</p>
                  <div className="mt-auto pt-4">
                    <span className="text-xs font-bold text-brand flex items-center gap-1">Browse pros <ChevronRight className="w-3.5 h-3.5" /></span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* ── 5. Why Dispatch ── */}
      <section className="py-10 lg:py-16 bg-canvas">
        <div className="mx-4 rounded-3xl overflow-hidden" style={{ background: '#cdd9d0' }}>
          {/* Header */}
          <div className="px-6 pt-7 pb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: '#1c382880' }}>Why Dispatch</p>
            <h2 className="text-[24px] font-bold tracking-tight leading-tight" style={{ color: '#1c3828' }}>Built for trust,<br />built for Vilnius.</h2>
          </div>

          {/* Feature rows */}
          <div className="divide-y" style={{ borderColor: '#1c382815' }}>
            {[
              { icon: BadgeCheck,    title: 'Verified Experts',   desc: 'Every pro is ID-verified and trade-certified before joining.' },
              { icon: Star,          title: 'Real Reviews Only',  desc: 'Reviews only from customers with completed bookings.' },
              { icon: Zap,           title: 'Fast Response',      desc: 'Most requests get a reply within 1 hour.' },
              { icon: MessageCircle, title: 'Direct Messaging',   desc: 'Chat with pros before booking to align on price.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 px-6 py-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#1c382818' }}>
                  <Icon className="w-[18px] h-[18px]" style={{ color: '#1c3828' }} strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[14px] mb-0.5" style={{ color: '#1c3828' }}>{title}</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: '#1c382899' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="px-6 py-5">
            <Link
              href="/browse"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold"
              style={{ background: '#1c382818', color: '#1c3828' }}
            >
              Find a Pro <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>


      {/* ── 6. Testimonials ── */}
      <section className="py-10 lg:py-16 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 mb-6">
          <div>
            <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-1">Customer Stories</p>
            <h2 className="text-[22px] font-bold tracking-tight text-ink leading-tight">What Customers Say</h2>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pl-4 pr-4 pb-1">
          {TESTIMONIALS.map((t, idx) => {
            // Exact Apple Mac mini palette: muted rose, dark slate, light silver
            const palettes = [
              { bg: '#dfc8cc', fg: '#3d1520' },          // muted rose/pink
              { bg: '#636577', fg: '#ffffff' },           // dark slate grey
              { bg: '#d5d5d7', fg: '#1d1d1f' },          // cool light silver
            ];
            const { bg, fg } = palettes[idx % palettes.length];
            return (
              <div
                key={idx}
                className="shrink-0 w-[82vw] max-w-[300px] snap-start rounded-3xl p-6 flex flex-col"
                style={{ background: bg, minHeight: 370 }}
              >
                {/* Top row: avatar + stars */}
                <div className="flex items-center justify-between mb-5">
                  <div
                    className="w-16 h-16 rounded-2xl overflow-hidden shrink-0"
                    style={{ border: `2px solid ${fg}25` }}
                  >
                    <img
                      src={`https://i.pravatar.cc/120?img=${t.avatar}`}
                      alt={t.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={fg} opacity={0.9}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                </div>

                {/* Large decorative quote mark */}
                <svg width="30" height="24" viewBox="0 0 28 22" fill={fg} opacity={0.12} className="mb-3 shrink-0">
                  <path d="M0 22V13.364C0 5.727 4.667 1.212 14 0l1.167 2.182C11.083 3.576 9 6.788 9 10h5V22H0ZM16 22V13.364C16 5.727 20.667 1.212 30 0l1.167 2.182C27.083 3.576 25 6.788 25 10h5V22H16Z" />
                </svg>

                {/* Quote */}
                <p
                  className="text-[14px] font-medium leading-relaxed flex-1 mb-5"
                  style={{ color: fg }}
                >
                  {t.quote}
                </p>

                {/* Author */}
                <div className="pt-4" style={{ borderTop: `1px solid ${fg}22` }}>
                  <p className="text-sm font-bold" style={{ color: fg }}>{t.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: fg, opacity: 0.55 }}>
                    {t.service} · {t.city}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 7. Join as a Professional ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <span className="inline-flex items-center px-3 py-1.5 bg-brand-muted text-brand text-[11px] font-bold uppercase tracking-widest rounded-chip mb-5">
                For professionals
              </span>
              <h2 className="text-4xl font-bold tracking-tight text-ink mb-5">
                Are you a professional?<br />Get new customers in Vilnius.
              </h2>
              <p className="text-ink-sub text-lg leading-relaxed mb-8 max-w-lg">
                Join hundreds of local pros already growing their business on Dispatch.
                Receive verified leads, manage bookings, and build your reputation.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className={buttonVariants({ variant: 'primary', size: 'lg' })}
                >
                  Join as a Pro <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/browse"
                  className={buttonVariants({ variant: 'outline', size: 'lg' })}
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Feature cards — off-white on canvas background */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Brush,        title: 'Your own profile',    desc: 'Showcase your skills, certifications, and reviews.' },
                { icon: Zap,          title: 'Instant leads',       desc: 'Get notified the moment a relevant job is posted.' },
                { icon: ShieldCheck,  title: 'Verified badge',      desc: 'Build trust with a verified professional badge.' },
                { icon: CheckCircle2, title: 'Secure payments',     desc: 'Get paid on time, every time — no chasing invoices.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-surface-alt rounded-panel p-6 border border-border-dim shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-white rounded-input flex items-center justify-center mb-4 shadow-sm text-brand border border-border-dim">
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <p className="font-bold text-base text-ink mb-1.5">{title}</p>
                  <p className="text-sm text-ink-sub leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Final CTA ── */}
      <section className="py-24 bg-canvas">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-ink mb-4">
            Ready to get your job done?
          </h2>
          <p className="text-ink-sub text-lg mb-10 leading-relaxed">
            Find a trusted professional in minutes or post your job and receive quotes today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/browse"
              className={buttonVariants({ variant: 'primary', size: 'xl' })}
            >
              <Search className="w-5 h-5" /> Find a Professional
            </Link>
            <Link
              href="/requests/new"
              className={buttonVariants({ variant: 'outline', size: 'xl' })}
            >
              Post a Job <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-xs text-ink-dim mt-6">Free to post · No commitment · Instant quotes</p>
        </div>
      </section>

      {/* ── 9. Footer ── */}
      <footer className="bg-canvas border-t border-border-dim py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Brand lockup — centered above columns */}
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-brand rounded-input flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-brand">Dispatch</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-dim">
              Trusted local professionals · Vilnius, Lithuania
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
            <div>
              <h4 className="font-bold mb-5 text-[11px] uppercase tracking-widest text-ink-dim">Services</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/browse?category=plumber"     className="text-ink-sub hover:text-ink transition-colors">Plumbing</Link></li>
                <li><Link href="/browse?category=electrician" className="text-ink-sub hover:text-ink transition-colors">Electrical</Link></li>
                <li><Link href="/browse?category=cleaning"    className="text-ink-sub hover:text-ink transition-colors">Cleaning</Link></li>
                <li><Link href="/browse?category=handyman"    className="text-ink-sub hover:text-ink transition-colors">Handyman</Link></li>
                <li><Link href="/browse?category=moving-help" className="text-ink-sub hover:text-ink transition-colors">Moving Help</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-[11px] uppercase tracking-widest text-ink-dim">For Professionals</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/register"            className="text-ink-sub hover:text-ink transition-colors">Join as a Pro</Link></li>
                <li><Link href="/provider/dashboard"  className="text-ink-sub hover:text-ink transition-colors">Pro Dashboard</Link></li>
                <li><Link href="/provider/onboarding" className="text-ink-sub hover:text-ink transition-colors">Get Verified</Link></li>
                <li><Link href="/provider/earnings"   className="text-ink-sub hover:text-ink transition-colors">Earnings</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-[11px] uppercase tracking-widest text-ink-dim">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about"   className="text-ink-sub hover:text-ink transition-colors">About Us</Link></li>
                <li><Link href="/support" className="text-ink-sub hover:text-ink transition-colors">Support</Link></li>
                <li><Link href="/terms"   className="text-ink-sub hover:text-ink transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-ink-sub hover:text-ink transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-[11px] uppercase tracking-widest text-ink-dim">Get Started</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/browse"       className="text-ink-sub hover:text-ink transition-colors">Find a Professional</Link></li>
                <li><Link href="/requests/new" className="text-ink-sub hover:text-ink transition-colors">Post a Job</Link></li>
                <li><Link href="/login"        className="text-ink-sub hover:text-ink transition-colors">Log In</Link></li>
                <li><Link href="/register"     className="text-ink-sub hover:text-ink transition-colors">Create Account</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-border-dim flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-ink-dim">© 2026 Dispatch Marketplace. All rights reserved.</p>
            <p className="text-xs text-ink-dim">Vilnius, Lithuania · English / Lietuvių</p>
          </div>

        </div>
      </footer>

      {session && <MobileNav />}
    </div>
  );
}
