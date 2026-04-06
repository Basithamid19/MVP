'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import MobileNav from '@/components/MobileNav';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useSession } from 'next-auth/react';
import {
  Search, MapPin, Star, ShieldCheck,
  ArrowRight, AlertCircle, Clock,
  ChevronLeft, ChevronRight, CheckCircle2, Users, FileText, CalendarCheck,
  BadgeCheck, MessageCircle, Brush, Shield,
  Wrench, Hammer, Truck, Package, Zap, ScrollText, BellRing, Instagram, Twitter
} from 'lucide-react';
import { buttonVariants } from '@/components/ui';
import { avatarUrl } from '@/lib/avatar';
import { AladdinIcon, BroomIcon, ElectricianIcon } from '@/components/icons';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

/* ─── Static data ─── */
const categories = [
  { name: 'Plumber',     slug: 'plumber',            icon: Wrench },
  { name: 'Electrician', slug: 'electrician',         icon: ElectricianIcon },
  { name: 'Cleaning',    slug: 'cleaning',            icon: BroomIcon },
  { name: 'Handyman',    slug: 'handyman',            icon: Hammer },
  { name: 'Moving Help',          slug: 'moving-help',          icon: Truck },
  { name: 'Furniture Assembly',   slug: 'furniture-assembly',   icon: Package },
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
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    quote: 'The plumber arrived within an hour, fixed the leak, and the price matched the quote exactly. Exactly what I needed.',
    name: 'Marius T.',
    city: 'Vilnius',
    service: 'Plumbing Repair',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
  },
  {
    quote: 'Booked a cleaner for my apartment before moving in. She did an incredible job. Aladdin made the whole process effortless.',
    name: 'Eglė S.',
    city: 'Vilnius',
    service: 'Deep Cleaning',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/women/63.jpg',
  },
  {
    quote: 'Needed a handyman to mount a TV and some shelves. He was punctual, polite, and left the place spotless.',
    name: 'Tomas V.',
    city: 'Vilnius',
    service: 'Handyman',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/men/35.jpg',
  },
  {
    quote: 'The painters transformed our living room in just two days. The attention to detail was fantastic. Highly recommended.',
    name: 'Laura M.',
    city: 'Vilnius',
    service: 'Interior Painting',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
  },
  {
    quote: 'Moving is usually a nightmare, but the team we found on Aladdin made it so easy and stress-free.',
    name: 'Darius K.',
    city: 'Vilnius',
    service: 'Moving Help',
    rating: 5,
    avatar: 'https://randomuser.me/api/portraits/men/41.jpg',
  },
];

const SERVICE_CARD_DESCS = [
  'Leaks, pipes & boilers',
  'Wiring & fuse boxes',
  'Home, deep & end-of-tenancy',
  'Assembly & repairs',
  'Packing & transport',
  'Interior & exterior',
];

/* ─── Trust Carousel ─── */

const trustItems = [
  { icon: CheckCircle2, title: '30-Day Guarantee',      desc: 'Free return visit or full refund within 30 days.' },
  { icon: FileText,     title: 'Upfront Pricing',        desc: 'Full cost locked in before work begins. No hidden fees.' },
  { icon: BadgeCheck,   title: 'Verified Professionals', desc: 'ID-verified, insured, and compliance-reviewed.' },
  { icon: Shield,       title: 'Damage Cover Included',  desc: 'Up to €100 on eligible accidental damage claims.' },
];

function TrustCarousel() {
  const [active, setActive] = useState(0);
  const total = trustItems.length;

  const prev = useCallback(() => setActive(i => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setActive(i => (i + 1) % total), [total]);

  // Auto-advance — reset timer on manual interaction
  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, active]);

  // Touch swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    setTouchStart(null);
  };

  const item = trustItems[active];
  const Icon = item.icon;

  return (
    <div className="mt-3 -mx-2 sm:mx-0">
      <div className="bg-surface-alt rounded-2xl px-2 pt-3 pb-2">

        {/* Mobile: single-card carousel */}
        <div className="md:hidden">
          <div className="relative flex items-center">
            <button
              onClick={prev}
              className="absolute -left-1 z-10 w-10 h-10 flex items-center justify-center text-brand/50 hover:text-brand active:scale-90 transition-all"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div
              className="w-full overflow-hidden mx-2"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="bg-white border border-border-dim/60 rounded-2xl px-4 py-2.5 flex items-center gap-4 shadow-card min-h-[58px]"
              >
                <div className="w-9 h-9 bg-brand-muted rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-[17px] h-[17px] text-brand" />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-ink leading-tight">{item.title}</p>
                  <p className="text-[13px] text-ink-sub leading-snug mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            </div>

            <button
              onClick={next}
              className="absolute -right-1 z-10 w-10 h-10 flex items-center justify-center text-brand/50 hover:text-brand active:scale-90 transition-all"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {trustItems.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === active ? 'w-5 h-1.5 bg-brand' : 'w-1.5 h-1.5 bg-ink-dim/25'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: 4-column grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-3">
          {trustItems.map((t) => {
            const TIcon = t.icon;
            return (
              <div key={t.title} className="bg-white border border-border-dim/60 rounded-2xl px-3.5 py-3 flex items-center gap-3 shadow-card">
                <div className="w-9 h-9 bg-brand-muted rounded-xl flex items-center justify-center shrink-0">
                  <TIcon className="w-[17px] h-[17px] text-brand" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-ink leading-tight">{t.title}</p>
                  <p className="text-[11px] text-ink-sub leading-snug mt-0.5">{t.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const BOOKING_STATUS_STYLES: Record<string, string> = {
  SCHEDULED:   'bg-info-surface text-info',
  IN_PROGRESS: 'bg-caution-surface text-caution',
  COMPLETED:   'bg-trust-surface text-trust',
  CANCELED:    'bg-danger-surface text-danger',
};

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslation();
  const [searchQuery, setSearchQuery]   = useState('');
  const [savedAddress, setSavedAddress] = useState('');
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [topPros, setTopPros]           = useState<any[]>([]);
  const [prosLoading, setProsLoading]   = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

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
    router.push(`/requests/new?category=${slug}`);
  };

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-0 overflow-x-hidden w-full">

      {/* ── Nav ── */}
      <nav className="border-b border-border-dim sticky top-0 bg-white/90 backdrop-blur-md z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between w-full">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand rounded-input flex items-center justify-center shrink-0">
              <AladdinIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-ink">Aladdin</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {session ? (
              <>
                <Link
                  href="/requests/new"
                  className={buttonVariants({ variant: 'primary', size: 'sm' })}
                >
                  {t.nav.bookAPro}
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className={buttonVariants({ variant: 'primary', size: 'sm' })}
              >
                {t.nav.logIn}
              </Link>
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="pt-0 lg:pt-12 w-full min-w-0">

              {/* Mobile-only hero image — full-bleed banner above eyebrow */}
              <div className="lg:hidden -mx-4 sm:-mx-6 mb-8">
                <div className="relative aspect-[3/2] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1000&auto=format&fit=crop"
                    alt="Professional at work"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-[2rem] sm:text-4xl lg:text-[4rem] font-bold tracking-tight leading-[1.08] mb-5 text-ink">
                {t.hero.headline} <br />
                <span className="text-brand">{t.hero.headlineHighlight}</span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-ink-sub mb-10 leading-relaxed max-w-xl">
                {t.hero.subheadline}
              </p>

              {/* Unified Search Bar */}
              <form onSubmit={handleSearch} className="mb-5">
                <div className="flex flex-col sm:flex-row bg-white p-2 rounded-panel shadow-elevated border border-border-dim gap-2">
                  <div className="flex-1 flex items-center px-4 py-2">
                    <Search className="w-5 h-5 text-ink-dim shrink-0 mr-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={t.hero.searchPlaceholder}
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
                      placeholder={t.hero.addressPlaceholder}
                      className="w-full bg-transparent text-ink placeholder:text-ink-dim outline-none text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    className={buttonVariants({ variant: 'primary', size: 'lg' }) + ' sm:w-auto w-full rounded-input'}
                  >
                    {t.hero.search}
                  </button>
                </div>
              </form>

              {/* Trust Carousel */}
              <TrustCarousel />

              {/* Get help your way */}
              <div className="mt-4 mb-1 bg-white rounded-2xl px-4 pt-4 pb-2">
                <p className="text-[16px] font-bold text-ink leading-tight mb-4">Get help your way</p>

                {/* Row 1: Find a Pro */}
                <Link
                  href="/browse"
                  className="flex items-center gap-4 pt-5 pb-7 rounded-xl hover:bg-surface-alt active:bg-surface-alt transition-colors -mx-1 px-1"
                >
                  <div className="w-10 h-10 bg-[#FDB913] rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                    <Users className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-ink leading-tight">Find a Pro</p>
                    <p className="text-[12px] text-ink-sub mt-0.5 leading-snug">Browse verified professionals</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-dim/50 shrink-0" />
                </Link>

                <div className="h-px bg-border-dim/50 ml-[52px]" />

                {/* Row 2: Post a Request */}
                <Link
                  href="/requests/new"
                  className="flex items-center gap-4 pt-5 pb-7 rounded-xl hover:bg-surface-alt active:bg-surface-alt transition-colors -mx-1 px-1"
                >
                  <div className="w-10 h-10 bg-[#006A44] rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                    <ScrollText className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-ink leading-tight">Post a Request</p>
                    <p className="text-[12px] text-ink-sub mt-0.5 leading-snug">Describe your job and receive quotes</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-dim/50 shrink-0" />
                </Link>

                <div className="h-px bg-border-dim/50 ml-[52px]" />

                {/* Row 3: Urgent Help */}
                <Link
                  href="/requests/new?urgent=1"
                  className="flex items-center gap-4 pt-5 pb-2 rounded-xl hover:bg-surface-alt active:bg-surface-alt transition-colors -mx-1 px-1"
                >
                  <div className="w-10 h-10 bg-[#C1272D] rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                    <BellRing className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-bold text-ink leading-tight">Urgent Help</p>
                      <span className="text-[10px] font-bold text-brand bg-brand-muted px-1.5 py-0.5 rounded-full leading-none">Priority</span>
                    </div>
                    <p className="text-[12px] text-ink-sub mt-0.5 leading-snug">Need someone today? Get priority matching</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand/35 shrink-0" />
                </Link>
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
                  <p className="text-sm font-bold text-ink">{t.hero.verified}</p>
                  <p className="text-xs text-ink-dim">{t.hero.professionalsInVilnius}</p>
                </div>
              </div>

              {/* Floating Pro Badge */}
              <div className="absolute top-12 -right-8 bg-white p-4 rounded-card shadow-elevated border border-border-dim flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[
                    'https://randomuser.me/api/portraits/women/44.jpg',
                    'https://randomuser.me/api/portraits/men/22.jpg',
                    'https://randomuser.me/api/portraits/women/63.jpg',
                  ].map(src => (
                    <div key={src} className="w-8 h-8 rounded-full border-2 border-white bg-canvas overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-yellow-500 mb-0.5">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-ink font-bold text-xs">4.9</span>
                  </div>
                  <p className="text-[10px] text-ink-dim uppercase tracking-wider font-semibold">{t.hero.topRated}</p>
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
                <h2 className="text-sm font-bold text-ink tracking-tight">{t.bookings.recentBookings}</h2>
                <p className="text-xs text-ink-dim mt-0.5">{t.bookings.pickUpWhereYouLeftOff}</p>
              </div>
              <Link href="/dashboard" className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors flex items-center gap-1">
                {t.bookings.viewAll} <ChevronRight className="w-3.5 h-3.5" />
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
                    className="flex items-center gap-3 bg-canvas rounded-xl border border-border-dim shadow-sm p-3.5 hover:border-brand/30 hover:bg-white hover:shadow-elevated transition-all"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={b.provider?.user?.image || avatarUrl(b.provider?.user?.name, 80)}
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
      <section className="py-8 lg:py-20 bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 lg:px-8 max-w-7xl lg:mx-auto mb-4 lg:mb-8">
          <div>
            <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-1">{t.services.label}</p>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-ink">{t.services.title}</h2>
            <p className="text-sm text-ink-sub mt-1">{t.services.subtitle}</p>
          </div>
          <Link href="/browse" className="shrink-0 text-sm font-bold text-brand hover:text-brand-dark transition-colors flex items-center gap-1 mt-5">
            {t.services.viewAll} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile: horizontal snap carousel */}
        <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory pl-4 pr-4 pb-1 lg:hidden">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.slug}
                onClick={() => handleCategoryRequest(cat.slug)}
                className="shrink-0 w-[44vw] max-w-[170px] snap-start rounded-2xl p-4 flex flex-col items-start text-left bg-canvas border border-border-dim shadow-sm active:scale-[0.97] transition-transform"
                style={{ minHeight: '164px' }}
              >
                <div className="w-10 h-10 bg-brand-muted rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-brand" strokeWidth={1.5} />
                </div>
                <div className="mt-auto pt-3 w-full">
                  <p className="text-sm font-bold text-ink leading-tight">{cat.name}</p>
                  <p className="text-[11px] text-ink-sub mt-0.5 leading-snug">{SERVICE_CARD_DESCS[idx]}</p>
                </div>
                <div className="mt-2 flex items-center gap-0.5 text-brand">
                  <span className="text-[11px] font-semibold">{t.services.bookNow}</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Desktop: 6-col grid */}
        <div className="hidden lg:grid grid-cols-6 gap-4 max-w-7xl mx-auto px-8">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.slug}
                onClick={() => handleCategoryRequest(cat.slug)}
                className="rounded-2xl p-6 flex flex-col items-start text-left bg-canvas border border-border-dim shadow-sm hover:shadow-md hover:border-brand/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                style={{ minHeight: '220px' }}
              >
                <div className="w-12 h-12 bg-brand-muted rounded-2xl flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-brand" strokeWidth={1.5} />
                </div>
                <div className="mt-auto pt-5 w-full">
                  <p className="text-sm font-bold text-ink leading-tight">{cat.name}</p>
                  <p className="text-[11px] text-ink-sub mt-1 leading-snug">{SERVICE_CARD_DESCS[idx]}</p>
                </div>
                <div className="mt-3 flex items-center gap-0.5 text-brand">
                  <span className="text-[11px] font-semibold">{t.services.explore}</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Photo break — Popular Services */}
      <div className="relative w-full aspect-[3/2] sm:aspect-[16/5] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1400&auto=format&fit=crop"
          alt="Professional at work"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
      </div>

      {/* ── 3. Built for Trust ── */}
      <section className="py-12 sm:py-24 bg-surface-alt overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-3">
              Built for trust, built for Vilnius.
            </h2>
            <p className="text-ink-sub text-sm sm:text-base max-w-xl mx-auto mb-6">
              Every booking is backed by real guarantees, verified professionals, and transparent pricing.
            </p>
          </div>

          {/* Vertical timeline */}
          <div className="max-w-lg mx-auto">
            {[
              {
                icon: CheckCircle2,
                title: '30-Day Guarantee',
                desc: "If you're unhappy with any job within 30 days of completion, we'll arrange a free return visit or issue a full refund — no arguments, no hassle.",
              },
              {
                icon: FileText,
                title: 'Upfront, Transparent Pricing',
                desc: "Every quote is locked in before work begins. You see the full cost — labour, materials, everything — before you confirm. Zero hidden fees.",
              },
              {
                icon: BadgeCheck,
                title: 'Verified Professionals',
                desc: "All Aladdin providers are ID-verified, insured, and reviewed by our compliance team before they can accept a single booking.",
              },
              {
                icon: Shield,
                title: 'Damage Cover Included',
                desc: "Accidental damage during a job? We've got you covered. Eligible claims are reviewed and processed within 5 business days.",
              },
            ].map(({ icon: Icon, title, desc }, idx, arr) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.12 }}
                viewport={{ once: true }}
                className="relative grid grid-cols-[auto_1fr] gap-x-4 sm:gap-x-6"
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-light rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="w-0.5 flex-1 bg-brand-muted my-3" />
                  )}
                </div>
                <div className={idx < arr.length - 1 ? 'pb-8 sm:pb-10' : ''}>
                  <h3 className="text-base sm:text-lg font-bold text-ink mt-1 sm:mt-2 mb-1">{title}</h3>
                  <p className="text-ink-sub text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-8 sm:mt-14">
            <Link
              href="/browse"
              className={buttonVariants({ variant: 'primary', size: 'xl' })}
            >
              Find a Pro <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>


      {/* ── 4. Top Rated Professionals ── */}
      <section className="py-8 lg:py-24 bg-canvas overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5 lg:mb-12 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-2">{t.meetPros.label}</p>
            <h2 className="text-3xl font-bold tracking-tight text-ink">{t.meetPros.title}</h2>
          </div>
          <Link href="/browse" className="hidden sm:flex items-center gap-1 text-sm font-bold text-brand hover:text-brand-dark transition-colors">
            {t.meetPros.viewAll} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-4 lg:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-8">
          {prosLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="shrink-0 w-[75vw] sm:w-[300px] snap-start rounded-panel overflow-hidden animate-pulse bg-white shadow-sm border border-border-dim">
                <div className="h-48 bg-surface-alt" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-surface-alt rounded w-32" />
                  <div className="h-4 bg-surface-alt rounded w-20" />
                  <div className="h-10 bg-surface-alt rounded-input mt-4 w-full" />
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
                  className="group shrink-0 w-[75vw] sm:w-[300px] snap-start rounded-panel overflow-hidden bg-white shadow-sm hover:shadow-elevated border border-border-dim hover:border-brand/30 transition-all flex flex-col"
                >
                  {/* Photo section */}
                  <div className="relative h-48 bg-surface-alt shrink-0 overflow-hidden">
                    <img
                      src={pro.user?.image || avatarUrl(pro.user?.name, 300)}
                      alt={pro.user?.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                    
                    {/* Category pill */}
                    <div className="absolute top-4 left-4">
                      <span className="text-[10px] font-bold text-white bg-ink/40 backdrop-blur-md px-3 py-1.5 rounded-full uppercase tracking-widest">
                        {categoryName}
                      </span>
                    </div>

                    {/* Verified badge */}
                    {pro.isVerified && (
                      <div className="absolute top-4 right-4 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm">
                        <ShieldCheck className="w-4 h-4 text-trust" />
                      </div>
                    )}

                    {/* Name & Rating */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="font-bold text-xl text-white leading-tight truncate mb-1.5">{pro.user?.name}</p>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-bold text-white">{pro.ratingAvg?.toFixed(1) ?? '—'}</span>
                        <span className="text-xs text-white/70">· {pro.completedJobs ?? 0} {t.meetPros.jobs}</span>
                      </div>
                    </div>
                  </div>

                  {/* Info section */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1 bg-white">
                    {responseTime && (
                      <div className="flex items-center gap-2 text-xs font-medium text-ink-sub mb-4 sm:mb-5">
                        <Clock className="w-4 h-4 text-ink-dim shrink-0" />
                        <span>Responds in {responseTime}</span>
                      </div>
                    )}
                    <div className="mt-auto w-full flex items-center justify-center gap-2 bg-brand text-white text-sm font-bold py-3 sm:py-3.5 rounded-input group-hover:bg-brand-dark transition-colors">
                      {t.meetPros.viewProfile} <ChevronRight className="w-4 h-4" />
                    </div>
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
                  className="group shrink-0 w-[75vw] sm:w-[300px] snap-start rounded-panel overflow-hidden bg-white shadow-sm hover:shadow-elevated border border-border-dim p-6 flex flex-col transition-all"
                >
                  <div className="w-16 h-16 bg-surface-alt rounded-2xl flex items-center justify-center mb-5 shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-ink-sub" strokeWidth={1.5} />
                  </div>
                  <p className="font-bold text-lg text-ink mb-2">{cat.name}</p>
                  <p className="text-sm text-ink-sub mb-6">Browse verified professionals in Vilnius.</p>
                  <div className="mt-auto pt-5 border-t border-border-dim">
                    <span className="text-sm font-bold text-brand flex items-center gap-1 group-hover:gap-2 transition-all">
                      Browse pros <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
        
        {/* Mobile See All link */}
        <div className="px-4 sm:hidden mt-2">
          <Link href="/browse" className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-border-dim rounded-input text-sm font-bold text-ink hover:bg-surface-alt transition-colors">
            {t.meetPros.viewAll} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── 5. How It Works ── */}
      <section className="py-12 sm:py-24 bg-surface-alt overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-16">
            <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-3">{t.howItWorks.label}</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-3">{t.howItWorks.title}</h2>
            <p className="text-ink-sub text-sm sm:text-base max-w-xl mx-auto">
              {t.howItWorks.subtitle}
            </p>
          </div>

          {/* Vertical timeline */}
          <div className="max-w-lg mx-auto">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }, idx) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.12 }}
                viewport={{ once: true }}
                className="relative grid grid-cols-[auto_1fr] gap-x-4 sm:gap-x-6"
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-light rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  {idx < HOW_IT_WORKS.length - 1 && (
                    <div className="w-0.5 flex-1 bg-brand-muted my-3" />
                  )}
                </div>
                <div className={idx < HOW_IT_WORKS.length - 1 ? 'pb-8 sm:pb-10' : ''}>
                  <h3 className="text-base sm:text-lg font-bold text-ink mt-1 sm:mt-2 mb-1">{`${parseInt(step)}. ${title}`}</h3>
                  <p className="text-ink-sub text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-14">
            <Link
              href="/requests/new"
              className={buttonVariants({ variant: 'primary', size: 'xl' })}
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Photo break — the result */}
      <div className="relative w-full aspect-[3/2] sm:aspect-[16/5] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1400&auto=format&fit=crop"
          alt="Immaculate home interior"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>

      {/* ── 6. Testimonials ── */}
      <section className="overflow-hidden">

        {/* ── Mobile: brand-consistent centered card carousel ── */}
        <div className="md:hidden bg-gradient-to-b from-brand-muted to-canvas pt-10 pb-10 px-5">
          {/* White card */}
          <div className="bg-white px-5 pt-8 pb-7 text-center relative shadow-float">
            {/* Decorative quote mark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden rounded-none">
              <span className="text-[160px] font-black text-brand/8 leading-none translate-y-2">&ldquo;</span>
            </div>

            {/* Avatar — centered, no arrows */}
            <div className="flex justify-center mb-5 relative z-10">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-brand/20 shadow-sm">
                <img
                  src={TESTIMONIALS[activeTestimonial].avatar}
                  alt={TESTIMONIALS[activeTestimonial].name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Quote */}
            <p className="text-[15px] font-semibold text-ink leading-relaxed mb-5 relative z-10">
              &ldquo;{TESTIMONIALS[activeTestimonial].quote}&rdquo;
            </p>

            {/* Attribution */}
            <div className="relative z-10">
              <p className="font-bold text-ink uppercase tracking-wide text-[13px]">{TESTIMONIALS[activeTestimonial].name}</p>
              <p className="text-ink-dim text-[11px] uppercase tracking-widest mt-0.5">
                {TESTIMONIALS[activeTestimonial].service} · {TESTIMONIALS[activeTestimonial].city}
              </p>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-5">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === activeTestimonial ? 'w-6 h-1.5 bg-brand' : 'w-1.5 h-1.5 bg-brand/25'
                }`}
                aria-label={`Go to review ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ── Desktop: card grid ── */}
        <div className="hidden md:block py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-3">{t.testimonials.label}</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-4">{t.testimonials.title}</h2>
              <p className="text-ink-sub text-lg max-w-2xl mx-auto">Real reviews from real homeowners in Vilnius.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TESTIMONIALS.map((tmn, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white border border-border-dim rounded-2xl p-6 flex flex-col shadow-card hover:shadow-elevated transition-shadow duration-300"
                >
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: tmn.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-[15px] leading-relaxed text-ink flex-1 mb-6">
                    &ldquo;{tmn.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border-dim">
                      <img src={tmn.avatar} alt={tmn.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink leading-tight">{tmn.name}</p>
                      <p className="text-[12px] text-ink-sub mt-0.5">{tmn.service} · {tmn.city}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* ── 9. Footer ── */}
      <footer className="bg-canvas border-t border-border-dim">

        {/* ── Mobile: centered editorial layout ── */}
        <div className="md:hidden px-6 pt-14 pb-10 text-center">

          {/* Brand */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-brand rounded-input flex items-center justify-center shrink-0">
                <AladdinIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-brand">Aladdin</span>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-dim mt-1">
              Trusted local professionals · Vilnius
            </p>
          </div>

          {/* Services */}
          <div className="mb-10">
            <h4 className="font-bold text-[15px] uppercase tracking-widest text-ink mb-5">Services</h4>
            <ul className="space-y-4 text-[15px]">
              <li><Link href="/browse?category=plumber"     className="text-ink-sub hover:text-ink transition-colors">Plumbing</Link></li>
              <li><Link href="/browse?category=electrician" className="text-ink-sub hover:text-ink transition-colors">Electrical</Link></li>
              <li><Link href="/browse?category=cleaning"    className="text-ink-sub hover:text-ink transition-colors">Cleaning</Link></li>
              <li><Link href="/browse?category=handyman"    className="text-ink-sub hover:text-ink transition-colors">Handyman</Link></li>
              <li><Link href="/browse?category=moving-help" className="text-ink-sub hover:text-ink transition-colors">Moving Help</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="mb-10">
            <h4 className="font-bold text-[15px] uppercase tracking-widest text-ink mb-5">Company</h4>
            <ul className="space-y-4 text-[15px]">
              <li><Link href="/about"        className="text-ink-sub hover:text-ink transition-colors">About Us</Link></li>
              <li><Link href="/for-pros"     className="text-ink-sub hover:text-ink transition-colors">Join as a Pro</Link></li>
              <li><Link href="/support"      className="text-ink-sub hover:text-ink transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="mb-12">
            <h4 className="font-bold text-[15px] uppercase tracking-widest text-ink mb-5">Legal</h4>
            <ul className="space-y-4 text-[15px]">
              <li><Link href="/terms"   className="text-ink-sub hover:text-ink transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-ink-sub hover:text-ink transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Social icons */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <a href="#" aria-label="Instagram" className="text-ink-dim hover:text-ink transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" aria-label="Twitter" className="text-ink-dim hover:text-ink transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          </div>

          <p className="text-xs text-ink-dim">© 2026 Aladdin. All rights reserved.</p>
        </div>

        {/* ── Desktop: multi-column layout ── */}
        <div className="hidden md:block max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-brand rounded-input flex items-center justify-center shrink-0">
                <AladdinIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-brand">Aladdin</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-dim">
              Trusted local professionals · Vilnius, Lithuania
            </p>
          </div>
          <div className="grid grid-cols-4 gap-10 mb-14">
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
                <li><Link href="/for-pros"            className="text-ink-sub hover:text-ink transition-colors">Join Aladdin</Link></li>
                <li><Link href="/provider/dashboard"  className="text-ink-sub hover:text-ink transition-colors">Pro Dashboard</Link></li>
                <li><Link href="/provider/onboarding" className="text-ink-sub hover:text-ink transition-colors">Get Verified</Link></li>
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
          <div className="pt-8 border-t border-border-dim flex justify-between items-center">
            <p className="text-xs text-ink-dim">© 2026 {t.footer.copyright}</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <a href="#" aria-label="Instagram" className="text-ink-dim hover:text-ink transition-colors"><Instagram className="w-4 h-4" /></a>
                <a href="#" aria-label="Twitter" className="text-ink-dim hover:text-ink transition-colors"><Twitter className="w-4 h-4" /></a>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </div>

      </footer>

      {session && <MobileNav />}
    </div>
  );
}
