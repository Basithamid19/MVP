'use client';

import { AladdinIcon } from '@/components/icons';
import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, MailCheck, MessageSquare } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AuthShowcase from '@/components/AuthShowcase';
import { Button, Input } from '@/components/ui';

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
                <Input
                  label={t.authFlow.codeLabel}
                  type="text"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="tracking-[0.4em] font-bold text-base"
                  placeholder={t.authFlow.codePlaceholder}
                />

                <Button
                  type="submit"
                  size="xl"
                  className="w-full"
                  loading={loading}
                  disabled={code.length !== 6}
                >
                  {t.authFlow.verifyButton}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <div className="p-4 bg-surface-alt border border-border-dim rounded-input flex items-start gap-3">
                <MailCheck className="w-5 h-5 text-ink-dim shrink-0 mt-0.5" />
                <p className="text-sm text-ink-sub">{t.authFlow.spamNote}</p>
              </div>
            )}

            <Button
              type="button"
              variant="secondary"
              size="xl"
              className="w-full"
              onClick={handleResend}
              loading={resending}
              disabled={cooldown > 0}
            >
              {cooldown > 0 ? (
                `${t.authFlow.resendCooldownPrefix} ${cooldown}s`
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  {t.authFlow.resendButton}
                </>
              )}
            </Button>
          </div>

          <div className="mt-10 pt-10 border-t border-border-dim text-center">
            <p className="text-sm text-ink-sub">
              <Link href="/login" className="text-brand font-bold hover:underline">{t.authFlow.backToLogin}</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Distinct reassurance copy — the panel must not parrot the left column,
          which already carries the channel-specific instructions. */}
      <AuthShowcase title={t.authShowcase.verifyTitle} subtitle={t.authShowcase.verifySubtitle} />
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
