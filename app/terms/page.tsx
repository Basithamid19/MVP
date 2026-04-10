import Link from 'next/link';
import { AladdinIcon } from '@/components/icons';

const SECTIONS = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By accessing or using the Aladdin platform ("Aladdin", "we", "our", "us"), including our website and mobile applications, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.

These terms apply to all users of the platform, including customers who book services and professionals who provide services ("Providers").`,
  },
  {
    id: 'services',
    title: '2. Platform Services',
    content: `Aladdin is a marketplace that connects customers with independent service providers. We do not ourselves provide home services. Providers are independent contractors and not employees, agents, or representatives of Aladdin.

Aladdin is not responsible for the quality, safety, or legality of the services offered by Providers, or for the accuracy of Provider listings. We facilitate bookings and payments, provide dispute resolution support, and operate the customer guarantee programme.`,
  },
  {
    id: 'accounts',
    title: '3. User Accounts',
    content: `To use certain features of the platform, you must create an account. You agree to:

• Provide accurate and complete registration information
• Keep your login credentials confidential and not share them with others
• Notify us immediately at support@aladdin.lt of any unauthorised access to your account
• Take responsibility for all activity that occurs under your account

You must be at least 18 years old to create an account. We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    id: 'bookings',
    title: '4. Bookings & Payments',
    content: `When you book a service through Aladdin, you enter into a contract directly with the Provider. Aladdin facilitates the booking and payment process.

Payment is processed securely via our payment provider. Funds are held until the job is marked complete, at which point the Provider is paid minus our platform fee. All prices displayed include VAT where applicable.

Cancellations made more than 24 hours before the scheduled appointment are free of charge. Cancellations within 24 hours may be subject to a cancellation fee at the Provider's discretion.`,
  },
  {
    id: 'guarantee',
    title: '5. 30-Day Guarantee',
    content: `Aladdin offers a 30-day satisfaction guarantee on all completed bookings. If you are not satisfied with the work performed, contact us within 30 days of completion at support@aladdin.lt.

We will first arrange a free return visit from the original Provider to remedy the issue. If the issue cannot be resolved, we will issue a full refund of the amount paid.

The guarantee does not apply to damage caused by the customer, change of mind, or services outside the agreed scope of work.`,
  },
  {
    id: 'providers',
    title: '6. Provider Terms',
    content: `Providers who join Aladdin agree to:

• Provide accurate information about their qualifications, services, and pricing
• Complete identity and background verification before receiving leads
• Maintain required licences and insurance for their trade
• Deliver services professionally and to the standard described in their profile
• Honour bookings they accept and provide adequate notice if unable to fulfil

Aladdin charges a service fee of 12% on each completed transaction. Payouts are made weekly via SEPA bank transfer. Providers may be suspended or removed for repeated poor performance, customer complaints, or violation of these terms.`,
  },
  {
    id: 'prohibited',
    title: '7. Prohibited Conduct',
    content: `You agree not to:

• Use the platform for any unlawful purpose or in violation of any applicable law
• Circumvent the platform by arranging payment directly with Providers outside of Aladdin for bookings initiated through the platform
• Post false, misleading, or fraudulent reviews or information
• Harass, threaten, or intimidate other users or Providers
• Attempt to gain unauthorised access to any part of the platform
• Use automated tools to scrape, crawl, or extract data from the platform`,
  },
  {
    id: 'liability',
    title: '8. Limitation of Liability',
    content: `To the maximum extent permitted by applicable law, Aladdin shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.

Our total liability to you for any claim arising out of or relating to these terms or the platform shall not exceed the amount you paid for the booking giving rise to the claim.

Nothing in these terms excludes or limits liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law.`,
  },
  {
    id: 'changes',
    title: '9. Changes to These Terms',
    content: `We may update these Terms of Service from time to time. When we make material changes, we will notify you by email or by posting a notice on the platform. Your continued use of the platform after such notice constitutes your acceptance of the updated terms.

The date these terms were last updated is shown at the bottom of this page.`,
  },
  {
    id: 'contact',
    title: '10. Contact',
    content: `If you have questions about these Terms of Service, please contact us at:

Aladdin Marketplace
Vilnius, Lithuania
support@aladdin.lt`,
  },
];

export default function TermsPage() {
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

      {/* Header */}
      <section className="pt-16 sm:pt-20 pb-10 sm:pb-14 bg-canvas border-b border-border-dim">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <p className="text-[11px] font-bold text-brand uppercase tracking-[0.15em] mb-4">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink mb-4">
            Terms of Service
          </h1>
          <p className="text-ink-sub text-base leading-relaxed">
            Please read these terms carefully before using Aladdin. By using the platform you agree to be bound by them.
          </p>
          <p className="text-xs text-ink-dim mt-4">Last updated: 1 January 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="space-y-10">
            {SECTIONS.map(({ id, title, content }) => (
              <div key={id} id={id}>
                <h2 className="text-lg font-bold text-ink mb-3">{title}</h2>
                <div className="text-sm text-ink-sub leading-[1.8] whitespace-pre-line">
                  {content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-canvas border-t border-border-dim py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-dim">&copy; 2026 Aladdin Marketplace. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/" className="text-ink-sub hover:text-ink transition-colors">Home</Link>
            <Link href="/support" className="text-ink-sub hover:text-ink transition-colors">Support</Link>
            <Link href="/privacy" className="text-ink-sub hover:text-ink transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
