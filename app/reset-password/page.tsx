'use client';

import { AladdinIcon } from '@/components/icons';
import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, MailCheck, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AuthShowcase from '@/components/AuthShowcase';
import { Button, Input, buttonVariants } from '@/components/ui';
import { cn } from '@/lib/utils';

const MIN_PASSWORD_LENGTH = 8;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
                className={cn(buttonVariants({ variant: 'primary', size: 'xl' }), 'w-full')}
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

              <Input
                label={t.authFlow.newPassword}
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                hint={t.authFlow.passwordHint}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t.authFlow.hidePassword : t.authFlow.showPassword}
                    className="text-ink-dim hover:text-ink transition-colors duration-150 rounded-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Input
                label={t.authFlow.confirmNewPassword}
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? t.authFlow.hidePassword : t.authFlow.showPassword}
                    className="text-ink-dim hover:text-ink transition-colors duration-150 rounded-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <Button type="submit" size="xl" className="w-full" loading={loading}>
                {t.authFlow.resetButton}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          <div className="mt-10 pt-10 border-t border-border-dim text-center">
            <p className="text-sm text-ink-sub">
              <Link href="/login" className="text-brand font-bold hover:underline">{t.authFlow.backToLogin}</Link>
            </p>
          </div>
        </div>
      </div>

      <AuthShowcase title={t.authShowcase.resetTitle} subtitle={t.authShowcase.resetSubtitle} />
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
