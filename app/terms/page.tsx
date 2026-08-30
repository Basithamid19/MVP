import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { LegalDoc } from '@/components/marketing';
import type { LegalSection } from '@/components/marketing';

/* Copy below is verbatim from the previous `whitespace-pre-line` blobs — only
 * the structure changed (paragraph breaks → `p`, "• " runs → `ul`). */
const SECTIONS: LegalSection[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    blocks: [
      { type: 'p', text: 'By accessing or using the Aladdin platform ("Aladdin", "we", "our", "us"), including our website and mobile applications, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.' },
      { type: 'p', text: 'These terms apply to all users of the platform, including customers who book services and professionals who provide services ("Providers").' },
    ],
  },
  {
    id: 'services',
    title: '2. Platform Services',
    blocks: [
      { type: 'p', text: 'Aladdin is a marketplace that connects customers with independent service providers. We do not ourselves provide home services. Providers are independent contractors and not employees, agents, or representatives of Aladdin.' },
      { type: 'p', text: 'Aladdin is not responsible for the quality, safety, or legality of the services offered by Providers, or for the accuracy of Provider listings. We facilitate bookings and payments, provide dispute resolution support, and operate the customer guarantee programme.' },
    ],
  },
  {
    id: 'accounts',
    title: '3. User Accounts',
    blocks: [
      { type: 'p', text: 'To use certain features of the platform, you must create an account. You agree to:' },
      {
        type: 'ul',
        items: [
          'Provide accurate and complete registration information',
          'Keep your login credentials confidential and not share them with others',
          'Notify us immediately at support@aladdin.lt of any unauthorised access to your account',
          'Take responsibility for all activity that occurs under your account',
        ],
      },
      { type: 'p', text: 'You must be at least 18 years old to create an account. We reserve the right to suspend or terminate accounts that violate these terms.' },
    ],
  },
  {
    id: 'bookings',
    title: '4. Bookings & Payments',
    blocks: [
      { type: 'p', text: 'When you book a service through Aladdin, you enter into a contract directly with the Provider. Aladdin facilitates the booking and payment process.' },
      { type: 'p', text: 'Payment is processed securely via our payment provider. Funds are held until the job is marked complete, at which point the Provider is paid minus our platform fee. All prices displayed include VAT where applicable.' },
      { type: 'p', text: 'Cancellations made more than 24 hours before the scheduled appointment are free of charge. Cancellations within 24 hours may be subject to a cancellation fee at the Provider\'s discretion.' },
    ],
  },
  {
    id: 'guarantee',
    title: '5. 30-Day Guarantee',
    blocks: [
      { type: 'p', text: 'Aladdin offers a 30-day satisfaction guarantee on all completed bookings. If you are not satisfied with the work performed, contact us within 30 days of completion at support@aladdin.lt.' },
      { type: 'p', text: 'We will first arrange a free return visit from the original Provider to remedy the issue. If the issue cannot be resolved, we will issue a full refund of the amount paid.' },
      { type: 'p', text: 'The guarantee does not apply to damage caused by the customer, change of mind, or services outside the agreed scope of work.' },
    ],
  },
  {
    id: 'providers',
    title: '6. Provider Terms',
    blocks: [
      { type: 'p', text: 'Providers who join Aladdin agree to:' },
      {
        type: 'ul',
        items: [
          'Provide accurate information about their qualifications, services, and pricing',
          'Complete identity and background verification before receiving leads',
          'Maintain required licences and insurance for their trade',
          'Deliver services professionally and to the standard described in their profile',
          'Honour bookings they accept and provide adequate notice if unable to fulfil',
        ],
      },
      { type: 'p', text: 'Aladdin charges a service fee of 12% on each completed transaction. Payouts are made weekly via SEPA bank transfer. Providers may be suspended or removed for repeated poor performance, customer complaints, or violation of these terms.' },
    ],
  },
  {
    id: 'prohibited',
    title: '7. Prohibited Conduct',
    blocks: [
      { type: 'p', text: 'You agree not to:' },
      {
        type: 'ul',
        items: [
          'Use the platform for any unlawful purpose or in violation of any applicable law',
          'Circumvent the platform by arranging payment directly with Providers outside of Aladdin for bookings initiated through the platform',
          'Post false, misleading, or fraudulent reviews or information',
          'Harass, threaten, or intimidate other users or Providers',
          'Attempt to gain unauthorised access to any part of the platform',
          'Use automated tools to scrape, crawl, or extract data from the platform',
        ],
      },
    ],
  },
  {
    id: 'liability',
    title: '8. Limitation of Liability',
    blocks: [
      { type: 'p', text: 'To the maximum extent permitted by applicable law, Aladdin shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.' },
      { type: 'p', text: 'Our total liability to you for any claim arising out of or relating to these terms or the platform shall not exceed the amount you paid for the booking giving rise to the claim.' },
      { type: 'p', text: 'Nothing in these terms excludes or limits liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law.' },
    ],
  },
  {
    id: 'changes',
    title: '9. Changes to These Terms',
    blocks: [
      { type: 'p', text: 'We may update these Terms of Service from time to time. When we make material changes, we will notify you by email or by posting a notice on the platform. Your continued use of the platform after such notice constitutes your acceptance of the updated terms.' },
      { type: 'p', text: 'The date these terms were last updated is shown at the bottom of this page.' },
    ],
  },
  {
    id: 'contact',
    title: '10. Contact',
    blocks: [
      { type: 'p', text: 'If you have questions about these Terms of Service, please contact us at:' },
      { type: 'address', lines: ['Aladdin Marketplace', 'Vilnius, Lithuania', 'support@aladdin.lt'] },
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-card">

      <SiteNav />

      {/* Header */}
      <section className="pt-16 sm:pt-20 pb-10 sm:pb-14 bg-canvas border-b border-border-dim">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-2xs font-bold text-brand uppercase tracking-[0.15em] mb-4">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-4">
              Terms of Service
            </h1>
            <p className="text-ink-sub text-base leading-relaxed">
              Please read these terms carefully before using Aladdin. By using the platform you agree to be bound by them.
            </p>
            <p className="text-xs text-ink-dim mt-4">Last updated: 1 January 2026</p>
          </div>
        </div>
      </section>

      <LegalDoc sections={SECTIONS} />

      <SiteFooter />

    </div>
  );
}
