import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-canvas px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <p className="text-[11px] font-bold text-brand uppercase tracking-widest mb-3">Company</p>
        <h1 className="text-3xl font-bold text-ink mb-4">About Aladdin</h1>
        <p className="text-ink-sub leading-relaxed mb-8">
          Aladdin connects you with trusted local professionals in Vilnius. Whether you need a
          plumber, electrician, cleaner, or any other home service, we make it easy to find,
          compare, and book verified pros — quickly and confidently. More information coming soon.
        </p>
        <Link href="/" className="text-brand font-semibold text-sm hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  )
}
