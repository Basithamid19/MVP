import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-canvas px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-3">Legal</p>
        <h1 className="text-3xl font-bold text-ink mb-4">Terms of Service</h1>
        <p className="text-ink-sub leading-relaxed mb-8">
          These are the terms of service governing your use of the Aladdin marketplace. By using
          Aladdin you agree to these terms. Full terms of service are coming soon.
        </p>
        <Link href="/" className="text-brand font-semibold text-sm hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  )
}
