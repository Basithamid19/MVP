'use client';

import Link from 'next/link';
import { CalendarCheck, CreditCard, UserCircle, Wrench, MessageCircle, ShieldCheck, ChevronRight } from 'lucide-react';
import { AladdinIcon } from '@/components/icons';

const TOPICS = [
  {
    icon: CalendarCheck,
    title: 'Bookings & scheduling',
    desc: 'How to book, reschedule, or cancel a service.',
    href: '#bookings',
  },
  {
    icon: CreditCard,
    title: 'Payments & refunds',
    desc: 'Billing questions, refund policy, and the 30-day guarantee.',
    href: '#payments',
  },
  {
    icon: UserCircle,
    title: 'My account',
    desc: 'Managing your profile, email, and notification settings.',
    href: '#account',
  },
  {
    icon: Wrench,
    title: 'For professionals',
    desc: 'Verification, leads, payouts, and your Pro dashboard.',
    href: '#pros',
  },
  {
    icon: ShieldCheck,
    title: 'Trust & safety',
    desc: 'How we verify pros and what to do if something goes wrong.',
    href: '#safety',
  },
  {
    icon: MessageCircle,
    title: 'Contact us',
    desc: 'Reach our support team directly by email.',
    href: '#contact',
  },
];

const FAQS = [
  {
    id: 'bookings',
    section: 'Bookings & scheduling',
    items: [
      {
        q: 'How do I book a professional?',
        a: 'Browse verified professionals, view their profiles and reviews, then click "Book" to send a booking request. The pro will confirm within a few hours. You can also post a request and let pros come to you.',
      },
      {
        q: 'Can I reschedule or cancel a booking?',
        a: 'Yes. Open the booking from your dashboard and select "Reschedule" or "Cancel". Cancellations made more than 24 hours before the appointment are free. Late cancellations may incur a small fee.',
      },
      {
        q: 'What happens if the pro doesn\'t show up?',
        a: 'If a professional misses an appointment without notice, contact support immediately. We\'ll arrange a replacement pro as quickly as possible and you won\'t be charged for the missed visit.',
      },
    ],
  },
  {
    id: 'payments',
    section: 'Payments & refunds',
    items: [
      {
        q: 'When am I charged?',
        a: 'Payment is captured after the job is marked complete by the professional. You\'ll receive a receipt by email. We accept all major credit and debit cards.',
      },
      {
        q: 'What is the 30-day guarantee?',
        a: 'If you\'re not satisfied with a completed job, contact us within 30 days. We\'ll arrange a free return visit from the same pro, or a full refund if the issue can\'t be resolved.',
      },
      {
        q: 'How do I request a refund?',
        a: 'Email support@aladdin.lt with your booking reference and a brief description of the issue. Our team will respond within 1 business day and process eligible refunds within 5–7 business days.',
      },
    ],
  },
  {
    id: 'account',
    section: 'My account',
    items: [
      {
        q: 'How do I change my email or password?',
        a: 'Go to Account Settings from your dashboard. You can update your email, password, and notification preferences there.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Contact support@aladdin.lt with a deletion request. We\'ll process it within 30 days in accordance with GDPR. Completed booking records are retained for legal and tax purposes.',
      },
    ],
  },
  {
    id: 'pros',
    section: 'For professionals',
    items: [
      {
        q: 'How do I join as a professional?',
        a: 'Visit our For Professionals page and create an account. You\'ll need to complete identity verification and set up your profile before you can receive leads.',
      },
      {
        q: 'When and how do I get paid?',
        a: 'Payouts are processed every Monday via SEPA bank transfer for all jobs completed the previous week. You can track earnings in your Pro Dashboard.',
      },
      {
        q: 'What is the platform fee?',
        a: 'Aladdin charges a 12% service fee on each completed job. There are no monthly fees, no lead purchase fees, and no setup costs.',
      },
    ],
  },
  {
    id: 'safety',
    section: 'Trust & safety',
    items: [
      {
        q: 'How are professionals verified?',
        a: 'Every pro on Aladdin completes an ID verification and background check before being listed. Verified pros display a badge on their profile. We also review and action all reports from customers.',
      },
      {
        q: 'What should I do if I feel unsafe?',
        a: 'If you ever feel unsafe during a service, leave the situation and call emergency services if needed. Then contact us at support@aladdin.lt — we treat all safety reports as urgent and investigate immediately.',
      },
    ],
  },
];

export default function SupportPage() {
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
          <Link href="/" className="text-sm font-semibold text-ink-sub hover:text-ink transition-colors">
            ← Back to home
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 sm:pt-24 pb-16 sm:pb-20 bg-canvas">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.15em] mb-5">Help centre</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.08] mb-5">
            How can we help?
          </h1>
          <p className="text-ink-sub text-base sm:text-lg leading-relaxed max-w-md mx-auto">
            Find answers to common questions below, or get in touch with our support team directly.
          </p>
        </div>
      </section>

      {/* Topic cards */}
      <section className="py-10 sm:py-14 bg-white border-y border-border-dim">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {TOPICS.map(({ icon: Icon, title, desc, href }) => (
              <a
                key={title}
                href={href}
                className="bg-canvas rounded-2xl border border-border-dim p-5 hover:border-border hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-150 group"
              >
                <div className="w-10 h-10 bg-brand-muted rounded-xl flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-brand" strokeWidth={1.5} />
                </div>
                <p className="font-bold text-sm text-ink mb-1 group-hover:text-brand transition-colors">{title}</p>
                <p className="text-xs text-ink-sub leading-relaxed">{desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ sections */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-14">
          {FAQS.map(({ id, section, items }) => (
            <div key={id} id={id}>
              <p className="text-[11px] font-bold text-brand uppercase tracking-[0.15em] mb-4">{section}</p>
              <div className="space-y-3">
                {items.map(({ q, a }) => (
                  <div key={q} className="bg-canvas rounded-2xl border border-border-dim p-5 sm:p-6">
                    <p className="font-bold text-sm text-ink mb-2">{q}</p>
                    <p className="text-sm text-ink-sub leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 sm:py-24 bg-canvas">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-border-dim shadow-elevated px-6 py-10 sm:px-10 sm:py-12 text-center">
            <div className="w-12 h-12 bg-brand-muted rounded-2xl flex items-center justify-center mx-auto mb-5">
              <MessageCircle className="w-6 h-6 text-brand" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-ink mb-2">Still need help?</h2>
            <p className="text-ink-sub text-sm leading-relaxed mb-6 max-w-xs mx-auto">
              Our support team is available Monday–Friday, 9am–6pm. We typically respond within a few hours.
            </p>
            <a
              href="mailto:support@aladdin.lt"
              className="inline-flex items-center gap-2 bg-brand text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Email support@aladdin.lt
            </a>
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
