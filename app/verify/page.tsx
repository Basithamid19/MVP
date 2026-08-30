'use client';

import { AladdinIcon } from '@/components/icons';
import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, MailCheck, MessageSquare } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const channel = searchParams.get('channel') === 'sms' ? 'sms' : 'email';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const router = useRouter();
  const t = useTranslation();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    setNotice('');

    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, channel }),
      });

      if (res.status === 429) {
        setError(t.authFlow.resendThrottled);
      } else {
        setNotice(t.authFlow.resendSent);
        setCooldown(RESEND_COOLDOWN_SECONDS);
      }
    } catch (err) {
      setError(t.authFlow.genericError);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (res.ok) {
        router.push('/login?verified=1');
      } else {
        setError(t.authFlow.codeInvalid);
      }
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

          <h1 className="text-4xl font-bold tracking-tight text-ink mb-2">
            {channel === 'sms' ? t.authFlow.verifySmsTitle : t.authFlow.verifyEmailTitle}.
          </h1>
          <p className="text-ink-sub mb-10">
            {channel === 'sms' ? (
              t.authFlow.verifySmsBody
            ) : (
              <>
                {t.authFlow.verifyEmailBody}{' '}
                <span className="font-bold text-ink">{email}</span>.
              </>
            )}
          </p>

          <div className="space-y-6">
            {error && (
              <div className="p-4 bg-danger-surface border border-danger-edge text-danger text-sm font-medium rounded-input">
                {error}
              </div>
            )}
            {notice && (
              <div className="p-4 bg-trust-surface border border-trust-edge text-trust text-sm font-medium rounded-input">
                {notice}
              </div>
            )}

            {channel === 'sms' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-2 block">{t.authFlow.codeLabel}</label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-4 bg-white border border-border rounded-input focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all text-ink placeholder:text-ink-dim tracking-[0.4em] font-bold"
                    placeholder={t.authFlow.codePlaceholder}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-brand text-white p-4 rounded-input font-bold hover:bg-brand-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.authFlow.verifyButton}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            ) : (
              <div className="p-4 bg-surface-alt border border-border-dim rounded-input flex items-start gap-3">
                <MailCheck className="w-5 h-5 text-ink-dim shrink-0 mt-0.5" />
                <p className="text-sm text-ink-sub">{t.authFlow.spamNote}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="w-full bg-white text-ink p-4 rounded-input font-bold border border-border hover:bg-surface-alt transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {resending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : cooldown > 0 ? (
                `${t.authFlow.resendCooldownPrefix} ${cooldown}s`
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  {t.authFlow.resendButton}
                </>
              )}
            </button>
          </div>

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
            <h2 className="text-3xl font-bold tracking-tight text-ink mb-4">
              {channel === 'sms' ? t.authFlow.verifySmsTitle : t.authFlow.verifyEmailTitle}.
            </h2>
            <p className="text-ink-sub leading-relaxed text-lg">
              {channel === 'sms' ? t.authFlow.verifySmsBody : t.authFlow.spamNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
