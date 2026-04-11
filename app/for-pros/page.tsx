'use client';

import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, BadgeCheck, Zap, ShieldCheck,
  Users, Star, DollarSign, Clock,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui';
import { AladdinIcon } from '@/components/icons';

const BENEFITS = [
  {
    icon: Users,
    title: 'Verified local leads',
    desc: 'Get notified the moment a relevant job is posted in your area. No cold calling — customers come to you.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust-building badge',
    desc: 'Complete verification to earn a trusted pro badge. Verified providers get up to 3x more visibility in search.',
  },
  {
    icon: DollarSign,
    title: 'Fast weekly payouts',
    desc: 'Get paid every Monday via SEPA bank transfer. No chasing invoices — we handle payments for you.',
  },
  {
    icon: Star,
    title: 'Build your reputation',
    desc: 'Collect verified reviews from real customers. Your rating and reviews are visible on your public profile.',
  },
  {
    icon: Clock,
    title: 'Flexible schedule',
    desc: 'Set your own availability and service area. Accept only the jobs that work for you.',
  },
  {
    icon: BadgeCheck,
    title: 'Your own profile page',
    desc: 'Showcase your skills, certifications, photos, and reviews. Customers can find and book you directly.',
  },
];

const STEPS = [
  { step: '1', title: 'Create your account', desc: 'Sign up in under 2 minutes with your email.' },
  { step: '2', title: 'Complete verification', desc: 'Upload your ID and get verified to start receiving leads.' },
  { step: '3', title: 'Set up your profile', desc: 'Add your services, pricing, bio, and availability.' },
  { step: '4', title: 'Start getting jobs', desc: 'Receive leads, send quotes, and grow your business.' },
];

export default function ForProsPage() {
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
              Join as a Pro
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 sm:pt-24 pb-16 sm:pb-20 bg-canvas">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.15em] mb-5">
            For professionals
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.08] mb-5">
            Get more local jobs<br className="hidden sm:block" /> in Vilnius
          </h1>
          <p className="text-ink-sub text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto">
            Join hundreds of local pros already growing their business on Aladdin.
            Receive verified leads, build trust with customers, and get paid on time.
          </p>

          {/* Benefit pills */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
            {[
              { icon: CheckCircle2, label: 'Verified local leads' },
              { icon: BadgeCheck,   label: 'Trust-building badge' },
              { icon: Zap,          label: 'Fast weekly payouts' },
            ].map(({ icon: PillIcon, label }) => (
              <div key={label} className="inline-flex items-center gap-2 border border-border-dim bg-white rounded-full px-4 py-2 shadow-sm">
                <PillIcon className="w-3.5 h-3.5 text-brand shrink-0" strokeWidth={2} />
                <span className="text-[13px] font-medium text-ink">{label}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className={buttonVariants({ variant: 'primary', size: 'xl' })}>
              Join as a Pro <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-xs text-ink-dim mt-4">Free to join · No monthly fees · 12% per completed job</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 sm:py-14 bg-white border-y border-border-dim">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            {[
              { value: '100+', label: 'Active Pros' },
              { value: '2,400+', label: 'Jobs Completed' },
              { value: '<1 hr', label: 'Avg. Response' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl sm:text-3xl font-bold text-brand">{s.value}</p>
                <p className="text-xs sm:text-sm text-ink-sub mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits grid */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.15em] mb-3">Why Aladdin</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Everything you need to grow
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-canvas rounded-2xl border border-border-dim p-5 sm:p-6">
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

      {/* How it works */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-canvas">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold text-brand uppercase tracking-[0.15em] mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Start in 4 simple steps
            </h2>
          </div>
          <div className="space-y-4">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4 bg-white rounded-2xl border border-border-dim p-5">
                <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm">
                  {step}
                </div>
                <div>
                  <p className="font-bold text-sm text-ink mb-0.5">{title}</p>
                  <p className="text-sm text-ink-sub leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="bg-canvas rounded-2xl border border-border-dim shadow-elevated px-6 py-10 sm:px-10 sm:py-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink mb-3">
              Ready to grow your business?
            </h2>
            <p className="text-ink-sub text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
              Join Aladdin today and start receiving verified leads from customers in Vilnius.
            </p>
            <Link href="/register" className={buttonVariants({ variant: 'primary', size: 'lg' })}>
              Join as a Pro <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-ink-dim mt-4">Free to join · No monthly fees · Cancel anytime</p>
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
