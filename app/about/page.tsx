'use client';

import { ShieldCheck, Star, Users, Zap, Heart, BadgeCheck } from 'lucide-react';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { StatsBand, ValueCard, CtaCard, MarketingSectionHeader } from '@/components/marketing';

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Trust first',
    desc: 'Every professional on Aladdin is ID-verified and background-checked. We never compromise on who we let on the platform.',
  },
  {
    icon: Star,
    title: 'Honest reviews',
    desc: 'Reviews come only from verified bookings. No fake stars, no gaming — just real feedback from real customers.',
  },
  {
    icon: Zap,
    title: 'Speed matters',
    desc: 'Getting help shouldn\'t take days. We\'ve built the platform so you can find and book a pro in minutes.',
  },
  {
    icon: Heart,
    title: 'Fair to everyone',
    desc: 'Customers get transparent pricing. Professionals get fair pay and tools to grow. No hidden fees on either side.',
  },
  {
    icon: BadgeCheck,
    title: 'Local expertise',
    desc: 'We focus exclusively on Vilnius. Deep local knowledge means better matches, faster response times, and pros who know the city.',
  },
  {
    icon: Users,
    title: 'Built for community',
    desc: 'Aladdin is about strengthening the local economy — connecting neighbours with skilled local people who take pride in their craft.',
  },
];

/* Shared with /for-pros — same numbers, same wording. */
const STATS = [
  { value: '100+',   label: 'Verified Pros' },
  { value: '2,400+', label: 'Jobs Completed' },
  { value: '4.9★',   label: 'Average Rating' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-card">

      <SiteNav />

      {/* Hero */}
      <section className="pt-16 sm:pt-24 pb-16 sm:pb-20 bg-canvas">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-2xs font-bold text-brand uppercase tracking-[0.15em] mb-5">
            About us
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.08] mb-5">
            Building trust in<br className="hidden sm:block" /> local services
          </h1>
          <p className="text-ink-sub text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Aladdin is Vilnius's marketplace for trusted home services. We connect residents
            with verified local professionals — quickly, transparently, and with a guarantee.
          </p>
        </div>
      </section>

      <StatsBand stats={STATS} />

      {/* Story */}
      <section className="py-16 sm:py-24 bg-card">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <p className="text-2xs font-bold text-brand uppercase tracking-[0.15em] mb-4">Our story</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-6">
            Why we built Aladdin
          </h2>
          <div className="space-y-4 text-ink-sub text-base leading-relaxed">
            <p>
              Finding a reliable plumber, electrician, or cleaner in Vilnius used to mean asking
              friends for referrals, sifting through unverified listings, and hoping for the best.
              Too often, people were let down — no-shows, inconsistent quality, unclear pricing.
            </p>
            <p>
              We built Aladdin to fix that. By combining rigorous professional verification,
              transparent pricing, and a genuine customer guarantee, we've created a platform
              where trust is built into every booking — not bolted on after the fact.
            </p>
            <p>
              Today we serve thousands of homes across Vilnius, connecting them with hundreds of
              local professionals who take pride in their work. We're just getting started.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-24 bg-canvas">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <MarketingSectionHeader eyebrow="What we stand for" title="Our values" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map(v => (
              <ValueCard key={v.title} icon={v.icon} title={v.title} desc={v.desc} surface="card" />
            ))}
          </div>
        </div>
      </section>

      <CtaCard
        title="Ready to get started?"
        desc="Find a trusted professional in Vilnius today, or join our growing network of local pros."
        cta="Find a Pro"
        href="/browse"
        secondaryCta="Join as a Pro"
        secondaryHref="/for-pros"
      />

      <SiteFooter />

    </div>
  );
}
