'use client';

import {
  CalendarCheck, CreditCard, UserCircle, Wrench, MessageCircle, ShieldCheck,
  ChevronRight, ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

/* Topic cards and FAQ sections were two parallel lists that had to be kept in
 * sync by hand (and the cards pointed at ids that had no scroll offset under a
 * sticky nav). One list now drives both: each topic IS the section. */

interface Topic {
  id:    string;
  icon:  LucideIcon;
  title: string;
  desc:  string;
  faqs:  { q: string; a: string }[];
}

const TOPICS: Topic[] = [
  {
    id: 'bookings',
    icon: CalendarCheck,
    title: 'Bookings & scheduling',
    desc: 'How to book, reschedule, or cancel a service.',
    faqs: [
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
    icon: CreditCard,
    title: 'Payments & refunds',
    desc: 'Billing questions, refund policy, and the 30-day guarantee.',
    faqs: [
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
    icon: UserCircle,
    title: 'My account',
    desc: 'Managing your profile, email, and notification settings.',
    faqs: [
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
    icon: Wrench,
    title: 'For professionals',
    desc: 'Verification, leads, payouts, and your Pro dashboard.',
    faqs: [
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
    icon: ShieldCheck,
    title: 'Trust & safety',
    desc: 'How we verify pros and what to do if something goes wrong.',
    faqs: [
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

/* The contact card has no FAQ body — it targets the contact section below. */
const CONTACT_CARD = {
  id: 'contact',
  icon: MessageCircle,
  title: 'Contact us',
  desc: 'Reach our support team directly by email.',
};

const CARDS = [
  ...TOPICS.map(({ id, icon, title, desc }) => ({ id, icon, title, desc })),
  CONTACT_CARD,
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-card">

      <SiteNav />

      {/* Hero */}
      <section className="pt-16 sm:pt-24 pb-16 sm:pb-20 bg-canvas">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-2xs font-bold text-brand uppercase tracking-[0.15em] mb-5">Help centre</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.08] mb-5">
            How can we help?
          </h1>
          <p className="text-ink-sub text-base sm:text-lg leading-relaxed max-w-md mx-auto">
            Find answers to common questions below, or get in touch with our support team directly.
          </p>
        </div>
      </section>

      {/* Topic index — one row per topic on mobile, a card grid from sm up */}
      <section className="py-10 sm:py-14 bg-card border-y border-border-dim">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {CARDS.map(({ id, icon: Icon, title, desc }) => (
              <a
                key={id}
                href={`#${id}`}
                className="group flex items-center gap-4 sm:block bg-canvas rounded-card border border-border-dim p-4 sm:p-5 hover:border-brand/30 hover:shadow-elevated transition-all duration-150"
              >
                <div className="w-10 h-10 bg-brand-muted rounded-input flex items-center justify-center shrink-0 sm:mb-3">
                  <Icon className="w-5 h-5 text-brand" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-ink mb-1 group-hover:text-brand transition-colors">{title}</p>
                  <p className="text-xs text-ink-sub leading-relaxed">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-dim shrink-0 sm:hidden" strokeWidth={2} />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ sections — each topic card lands on one of these */}
      <section className="py-16 sm:py-24 bg-canvas">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-14">
          {TOPICS.map(({ id, icon: Icon, title, faqs }) => (
            <section key={id} id={id} className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-brand-muted rounded-input flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand" strokeWidth={1.75} />
                </div>
                <h2 className="font-bold text-lg tracking-tight text-ink">{title}</h2>
              </div>

              <div className="space-y-2">
                {faqs.map(({ q, a }) => (
                  <details
                    key={q}
                    className="group bg-card rounded-card border border-border-dim px-5 py-4 sm:px-6"
                  >
                    <summary className="flex items-start justify-between gap-3 text-sm font-bold text-ink cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0">{q}</span>
                      <ChevronDown
                        className="w-4 h-4 text-ink-dim shrink-0 mt-0.5 transition-transform duration-150 group-open:rotate-180"
                        strokeWidth={2}
                      />
                    </summary>
                    <p className="text-sm text-ink-sub leading-relaxed pt-2">{a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-24 py-16 sm:py-24 bg-card">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="bg-canvas rounded-card border border-border-dim shadow-elevated px-6 py-10 sm:px-10 sm:py-12 text-center">
            <div className="w-12 h-12 bg-brand-muted rounded-card flex items-center justify-center mx-auto mb-5">
              <MessageCircle className="w-6 h-6 text-brand" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-ink mb-2">Still need help?</h2>
            <p className="text-ink-sub text-sm leading-relaxed mb-6 max-w-xs mx-auto">
              Our support team is available Monday–Friday, 9am–6pm. We typically respond within a few hours.
            </p>
            <a
              href="mailto:support@aladdin.lt"
              className={buttonVariants({ variant: 'primary', size: 'lg' })}
            >
              <MessageCircle className="w-4 h-4" />
              Email support@aladdin.lt
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />

    </div>
  );
}
