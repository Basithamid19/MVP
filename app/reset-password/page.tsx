'use client';

import { AladdinIcon } from '@/components/icons';
import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, MailCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const MIN_PASSWORD_LENGTH = 8;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const t = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t.authFlow.passwordTooShort);
      return;
    }
    if (password !== confirm) {
      setError(t.authFlow.resetMismatch);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setDone(true);
      } else {
        setError(t.authFlow.resetMissingToken);
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

          <h1 className="text-4xl font-bold tracking-tight text-ink mb-2">{t.authFlow.resetTitle}.</h1>
          <p className="text-ink-sub mb-10">{t.authFlow.resetSubtitle}.</p>

          {!token ? (
            <div className="p-4 bg-caution-surface border border-caution-edge text-caution text-sm font-medium rounded-input">
              {t.authFlow.resetMissingToken}
            </div>
          ) : done ? (
            <div className="space-y-6">
              <div className="p-4 bg-trust-surface border border-trust-edge text-trust text-sm font-medium rounded-input flex items-start gap-3">
                <MailCheck className="w-5 h-5 shrink-0" />
                {t.authFlow.resetSuccess}
              </div>
              <Link
                href="/login"
                className="w-full bg-brand text-white p-4 rounded-input font-bold hover:bg-brand-dark transition-all flex items-center justify-center gap-2"
              >
                {t.authFlow.goToLogin}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-danger-surface border border-danger-edge text-danger text-sm font-medium rounded-input">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-2 block">{t.authFlow.newPassword}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 bg-white border border-border rounded-input focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all text-ink placeholder:text-ink-dim"
                  placeholder="••••••••"
                />
                <p className="text-xs text-ink-dim mt-2">{t.authFlow.passwordHint}</p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-2 block">{t.authFlow.confirmNewPassword}</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full p-4 bg-white border border-border rounded-input focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all text-ink placeholder:text-ink-dim"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand text-white p-4 rounded-input font-bold hover:bg-brand-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.authFlow.resetButton}
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
            <h2 className="text-3xl font-bold tracking-tight text-ink mb-4">{t.authFlow.resetTitle}.</h2>
            <p className="text-ink-sub leading-relaxed text-lg">{t.authFlow.resetSubtitle}.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
