import Link from 'next/link';

const SECTIONS = [
  {
    id: 'overview',
    title: '1. Overview',
    content: `Aladdin Marketplace ("Aladdin", "we", "our", "us") is committed to protecting your personal data. This Privacy Policy explains what information we collect, how we use it, and your rights under the General Data Protection Regulation (GDPR) and applicable Lithuanian law.

By using the Aladdin platform, you acknowledge that you have read and understood this policy. If you have questions, contact us at privacy@aladdin.lt.`,
  },
  {
    id: 'what-we-collect',
    title: '2. Information We Collect',
    content: `We collect the following categories of personal data:

Account information
When you register, we collect your name, email address, phone number, and password (stored as a one-way hash).

Booking and transaction data
When you book a service or receive payment, we collect billing details, transaction records, service address, and booking history.

Identity verification (Providers only)
To verify professionals, we collect government-issued ID documents, a selfie photo, and business registration details where applicable. These are processed by our third-party verification partner.

Usage data
We collect information about how you use the platform, including pages visited, search queries, device type, browser, and IP address.

Communications
Messages sent through the platform between customers and providers are stored to enable communication, resolve disputes, and improve the service.`,
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Information',
    content: `We use your personal data for the following purposes:

• To operate and provide the Aladdin platform, including processing bookings and payments
• To verify the identity of professionals before they can accept bookings
• To communicate with you about your account, bookings, and platform updates
• To investigate disputes, enforce our Terms of Service, and detect fraud
• To improve our platform through analytics and usage data (processed in aggregate and anonymised form)
• To comply with legal obligations, including tax reporting and fraud prevention

We rely on the following legal bases: contract performance (to fulfil bookings), legitimate interests (platform improvement, fraud detection), legal obligation, and consent where specifically requested.`,
  },
  {
    id: 'sharing',
    title: '4. Sharing Your Data',
    content: `We do not sell your personal data. We share data only in the following circumstances:

With service providers
When you book a service, your name, contact number, and address are shared with the Provider to enable the job.

With payment processors
Payment data is processed by our payment provider in compliance with PCI-DSS standards. We do not store full card numbers.

With identity verification partners
Provider ID documents are shared with our verification partner solely for the purpose of verifying identity.

With authorities
We may disclose data to law enforcement or regulatory authorities where required by law or to protect the safety of users.

All third-party partners are subject to data processing agreements and are prohibited from using your data for any purpose beyond the contracted service.`,
  },
  {
    id: 'retention',
    title: '5. Data Retention',
    content: `We retain your personal data for as long as necessary to provide our services and comply with legal obligations:

• Active account data: retained while your account is open
• Booking and transaction records: retained for 7 years for tax and legal compliance
• Identity verification documents: retained for 1 year after Provider account closure, then securely deleted
• Usage and analytics data: retained for 24 months in identifiable form, then anonymised

You may request deletion of your account at any time. Booking records required for tax compliance may be retained in pseudonymised form after deletion.`,
  },
  {
    id: 'cookies',
    title: '6. Cookies',
    content: `We use cookies and similar technologies to operate the platform and understand how it is used.

Essential cookies are required for the platform to function (authentication, session management). These cannot be disabled.

Analytics cookies help us understand usage patterns and improve the platform. These are only placed with your consent.

You can manage cookie preferences via your browser settings. Blocking essential cookies will prevent the platform from functioning correctly.`,
  },
  {
    id: 'rights',
    title: '7. Your Rights',
    content: `Under GDPR, you have the following rights regarding your personal data:

• Right of access: request a copy of the personal data we hold about you
• Right to rectification: request correction of inaccurate or incomplete data
• Right to erasure: request deletion of your data, subject to legal retention requirements
• Right to restriction: request that we limit how we process your data in certain circumstances
• Right to data portability: receive your data in a structured, machine-readable format
• Right to object: object to processing based on legitimate interests

To exercise any of these rights, contact privacy@aladdin.lt. We will respond within 30 days. You also have the right to lodge a complaint with the State Data Protection Inspectorate of Lithuania (vdai.lrv.lt).`,
  },
  {
    id: 'security',
    title: '8. Security',
    content: `We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, loss, or disclosure. These include encryption at rest and in transit (TLS), access controls, and regular security reviews.

No method of transmission over the internet is completely secure. If you believe your account has been compromised, contact support@aladdin.lt immediately.`,
  },
  {
    id: 'changes',
    title: '9. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or by posting a prominent notice on the platform. The updated date is shown at the bottom of this page.`,
  },
  {
    id: 'contact',
    title: '10. Contact',
    content: `For privacy-related questions or to exercise your rights, contact:

Aladdin Marketplace — Data Controller
Vilnius, Lithuania
privacy@aladdin.lt`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="border-b border-border-dim sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
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
            Privacy Policy
          </h1>
          <p className="text-ink-sub text-base leading-relaxed">
            We take your privacy seriously. This policy explains what data we collect, how we use it, and your rights under GDPR.
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
            <Link href="/terms" className="text-ink-sub hover:text-ink transition-colors">Terms</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
