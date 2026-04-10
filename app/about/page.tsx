'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Star, Users, Zap, Heart, BadgeCheck } from 'lucide-react';
import { buttonVariants } from '@/components/ui';
import { AladdinIcon } from '@/components/icons';

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

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="border-b border-border-dim sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center shrink-0">
              <AladdinIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-ink">Aladdin</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-ink-sub hover:text-ink transition-colors">
              Log in
            </Link>
            <Link href="/register" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 sm:pt-24 pb-16 sm:pb-20 bg-canvas">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.15em] mb-5">
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

      {/* Stats */}
      <section className="py-10 sm:py-14 bg-white border-y border-border-dim">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            {[
              { value: '100+', label: 'Verified Pros' },
              { value: '2,400+', label: 'Jobs Completed' },
              { value: '4.9★', label: 'Average Rating' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl sm:text-3xl font-bold text-brand">{s.value}</p>
                <p className="text-xs sm:text-sm text-ink-sub mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.15em] mb-4">Our story</p>
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
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.15em] mb-3">What we stand for</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Our values
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-border-dim p-5 sm:p-6">
                <div className="w-10 h-10 bg-brand-muted rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand" strokeWidth={1.5} />
                </div>
                <p className="font-bold text-sm text-ink mb-1.5">{title}</p>
                <p className="text-sm text-ink-sub leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="bg-canvas rounded-2xl border border-border-dim shadow-elevated px-6 py-10 sm:px-10 sm:py-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-3">
              Ready to get started?
            </h2>
            <p className="text-ink-sub text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
              Find a trusted professional in Vilnius today, or join our growing network of local pros.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/browse" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
                Find a Pro <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/for-pros" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
                Join as a Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-canvas border-t border-border-dim py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-dim">&copy; 2026 Aladdin Marketplace. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/" className="text-ink-sub hover:text-ink transition-colors">Home</Link>
            <Link href="/browse" className="text-ink-sub hover:text-ink transition-colors">Find a Pro</Link>
            <Link href="/terms" className="text-ink-sub hover:text-ink transition-colors">Terms</Link>
            <Link href="/privacy" className="text-ink-sub hover:text-ink transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
