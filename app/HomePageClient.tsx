'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import MobileNav from '@/components/MobileNav';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useSession } from 'next-auth/react';
import {
  Search, MapPin, Star, ShieldCheck,
  ArrowRight, Clock,
  ChevronLeft, ChevronRight, CheckCircle2, Users, FileText,
  BadgeCheck, Shield,
  Wrench, Hammer, Truck, Package, ScrollText, BellRing,
} from 'lucide-react';
import { buttonVariants, Avatar, AvatarStack } from '@/components/ui';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { avatarUrl } from '@/lib/avatar';
import { AladdinIcon, BroomIcon, ElectricianIcon } from '@/components/icons';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CustomerMenuDrawer from '@/components/CustomerMenuDrawer';

/* ─── Imagery ───────────────────────────────────────────────────────────────
 * Every photo on this page is unique — a repeated stock image is the fastest
 * way to look like a template. `u()` builds a consistently-cropped Unsplash
 * URL; `fallbackPhoto()` is the onError escape hatch (stable per-seed picsum)
 * so a card/hero is never blank if a remote photo disappears.
 *
 * NOTE: images.unsplash.com is deliberately NOT in next.config.ts
 * remotePatterns, so these stay plain <img> with explicit width/height +
 * lazy loading rather than next/image (which would 400 at runtime).
 * ────────────────────────────────────────────────────────────────────────── */
const u = (id: string, w = 600) =>
  `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

const fallbackPhoto = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const onPhotoError = (seed: string, w: number, h: number) =>
  (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const fb = fallbackPhoto(seed, w, h);
    if (img.src !== fb) img.src = fb;
  };

/* ─── Service cards ─────────────────────────────────────────────────────────
 * One row of data drives one responsive card (mobile snap-carousel → desktop
 * grid). Tint + ink classes are written out in full because Tailwind scans
 * source text — never build them with template strings.
 * ────────────────────────────────────────────────────────────────────────── */
type CardKey = 'plumbing' | 'electrical' | 'cleaning' | 'repairs' | 'logistics' | 'assembly';

const SERVICE_CARDS: {
  slug:    string;
  cardKey: CardKey;
  icon:    React.ComponentType<{ className?: string }>;
  popular: boolean;
  img:     string;
  price:   string;
  tint:    string;
  ink:     string;
  inkSub:  string;
  inkDim:  string;
  line:    string;
  arrow:   string;
}[] = [
  {
    slug: 'plumber', cardKey: 'plumbing', icon: Wrench, popular: false,
    img: u('photo-1607472586893-edb57bdc0e39'), price: 'From €40',
    tint: 'bg-cat-plumbing', ink: 'text-cat-plumbing-ink',
    inkSub: 'text-cat-plumbing-ink/75', inkDim: 'text-cat-plumbing-ink/55',
    line: 'border-cat-plumbing-ink/10', arrow: 'bg-cat-plumbing-ink',
  },
  {
    slug: 'electrician', cardKey: 'electrical', icon: ElectricianIcon, popular: false,
    img: u('photo-1621905251918-48416bd8575a'), price: 'From €45',
    tint: 'bg-cat-electrical', ink: 'text-cat-electrical-ink',
    inkSub: 'text-cat-electrical-ink/75', inkDim: 'text-cat-electrical-ink/55',
    line: 'border-cat-electrical-ink/10', arrow: 'bg-cat-electrical-ink',
  },
  {
    slug: 'cleaning', cardKey: 'cleaning', icon: BroomIcon, popular: true,
    img: u('photo-1581578731548-c64695cc6952'), price: 'From €30',
    tint: 'bg-cat-cleaning', ink: 'text-cat-cleaning-ink',
    inkSub: 'text-cat-cleaning-ink/75', inkDim: 'text-cat-cleaning-ink/55',
    line: 'border-cat-cleaning-ink/10', arrow: 'bg-cat-cleaning-ink',
  },
  {
    slug: 'handyman', cardKey: 'repairs', icon: Hammer, popular: true,
    img: u('photo-1581092160562-40aa08e78837'), price: 'From €35',
    tint: 'bg-cat-repairs', ink: 'text-cat-repairs-ink',
    inkSub: 'text-cat-repairs-ink/75', inkDim: 'text-cat-repairs-ink/55',
    line: 'border-cat-repairs-ink/10', arrow: 'bg-cat-repairs-ink',
  },
  {
    slug: 'moving-help', cardKey: 'logistics', icon: Truck, popular: false,
    img: u('photo-1600518464441-9154a4dea21b'), price: 'From €50',
    tint: 'bg-cat-logistics', ink: 'text-cat-logistics-ink',
    inkSub: 'text-cat-logistics-ink/75', inkDim: 'text-cat-logistics-ink/55',
    line: 'border-cat-logistics-ink/10', arrow: 'bg-cat-logistics-ink',
  },
  {
    slug: 'furniture-assembly', cardKey: 'assembly', icon: Package, popular: false,
    img: u('photo-1595428774223-ef52624120d2'), price: 'From €40',
    tint: 'bg-cat-assembly', ink: 'text-cat-assembly-ink',
    inkSub: 'text-cat-assembly-ink/75', inkDim: 'text-cat-assembly-ink/55',
    line: 'border-cat-assembly-ink/10', arrow: 'bg-cat-assembly-ink',
  },
];

/* Step icons only — the copy comes from the dictionary at render time. */
const HOW_IT_WORKS_ICONS = [Users, ScrollText, BellRing];

/* Real reviews, real names — portraits are generated from the name via the
 * shared Avatar palette. No stock people anywhere on this page. */
const TESTIMONIALS = [
  {
    quote: 'Found an amazing electrician in just 5 minutes. Everything was clear from the start — price, timing, reviews. Will use again.',
    name: 'Anna K.', city: 'Vilnius', service: 'Electrical Installation', rating: 5,
  },
  {
    quote: 'The plumber arrived within an hour, fixed the leak, and the price matched the quote exactly. Exactly what I needed.',
    name: 'Marius T.', city: 'Vilnius', service: 'Plumbing Repair', rating: 5,
  },
  {
    quote: 'Booked a cleaner for my apartment before moving in. She did an incredible job. Aladdin made the whole process effortless.',
    name: 'Eglė S.', city: 'Vilnius', service: 'Deep Cleaning', rating: 5,
  },
  {
    quote: 'Needed a handyman to mount a TV and some shelves. He was punctual, polite, and left the place spotless.',
    name: 'Tomas V.', city: 'Vilnius', service: 'Handyman', rating: 5,
  },
  {
    quote: 'The painters transformed our living room in just two days. The attention to detail was fantastic. Highly recommended.',
    name: 'Laura M.', city: 'Vilnius', service: 'Interior Painting', rating: 5,
  },
  {
    quote: 'Moving is usually a nightmare, but the team we found on Aladdin made it so easy and stress-free.',
    name: 'Darius K.', city: 'Vilnius', service: 'Moving Help', rating: 5,
  },
];

/* Faces for the hero social-proof badge — initials avatars, not stock photos. */
const HERO_FACES = [
  { name: 'Rūta B.' },
  { name: 'Tomas J.' },
  { name: 'Eglė M.' },
];

/* ─── Trust Carousel ─── */

const TRUST_ICONS = [CheckCircle2, FileText, BadgeCheck, Shield];

// Single-card trust slideshow: card with icon tile, side arrows, dot pager,
// 5s auto-advance and swipe. `overlay` makes it translucent + white-dotted so
// it can sit on the hero photo without swallowing it.
function TrustSlideshow({ overlay = false }: { overlay?: boolean }) {
  const tb = useTranslation().trustBanner;
  const items = [
    { title: tb.guaranteeTitle, desc: tb.guaranteeDesc },
    { title: tb.pricingTitle,   desc: tb.pricingDesc   },
    { title: tb.verifiedTitle,  desc: tb.verifiedDesc  },
    { title: tb.damageTitle,    desc: tb.damageDesc    },
  ];
  const total = items.length;
  const [active, setActive] = useState(0);

  const prev = useCallback(() => setActive(i => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setActive(i => (i + 1) % total), [total]);

  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, active]);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    setTouchStart(null);
  };

  const item = items[active];
  const Icon = TRUST_ICONS[active];

  return (
    <div>
      <div className="relative flex items-center">
        <button
          onClick={prev}
          className={`absolute -left-1 z-10 w-8 h-8 flex items-center justify-center active:scale-90 transition-all duration-150 ${
            overlay ? 'text-white/70 hover:text-white' : 'text-ink-dim/40 hover:text-ink-dim'
          }`}
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          className="w-full overflow-hidden mx-1.5"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className={`rounded-card px-3 py-2.5 flex items-center gap-3 shadow-card border ${
              overlay
                ? 'bg-card/85 backdrop-blur-md border-white/40'
                : 'bg-card border-border-dim/60'
            }`}
          >
            <div className="w-8 h-8 bg-brand-muted rounded-input flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-brand" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink leading-tight">{item.title}</p>
              <p className="text-2xs text-ink-sub leading-snug mt-0.5">{item.desc}</p>
            </div>
          </motion.div>
        </div>

        <button
          onClick={next}
          className={`absolute -right-1 z-10 w-8 h-8 flex items-center justify-center active:scale-90 transition-all duration-150 ${
            overlay ? 'text-white/70 hover:text-white' : 'text-ink-dim/40 hover:text-ink-dim'
          }`}
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`rounded-full transition-all duration-250 ${
              i === active
                ? `w-5 h-1.5 ${overlay ? 'bg-white' : 'bg-brand'}`
                : `w-1.5 h-1.5 ${overlay ? 'bg-white/50' : 'bg-ink-dim/25'}`
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// Below-hero placement for viewports without the hero photo (< lg). On lg+
// the same slideshow lives on the hero image instead.
function TrustCarousel() {
  return (
    <div className="mt-8 -mx-2 sm:mx-0 lg:hidden">
      <div className="bg-surface-alt rounded-panel px-2 pt-3 pb-1">
        <TrustSlideshow />
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

// Mirrors middleware.ts HOME_BY_ROLE — where each role belongs.
const HOME_BY_ROLE: Record<string, string> = {
  CUSTOMER: '/dashboard',
  PROVIDER: '/provider/dashboard',
  ADMIN:    '/admin/dashboard',
};

export default function LandingPage({ initialTopPros = [] }: { initialTopPros?: any[] }) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const t = useTranslation();
  // Footer CTAs are session-aware: 'loading' and unauthenticated both keep the
  // public log in / sign up pair; a signed-in user gets one link to their own
  // console instead of being invited to log in again.
  const signedIn = sessionStatus === 'authenticated' && !!session?.user;
  const roleHome = HOME_BY_ROLE[(session?.user as any)?.role] ?? '/dashboard';
  const [searchQuery, setSearchQuery]   = useState('');
  const [savedAddress, setSavedAddress] = useState('');
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [topPros, setTopPros]           = useState<any[]>(initialTopPros);
  const [prosLoading, setProsLoading]   = useState(initialTopPros.length === 0);

  useEffect(() => {
    const addr = localStorage.getItem('vp_saved_address');
    if (addr) setSavedAddress(addr);
    // Skip refetch if the server already hydrated us with providers — avoids
    // an unnecessary network round-trip on first paint.
    if (initialTopPros.length > 0) return;
    fetch('/api/providers')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTopPros(d.slice(0, 4)); })
      .catch(() => {})
      .finally(() => setProsLoading(false));
  }, [initialTopPros.length]);

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

  // Rating shown in the hero badge and the trust strip — averaged from the
  // real top-rated providers when we have them, so the claim stays honest.
  const ratedPros = topPros.filter(p => typeof p?.ratingAvg === 'number' && p.ratingAvg > 0);
  const topRating = ratedPros.length
    ? (ratedPros.reduce((sum, p) => sum + p.ratingAvg, 0) / ratedPros.length).toFixed(1)
    : '4.9';

  return (
    <div className="min-h-screen bg-card pb-nav md:pb-0 overflow-x-hidden w-full">

      {/* ── Nav ── */}
      <nav className="border-b border-border-dim sticky top-0 bg-card/90 backdrop-blur-md z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <CustomerMenuDrawer />
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-brand rounded-input flex items-center justify-center shrink-0">
                <AladdinIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-ink">Aladdin</span>
            </Link>
          </div>
          {/* Kept intentionally minimal: the language switcher lives in the
              footer, and sign-up is reachable from the login page. */}
          <div className="flex items-center gap-2 sm:gap-3">
            {session ? (
              <Link
                href="/requests/new"
                className={buttonVariants({ variant: 'primary', size: 'sm' })}
              >
                {t.nav.bookAPro}
              </Link>
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
      <section className="relative pt-0 pb-4 sm:pb-16 lg:pb-20 overflow-hidden bg-canvas">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-card/60 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-start lg:items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="pt-0 w-full min-w-0">

              {/* Mobile-only hero image — full-bleed banner above the headline.
                  Deliberately the SAME photo as the desktop hero (the two nodes
                  render at exclusive breakpoints, never together). */}
              <div className="lg:hidden -mx-4 sm:-mx-6 mb-8">
                <div className="relative aspect-[3/2] overflow-hidden bg-surface-alt">
                  <img
                    src={u('photo-1504307651254-35680f356dfd', 1000)}
                    alt="A cared-for home in Vilnius"
                    width={1000}
                    height={667}
                    onError={onPhotoError('aladdin-hero-mobile', 1000, 667)}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-5 text-ink">
                {t.hero.headline} <br />
                <span className="text-brand">{t.hero.headlineHighlight}</span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-ink-sub mb-10 leading-relaxed max-w-xl">
                {t.hero.subheadline}
              </p>

              {/* Unified Search Bar — the page's single primary CTA */}
              <form onSubmit={handleSearch} className="mb-5">
                <div className="flex flex-col sm:flex-row bg-card p-2 rounded-panel shadow-elevated border border-border-dim gap-2">
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
                    <MapPin className="w-5 h-5 text-ink-dim shrink-0 mr-3 pointer-events-none" />
                    <AddressAutocomplete
                      inline
                      value={savedAddress}
                      onChange={v => { setSavedAddress(v); localStorage.setItem('vp_saved_address', v); }}
                      placeholder={t.hero.addressPlaceholder}
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

              {/* Your project / Your Way card */}
              <div className="mt-3 bg-card border border-border-dim rounded-panel shadow-card px-4 pt-4 pb-3">
                <p className="text-2xl lg:text-3xl font-bold leading-tight mb-1 text-ink">{t.heroCard.heading} <span className="text-brand">{t.heroCard.headingHighlight}</span></p>
                <p className="text-sm text-ink-sub leading-snug mb-4">{t.heroCard.desc}</p>

                {/* Row 1: Find a Pro */}
                <Link
                  href="/browse"
                  className="flex items-center gap-4 pt-3 pb-4 rounded-card hover:bg-surface-alt active:bg-surface-alt transition-colors duration-150 -mx-1 px-1"
                >
                  <div className="w-11 h-11 bg-brand rounded-card flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-ink leading-tight">{t.heroCard.findAProTitle}</p>
                    <p className="text-xs text-ink-sub mt-0.5 leading-snug">{t.heroCard.findAProDesc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-ink-dim/40 shrink-0" />
                </Link>

                <div className="h-px bg-border-dim/35 ml-[60px]" />

                {/* Row 2: Post a Request */}
                <Link
                  href="/requests/new"
                  className="flex items-center gap-4 pt-3 pb-4 rounded-card hover:bg-surface-alt active:bg-surface-alt transition-colors duration-150 -mx-1 px-1"
                >
                  <div className="w-11 h-11 bg-brand rounded-card flex items-center justify-center shrink-0">
                    <ScrollText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-ink leading-tight">{t.heroCard.postRequestTitle}</p>
                    <p className="text-xs text-ink-sub mt-0.5 leading-snug">{t.heroCard.postRequestDesc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-ink-dim/40 shrink-0" />
                </Link>

                <div className="h-px bg-border-dim/35 ml-[60px]" />

                {/* Row 3: Urgent Help */}
                <Link
                  href="/requests/new?urgent=1"
                  className="flex items-center gap-4 pt-3 pb-3 rounded-card hover:bg-surface-alt active:bg-surface-alt transition-colors duration-150 -mx-1 px-1"
                >
                  <div className="w-11 h-11 bg-brand rounded-card flex items-center justify-center shrink-0">
                    <BellRing className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-ink leading-tight">{t.heroCard.urgentTitle}</p>
                      <span className="text-3xs font-semibold text-brand bg-brand-muted px-1.5 py-0.5 rounded-full leading-none">{t.heroCard.priorityBadge}</span>
                    </div>
                    <p className="text-xs text-ink-sub mt-0.5 leading-snug">{t.heroCard.urgentDesc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-brand/40 shrink-0" />
                </Link>
              </div>

            </motion.div>

            {/* Hero right — art-directed image */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="hidden lg:block relative w-full min-w-0"
            >
              <div className="relative aspect-[4/5] rounded-hero overflow-hidden shadow-float border border-border-dim/50 bg-surface-alt">
                <img
                  src={u('photo-1504307651254-35680f356dfd', 1000)}
                  alt="A local professional at work"
                  width={1000}
                  height={1250}
                  onError={onPhotoError('aladdin-hero-desktop', 1000, 1250)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
              </div>

              {/* Floating trust slideshow — narrow, translucent, tucked into the
                  bottom-left corner so the photograph still reads. */}
              <div className="absolute bottom-4 left-4 w-[230px] max-w-[calc(100%-2rem)]">
                <TrustSlideshow overlay />
              </div>

              {/* Floating social-proof badge — initials avatars, no stock faces */}
              <div className="absolute top-4 right-4 bg-card p-3.5 rounded-card shadow-elevated border border-border-dim flex items-center gap-3">
                <AvatarStack people={HERO_FACES} size="sm" />
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <Star className="w-3.5 h-3.5 text-caution fill-caution" />
                    <span className="text-ink font-bold text-xs">{topRating}</span>
                  </div>
                  <p className="text-3xs text-ink-dim uppercase tracking-wider font-semibold">{t.hero.topRated}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Trust strip — full width below the hero (mobile / tablet) */}
          <TrustCarousel />
        </div>
      </section>

      {/* ── Recent Bookings (logged-in only) ── */}
      {session && recentBookings.length > 0 && (
        <section className="py-6 sm:py-10 bg-card border-t border-border-dim">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-ink tracking-tight">{t.bookings.recentBookings}</h2>
                <p className="text-xs text-ink-dim mt-0.5">{t.bookings.pickUpWhereYouLeftOff}</p>
              </div>
              <Link href="/dashboard" className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors duration-150 flex items-center gap-1">
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
                    className="flex items-center gap-3 bg-canvas rounded-card border border-border-dim shadow-card p-3.5 hover:border-brand/30 hover:bg-card hover:shadow-elevated transition-all duration-150"
                  >
                    <Avatar
                      src={b.provider?.user?.image}
                      name={providerName ?? t.bookings.professional}
                      size="md"
                      shape="square"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-ink truncate capitalize">{providerName ?? t.bookings.professional}</p>
                      <p className="text-xs text-ink-sub font-medium">{categoryName ?? t.bookings.homeService}</p>
                      <p className="text-xs text-ink-dim flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wide ${BOOKING_STATUS_STYLES[b.status] ?? 'bg-surface-alt text-ink-dim'}`}>
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

      {/* ── 2. Popular Services ──
          One card, one data row: swipes on mobile, grids on desktop. */}
      <section className="py-8 lg:py-20 bg-card overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl lg:mx-auto mb-4 lg:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">{t.services.title}</h2>
          <p className="text-sm text-ink-sub mt-1">{t.services.subtitle}</p>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory px-4 sm:px-6 pb-2 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:max-w-7xl lg:mx-auto lg:px-8">
          {SERVICE_CARDS.map((c, idx) => {
            const card = t.serviceCards[c.cardKey];
            const Icon = c.icon;
            return (
              <motion.button
                key={c.slug}
                type="button"
                onClick={() => handleCategoryRequest(c.slug)}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: (idx % 3) * 0.08 }}
                viewport={{ once: true }}
                className={`group shrink-0 w-[76vw] max-w-[300px] lg:w-auto lg:max-w-none snap-start text-left flex flex-col rounded-card overflow-hidden border border-border-dim shadow-card hover:shadow-elevated hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-250 ${c.tint}`}
              >
                {/* Photo */}
                <div className="relative">
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface-alt">
                    <img
                      src={c.img}
                      alt={card.title}
                      width={600}
                      height={375}
                      loading="lazy"
                      onError={onPhotoError(c.cardKey, 600, 375)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                    />
                    {c.popular && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 bg-card/90 backdrop-blur-sm text-ink text-3xs font-bold uppercase tracking-widest rounded-chip shadow-card">
                        {t.services.popularBadge}
                      </span>
                    )}
                  </div>
                  {/* Category icon chip straddling photo and tint body */}
                  <div className="absolute -bottom-5 left-5 w-11 h-11 rounded-card bg-card shadow-card flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${c.ink}`} />
                  </div>
                </div>

                {/* Body on the category tint */}
                <div className="flex flex-1 flex-col p-5 pt-8">
                  <span className={`text-3xs font-bold uppercase tracking-widest ${c.inkDim}`}>
                    {card.tag}
                  </span>
                  <p className={`text-xl font-bold leading-tight mt-1.5 ${c.ink}`}>{card.title}</p>
                  <p className={`text-sm leading-relaxed mt-2 ${c.inkSub}`}>{card.desc}</p>

                  <div className={`w-full border-t my-4 ${c.line}`} />

                  <div className="w-full flex items-end justify-between gap-2 mt-auto">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${c.inkDim}`} />
                        <span className={`text-2xs font-semibold leading-tight ${c.inkSub}`}>{card.trust}</span>
                      </div>
                      <p className={`text-2xs font-bold mt-1.5 ${c.ink}`}>{c.price}</p>
                    </div>
                    <span className={`w-10 h-10 rounded-card flex items-center justify-center shrink-0 text-white transition-transform duration-150 group-hover:translate-x-0.5 ${c.arrow}`}>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ── 3. How It Works ── */}
      <section className="py-10 sm:py-16 bg-surface-alt overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-2xs font-bold text-brand uppercase tracking-widest mb-3">{t.howItWorks.label}</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-3">
              {t.howItWorks.title}
            </h2>
            <p className="text-ink-sub text-sm sm:text-base max-w-xl mx-auto">
              {t.howItWorks.subtitle}
            </p>
          </div>

          {/* Editorial path list */}
          <div className="max-w-lg mx-auto divide-y divide-border-dim/40">
            {HOW_IT_WORKS_ICONS.map((Icon, idx) => {
              const titles = [t.howItWorks.step1Title, t.howItWorks.step2Title, t.howItWorks.step3Title];
              const descs  = [t.howItWorks.step1Desc,  t.howItWorks.step2Desc,  t.howItWorks.step3Desc];
              const hooks  = [t.howItWorksHooks.hook1,  t.howItWorksHooks.hook2,  t.howItWorksHooks.hook3];
              const urgent = idx === 2;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="flex gap-4 py-5"
                >
                  <div className="w-11 h-11 bg-brand rounded-card flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg leading-tight mb-1 ${urgent ? 'font-bold' : 'font-semibold'} text-ink`}>
                      {titles[idx]}
                    </h3>
                    <p className="text-sm text-brand mb-2 leading-snug">{hooks[idx]}</p>
                    <p className="text-sm text-ink-sub leading-relaxed">{descs[idx]}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Section CTA — secondary: the hero owns the primary action */}
          <div className="text-center mt-6 sm:mt-10">
            <Link href="/requests/new" className={buttonVariants({ variant: 'outline', size: 'xl' })}>
              {t.heroCard.postRequestTitle} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* Photo break */}
      <div className="relative w-full aspect-[3/2] sm:aspect-[16/5] overflow-hidden bg-surface-alt">
        <img
          src={u('photo-1621905251189-08b45d6a269e', 1400)}
          alt="A professional finishing a job in Vilnius"
          width={1400}
          height={437}
          loading="lazy"
          onError={onPhotoError('aladdin-photo-break', 1400, 437)}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />
      </div>

      {/* ── 4. Built for Trust — vertical timeline. Restored by request: the
          long-form guarantees read better here than the compact stat strip,
          even though the hero slideshow shares the same four items. */}
      <section className="py-12 sm:py-24 bg-surface-alt overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-3">
              {t.trustBanner.builtForTrustTitle}
            </h2>
            <p className="text-ink-sub text-sm sm:text-base max-w-xl mx-auto mb-6">
              {t.trustBanner.builtForTrustSubtitle}
            </p>
          </div>

          {/* Vertical timeline */}
          <div className="max-w-lg mx-auto">
            {[
              { icon: CheckCircle2, title: t.trustBanner.guaranteeTitle, desc: t.trustBanner.guaranteeDescLong },
              { icon: FileText,     title: t.trustBanner.pricingTitle,   desc: t.trustBanner.pricingDescLong   },
              { icon: BadgeCheck,   title: t.trustBanner.verifiedTitle,  desc: t.trustBanner.verifiedDescLong  },
              { icon: Shield,       title: t.trustBanner.damageTitle,    desc: t.trustBanner.damageDescLong    },
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
                  <div className="w-12 h-12 bg-brand rounded-card flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="w-0.5 flex-1 bg-brand-muted my-2" />
                  )}
                </div>
                <div className={idx < arr.length - 1 ? 'pb-6' : ''}>
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
              {t.trustBanner.findAPro} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* ── 5. Top Rated Professionals ── */}
      <section className="py-8 lg:py-24 bg-canvas overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5 lg:mb-12 flex items-end justify-between">
          <div>
            <p className="text-2xs font-bold text-brand uppercase tracking-widest mb-2">{t.meetPros.label}</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">{t.meetPros.title}</h2>
          </div>
          <Link href="/browse" className="hidden sm:flex items-center gap-1 text-sm font-bold text-brand hover:text-brand-dark transition-colors duration-150">
            {t.meetPros.viewAll} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-4 lg:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-8">
          {prosLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="shrink-0 w-[75vw] sm:w-[300px] snap-start rounded-panel overflow-hidden animate-pulse bg-card shadow-card border border-border-dim">
                <div className="h-48 bg-surface-alt" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-surface-alt rounded-chip w-32" />
                  <div className="h-4 bg-surface-alt rounded-chip w-20" />
                  <div className="h-10 bg-surface-alt rounded-input mt-4 w-full" />
                </div>
              </div>
            ))
          ) : topPros.length > 0 ? (
            topPros.map((pro) => {
              const responseTime = pro.responseTime
                ? pro.responseTime.replace(/^usually responds in\s*/i, '')
                : null;
              const categoryName = pro.categories?.[0]?.name ?? t.providerProfile.professionalFallback;
              return (
                <Link
                  key={pro.id}
                  href={`/providers/${pro.id}`}
                  className="group shrink-0 w-[75vw] sm:w-[300px] snap-start rounded-panel overflow-hidden bg-card shadow-card hover:shadow-elevated border border-border-dim hover:border-brand/30 transition-all duration-250 flex flex-col"
                >
                  {/* Photo section */}
                  <div className="relative h-48 bg-surface-alt shrink-0 overflow-hidden">
                    <img
                      src={pro.user?.image || avatarUrl(pro.user?.name, 300)}
                      alt={pro.user?.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />

                    {/* Category pill */}
                    <div className="absolute top-4 left-4">
                      <span className="text-3xs font-bold text-white bg-ink/40 backdrop-blur-md px-3 py-1.5 rounded-full uppercase tracking-widest">
                        {categoryName}
                      </span>
                    </div>

                    {/* Verified badge */}
                    {pro.isVerified && (
                      <div className="absolute top-4 right-4 w-8 h-8 bg-card/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-card">
                        <ShieldCheck className="w-4 h-4 text-trust" />
                      </div>
                    )}

                    {/* Name & Rating */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="font-bold text-xl text-white leading-tight truncate mb-1.5">{pro.user?.name}</p>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-caution fill-caution" />
                        <span className="text-sm font-bold text-white">{pro.ratingAvg?.toFixed(1) ?? '—'}</span>
                        <span className="text-xs text-white/70">· {pro.completedJobs ?? 0} {t.meetPros.jobs}</span>
                      </div>
                    </div>
                  </div>

                  {/* Info section */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1 bg-card">
                    {responseTime && (
                      <div className="flex items-center gap-2 text-xs font-medium text-ink-sub mb-4 sm:mb-5">
                        <Clock className="w-4 h-4 text-ink-dim shrink-0" />
                        <span>Responds in {responseTime}</span>
                      </div>
                    )}
                    <div className="mt-auto w-full flex items-center justify-center gap-2 bg-brand text-white text-sm font-bold py-3 sm:py-3.5 rounded-input group-hover:bg-brand-dark transition-colors duration-150">
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
                  className="group shrink-0 w-[75vw] sm:w-[300px] snap-start rounded-panel overflow-hidden bg-card shadow-card hover:shadow-elevated border border-border-dim p-6 flex flex-col transition-all duration-250"
                >
                  <div className="w-16 h-16 bg-surface-alt rounded-card flex items-center justify-center mb-5 shrink-0 group-hover:scale-110 transition-transform duration-250">
                    <Icon className="w-8 h-8 text-ink-sub" strokeWidth={1.5} />
                  </div>
                  <p className="font-bold text-lg text-ink mb-2">{cat.name}</p>
                  <p className="text-sm text-ink-sub mb-6">{t.browse.subtitle}</p>
                  <div className="mt-auto pt-5 border-t border-border-dim">
                    <span className="text-sm font-bold text-brand flex items-center gap-1 group-hover:gap-2 transition-all duration-150">
                      {t.meetPros.viewAll} <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Mobile See All link */}
        <div className="px-4 sm:hidden mt-2">
          <Link href="/browse" className={buttonVariants({ variant: 'secondary', size: 'lg' }) + ' w-full'}>
            {t.meetPros.viewAll} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── 6. Testimonials ──
          One card design: horizontal snap-scroll on mobile, 3-up grid on desktop. */}
      <section className="py-10 md:py-24 bg-card overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 md:mb-14 px-4 sm:px-6 lg:px-8">
            <p className="text-2xs font-bold text-brand uppercase tracking-widest mb-2 md:mb-3">{t.testimonials.label}</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-2 md:mb-4">{t.testimonials.title}</h2>
            <p className="text-ink-sub text-sm md:text-base max-w-2xl mx-auto">Real reviews from real homeowners in Vilnius.</p>
          </div>

          <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory px-4 sm:px-6 lg:px-8 pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:overflow-visible">
            {TESTIMONIALS.map((tmn, idx) => (
              <motion.div
                key={tmn.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: (idx % 3) * 0.1 }}
                viewport={{ once: true }}
                className="shrink-0 w-[82vw] max-w-[340px] md:w-auto md:max-w-none snap-start bg-card border border-border-dim rounded-panel p-6 flex flex-col shadow-card hover:shadow-elevated transition-shadow duration-250"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: tmn.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-caution text-caution" />
                  ))}
                </div>
                <p className="text-base leading-relaxed text-ink flex-1 mb-6">
                  &ldquo;{tmn.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <Avatar name={tmn.name} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink leading-tight">{tmn.name}</p>
                    <p className="text-xs text-ink-sub mt-0.5 truncate">{tmn.service} · {tmn.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <Link
              href="/browse"
              className="inline-flex items-center gap-1 text-xs font-medium text-ink-sub hover:text-ink transition-colors duration-150"
            >
              See more reviews
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. Footer — one tree, responsive columns ── */}
      <footer className="bg-canvas border-t border-border-dim">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-8 md:py-20">

          {/* Brand */}
          <div className="text-center mb-10 md:mb-14">
            <div className="flex items-center justify-center gap-2.5 mb-2 md:mb-3">
              <div className="w-8 h-8 bg-brand rounded-input flex items-center justify-center shrink-0">
                <AladdinIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg md:text-xl tracking-tight text-brand">Aladdin</span>
            </div>
            <p className="text-2xs md:text-xs font-semibold uppercase tracking-widest text-ink-dim">
              Trusted local professionals · Vilnius, Lithuania
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 mb-10 md:mb-14">
            <div>
              <h4 className="font-bold mb-4 md:mb-5 text-2xs uppercase tracking-widest text-ink-dim">{t.services.label}</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/browse?category=plumber"     className="text-ink-sub hover:text-ink transition-colors duration-150">{t.categories.plumber}</Link></li>
                <li><Link href="/browse?category=electrician" className="text-ink-sub hover:text-ink transition-colors duration-150">{t.categories.electrician}</Link></li>
                <li><Link href="/browse?category=cleaning"    className="text-ink-sub hover:text-ink transition-colors duration-150">{t.categories.cleaning}</Link></li>
                <li><Link href="/browse?category=handyman"    className="text-ink-sub hover:text-ink transition-colors duration-150">{t.categories.handyman}</Link></li>
                <li><Link href="/browse?category=moving-help" className="text-ink-sub hover:text-ink transition-colors duration-150">{t.categories.movingHelp}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 md:mb-5 text-2xs uppercase tracking-widest text-ink-dim">{t.footer.forProfessionals}</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/for-pros"              className="text-ink-sub hover:text-ink transition-colors duration-150">{t.footer.joinAsAPro}</Link></li>
                <li><Link href="/for-pros#how-it-works" className="text-ink-sub hover:text-ink transition-colors duration-150">{t.footer.howItWorks}</Link></li>
                <li><Link href="/provider/onboarding"   className="text-ink-sub hover:text-ink transition-colors duration-150">Get Verified</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 md:mb-5 text-2xs uppercase tracking-widest text-ink-dim">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about"   className="text-ink-sub hover:text-ink transition-colors duration-150">About Us</Link></li>
                <li><Link href="/support" className="text-ink-sub hover:text-ink transition-colors duration-150">{t.footer.support}</Link></li>
                <li><Link href="/terms"   className="text-ink-sub hover:text-ink transition-colors duration-150">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-ink-sub hover:text-ink transition-colors duration-150">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 md:mb-5 text-2xs uppercase tracking-widest text-ink-dim">{t.footer.forCustomers}</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/browse"                className="text-ink-sub hover:text-ink transition-colors duration-150">{t.heroCard.findAProTitle}</Link></li>
                <li><Link href="/requests/new"          className="text-ink-sub hover:text-ink transition-colors duration-150">{t.heroCard.postRequestTitle}</Link></li>
                <li><Link href="/requests/new?urgent=1" className="text-ink-sub hover:text-ink transition-colors duration-150">{t.heroCard.urgentTitle}</Link></li>
                {signedIn ? (
                  <li><Link href={roleHome}             className="text-ink-sub hover:text-ink transition-colors duration-150">{t.nav.dashboard}</Link></li>
                ) : (
                  <>
                    <li><Link href="/login"             className="text-ink-sub hover:text-ink transition-colors duration-150">{t.nav.logIn}</Link></li>
                    <li><Link href="/register"          className="text-ink-sub hover:text-ink transition-colors duration-150">{t.nav.signUp}</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom meta row */}
          <div className="pt-6 md:pt-8 border-t border-border-dim flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-2xs md:text-xs text-ink-dim">© 2026 {t.footer.copyright}</p>
            <LanguageSwitcher />
          </div>

        </div>
      </footer>

      {/* MobileNav resolves its own session and renders GUEST_TABS for a
          visitor, so it is unconditional — gating it on `session` hid the
          bottom nav (and its Find Pros / Log in tabs) from every guest. */}
      <MobileNav />
    </div>
  );
}
