import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, BadgeCheck, Zap, ShieldCheck,
  Users, Star, DollarSign, Clock,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { StatsBand, ValueCard, CtaCard, MarketingSectionHeader } from '@/components/marketing';

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

/* First two stats match /about verbatim — same numbers, same labels. */
const STATS = [
  { value: '100+',   label: 'Verified Pros' },
  { value: '2,400+', label: 'Jobs Completed' },
  { value: '<1 hr',  label: 'Avg. Response' },
];

const PILLS = [
  { icon: CheckCircle2, label: 'Verified local leads' },
  { icon: BadgeCheck,   label: 'Trust-building badge' },
  { icon: Zap,          label: 'Fast weekly payouts' },
];

export default function ForProsPage() {
  return (
    <div className="min-h-screen bg-card">

      <SiteNav ctaLabel="Join as a Pro" />

      {/* Hero */}
      <section className="pt-16 sm:pt-24 pb-16 sm:pb-20 bg-canvas">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-2xs font-bold text-brand uppercase tracking-[0.15em] mb-5">
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
            {PILLS.map(({ icon: PillIcon, label }) => (
              <div key={label} className="inline-flex items-center gap-2 border border-border-dim bg-card rounded-full px-4 py-2 shadow-card">
                <PillIcon className="w-3.5 h-3.5 text-brand shrink-0" strokeWidth={2} />
                <span className="text-sm font-medium text-ink">{label}</span>
              </div>
            ))}
          </div>

          <Link href="/register" className={buttonVariants({ variant: 'primary', size: 'xl' })}>
            Join as a Pro <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-ink-dim mt-4">Free to join · No monthly fees · 12% per completed job</p>
        </div>
      </section>

      <StatsBand stats={STATS} />

      {/* Benefits grid */}
      <section className="py-16 sm:py-24 bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <MarketingSectionHeader eyebrow="Why Aladdin" title="Everything you need to grow" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map(b => (
              <ValueCard key={b.title} icon={b.icon} title={b.title} desc={b.desc} surface="canvas" />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24 py-16 sm:py-24 bg-canvas">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <MarketingSectionHeader eyebrow="How it works" title="Start in 4 simple steps" />
          <div className="space-y-4">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4 bg-card rounded-card border border-border-dim p-5">
                <div className="w-9 h-9 bg-brand rounded-input flex items-center justify-center shrink-0 text-white font-bold text-sm">
                  {step}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-base text-ink mb-0.5">{title}</p>
                  <p className="text-sm text-ink-sub leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaCard
        title="Ready to grow your business?"
        desc="Join Aladdin today and start receiving verified leads from customers in Vilnius."
        cta="Join as a Pro"
        href="/register"
        note="Free to join · No monthly fees · Cancel anytime"
      />

      <SiteFooter />

    </div>
  );
}
