import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { LegalDoc } from '@/components/marketing';
import type { LegalSection } from '@/components/marketing';

/* Copy below is verbatim from the previous `whitespace-pre-line` blobs — only
 * the structure changed: paragraph breaks → `p`, "• " runs → `ul`, and the nine
 * single-line subheads that used to read as body text → `h3`. */
const SECTIONS: LegalSection[] = [
  {
    id: 'overview',
    title: '1. Overview',
    blocks: [
      { type: 'p', text: 'Aladdin Marketplace ("Aladdin", "we", "our", "us") is committed to protecting your personal data. This Privacy Policy explains what information we collect, how we use it, and your rights under the General Data Protection Regulation (GDPR) and applicable Lithuanian law.' },
      { type: 'p', text: 'By using the Aladdin platform, you acknowledge that you have read and understood this policy. If you have questions, contact us at privacy@aladdin.lt.' },
    ],
  },
  {
    id: 'what-we-collect',
    title: '2. Information We Collect',
    blocks: [
      { type: 'p',  text: 'We collect the following categories of personal data:' },
      { type: 'h3', text: 'Account information' },
      { type: 'p',  text: 'When you register, we collect your name, email address, phone number, and password (stored as a one-way hash).' },
      { type: 'h3', text: 'Booking and transaction data' },
      { type: 'p',  text: 'When you book a service or receive payment, we collect billing details, transaction records, service address, and booking history.' },
      { type: 'h3', text: 'Identity verification (Providers only)' },
      { type: 'p',  text: 'To verify professionals, we collect government-issued ID documents, a selfie photo, and business registration details where applicable. These are processed by our third-party verification partner.' },
      { type: 'h3', text: 'Usage data' },
      { type: 'p',  text: 'We collect information about how you use the platform, including pages visited, search queries, device type, browser, and IP address.' },
      { type: 'h3', text: 'Communications' },
      { type: 'p',  text: 'Messages sent through the platform between customers and providers are stored to enable communication, resolve disputes, and improve the service.' },
    ],
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Information',
    blocks: [
      { type: 'p', text: 'We use your personal data for the following purposes:' },
      {
        type: 'ul',
        items: [
          'To operate and provide the Aladdin platform, including processing bookings and payments',
          'To verify the identity of professionals before they can accept bookings',
          'To communicate with you about your account, bookings, and platform updates',
          'To investigate disputes, enforce our Terms of Service, and detect fraud',
          'To improve our platform through analytics and usage data (processed in aggregate and anonymised form)',
          'To comply with legal obligations, including tax reporting and fraud prevention',
        ],
      },
      { type: 'p', text: 'We rely on the following legal bases: contract performance (to fulfil bookings), legitimate interests (platform improvement, fraud detection), legal obligation, and consent where specifically requested.' },
    ],
  },
  {
    id: 'sharing',
    title: '4. Sharing Your Data',
    blocks: [
      { type: 'p',  text: 'We do not sell your personal data. We share data only in the following circumstances:' },
      { type: 'h3', text: 'With service providers' },
      { type: 'p',  text: 'When you book a service, your name, contact number, and address are shared with the Provider to enable the job.' },
      { type: 'h3', text: 'With payment processors' },
      { type: 'p',  text: 'Payment data is processed by our payment provider in compliance with PCI-DSS standards. We do not store full card numbers.' },
      { type: 'h3', text: 'With identity verification partners' },
      { type: 'p',  text: 'Provider ID documents are shared with our verification partner solely for the purpose of verifying identity.' },
      { type: 'h3', text: 'With authorities' },
      { type: 'p',  text: 'We may disclose data to law enforcement or regulatory authorities where required by law or to protect the safety of users.' },
      { type: 'p',  text: 'All third-party partners are subject to data processing agreements and are prohibited from using your data for any purpose beyond the contracted service.' },
    ],
  },
  {
    id: 'retention',
    title: '5. Data Retention',
    blocks: [
      { type: 'p', text: 'We retain your personal data for as long as necessary to provide our services and comply with legal obligations:' },
      {
        type: 'ul',
        items: [
          'Active account data: retained while your account is open',
          'Booking and transaction records: retained for 7 years for tax and legal compliance',
          'Identity verification documents: retained for 1 year after Provider account closure, then securely deleted',
          'Usage and analytics data: retained for 24 months in identifiable form, then anonymised',
        ],
      },
      { type: 'p', text: 'You may request deletion of your account at any time. Booking records required for tax compliance may be retained in pseudonymised form after deletion.' },
    ],
  },
  {
    id: 'cookies',
    title: '6. Cookies',
    blocks: [
      { type: 'p', text: 'We use cookies and similar technologies to operate the platform and understand how it is used.' },
      { type: 'p', text: 'Essential cookies are required for the platform to function (authentication, session management). These cannot be disabled.' },
      { type: 'p', text: 'Analytics cookies help us understand usage patterns and improve the platform. These are only placed with your consent.' },
      { type: 'p', text: 'You can manage cookie preferences via your browser settings. Blocking essential cookies will prevent the platform from functioning correctly.' },
    ],
  },
  {
    id: 'rights',
    title: '7. Your Rights',
    blocks: [
      { type: 'p', text: 'Under GDPR, you have the following rights regarding your personal data:' },
      {
        type: 'ul',
        items: [
          'Right of access: request a copy of the personal data we hold about you',
          'Right to rectification: request correction of inaccurate or incomplete data',
          'Right to erasure: request deletion of your data, subject to legal retention requirements',
          'Right to restriction: request that we limit how we process your data in certain circumstances',
          'Right to data portability: receive your data in a structured, machine-readable format',
          'Right to object: object to processing based on legitimate interests',
        ],
      },
      { type: 'p', text: 'To exercise any of these rights, contact privacy@aladdin.lt. We will respond within 30 days. You also have the right to lodge a complaint with the State Data Protection Inspectorate of Lithuania (vdai.lrv.lt).' },
    ],
  },
  {
    id: 'security',
    title: '8. Security',
    blocks: [
      { type: 'p', text: 'We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, loss, or disclosure. These include encryption at rest and in transit (TLS), access controls, and regular security reviews.' },
      { type: 'p', text: 'No method of transmission over the internet is completely secure. If you believe your account has been compromised, contact support@aladdin.lt immediately.' },
    ],
  },
  {
    id: 'changes',
    title: '9. Changes to This Policy',
    blocks: [
      { type: 'p', text: 'We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or by posting a prominent notice on the platform. The updated date is shown at the bottom of this page.' },
    ],
  },
  {
    id: 'contact',
    title: '10. Contact',
    blocks: [
      { type: 'p', text: 'For privacy-related questions or to exercise your rights, contact:' },
      { type: 'address', lines: ['Aladdin Marketplace — Data Controller', 'Vilnius, Lithuania', 'privacy@aladdin.lt'] },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-card">

      <SiteNav />

      {/* Header */}
      <section className="pt-16 sm:pt-20 pb-10 sm:pb-14 bg-canvas border-b border-border-dim">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-2xs font-bold text-brand uppercase tracking-[0.15em] mb-4">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-4">
              Privacy Policy
            </h1>
            <p className="text-ink-sub text-base leading-relaxed">
              We take your privacy seriously. This policy explains what data we collect, how we use it, and your rights under GDPR.
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
