import Link from 'next/link'

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-canvas px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-3">Help</p>
        <h1 className="text-3xl font-bold text-ink mb-4">Support</h1>
        <p className="text-ink-sub leading-relaxed mb-8">
          Need help with a booking, a professional, or your account? Our support team is here for
          you. Full support resources and contact options are coming soon.
        </p>
        <Link href="/" className="text-brand font-semibold text-sm hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  )
}
