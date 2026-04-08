import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-canvas px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-3">Legal</p>
        <h1 className="text-3xl font-bold text-ink mb-4">Privacy Policy</h1>
        <p className="text-ink-sub leading-relaxed mb-8">
          Your privacy matters to us. Aladdin collects only the data necessary to connect you with
          trusted local professionals and improve your experience. Full privacy policy is coming soon.
        </p>
        <Link href="/" className="text-brand font-semibold text-sm hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  )
}
