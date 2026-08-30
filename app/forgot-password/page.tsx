'use client';

import { AladdinIcon } from '@/components/icons';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, ArrowRight, MailCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  // null while we don't know yet — the form renders optimistically and only
  // gets replaced if the deployment has no email provider at all.
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const t = useTranslation();

  useEffect(() => {
    fetch('/api/auth/verification-channels')
      .then((res) => res.json())
      .then((data) => setEmailAvailable(!!data?.email))
      .catch(() => setEmailAvailable(null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // The endpoint is deliberately enumeration-safe: same answer either way.
      setSent(true);
    } catch (err) {
      setError(t.authFlow.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col lg:flex-row overflow-hidden">
      <div className="flex-1 flex flex-col lg:justify-center px-8 lg:px-24 pt-12 pb-12 lg:py-12 relative z-10">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center justify-between mb-10">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand rounded-input flex items-center justify-center shrink-0">
                <AladdinIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-ink">Aladdin</span>
            </Link>
            <LanguageSwitcher />
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-ink mb-2">{t.authFlow.forgotTitle}.</h1>
          <p className="text-ink-sub mb-10">{t.authFlow.forgotSubtitle}.</p>

          {emailAvailable === false ? (
            <div className="p-4 bg-caution-surface border border-caution-edge text-caution text-sm font-medium rounded-input">
              {t.authFlow.forgotUnavailable}
            </div>
          ) : sent ? (
            <div className="p-4 bg-trust-surface border border-trust-edge text-trust text-sm font-medium rounded-input flex items-start gap-3">
              <MailCheck className="w-5 h-5 shrink-0" />
              {t.authFlow.forgotSent}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-danger-surface border border-danger-edge text-danger text-sm font-medium rounded-input">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-2 block">{t.auth.email}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-4 bg-white border border-border rounded-input focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all text-ink placeholder:text-ink-dim"
                  placeholder="name@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand text-white p-4 rounded-input font-bold hover:bg-brand-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.authFlow.forgotButton}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          <div className="mt-10 pt-10 border-t border-border-dim text-center">
            <p className="text-sm text-ink-sub">
              <Link href="/login" className="text-brand font-bold hover:underline">{t.authFlow.backToLogin}</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:40px_40px] opacity-50"></div>
        <div className="relative w-[600px] h-[600px] shrink-0 bg-white rounded-full shadow-float flex items-center justify-center p-20 border border-border-dim">
          <div className="text-center">
            <div className="w-20 h-20 bg-brand rounded-panel flex items-center justify-center mx-auto mb-8 shadow-elevated">
              <AladdinIcon className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-ink mb-4">{t.authFlow.forgotTitle}.</h2>
            <p className="text-ink-sub leading-relaxed text-lg">{t.authFlow.forgotSubtitle}.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
