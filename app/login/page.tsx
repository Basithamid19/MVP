'use client';

import { AladdinIcon } from '@/components/icons';
import React, { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MailCheck, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import AuthShowcase from '@/components/AuthShowcase';
import { Alert, Button, Input } from '@/components/ui';

/**
 * Where to land after a successful sign-in.
 *
 * middleware.ts now appends `?callbackUrl=<pathname>` whenever it bounces an
 * unauthenticated request off a gated page, so a provider or admin can easily
 * arrive here carrying a callback for someone else's area (e.g. a stale
 * /dashboard link). Only honour a callback that belongs to the role's own
 * surface — otherwise fall back to the role home, or the middleware would just
 * bounce them again on arrival.
 */
function postLoginDestination(role: string | undefined, rawCallback: string | null): string {
  const home = role === 'PROVIDER' ? '/provider/dashboard' : role === 'ADMIN' ? '/admin/dashboard' : '/';

  // Same-origin relative paths only. `//host` is protocol-relative, i.e. an
  // open redirect, so it is rejected alongside absolute URLs.
  if (!rawCallback || !rawCallback.startsWith('/') || rawCallback.startsWith('//')) return home;

  const path = rawCallback.split(/[?#]/)[0];
  const isUnder = (prefix: string) => path === prefix || path.startsWith(prefix + '/');

  // /messages is shared surface — every authenticated role may resume there.
  if (isUnder('/messages')) return rawCallback;
  if (role === 'PROVIDER') return isUnder('/provider') ? rawCallback : home;
  if (role === 'ADMIN') return isUnder('/admin') ? rawCallback : home;
  return isUnder('/provider') || isUnder('/admin') ? home : rawCallback;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Set when authorize() throws UnverifiedError — swaps the generic credential
  // error for a resend affordance.
  const [unverified, setUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState('');
  const [banner, setBanner] = useState<'verified' | 'expired' | null>(null);
  const router = useRouter();
  const t = useTranslation();

  // Read from window.location (not useSearchParams) to avoid the Suspense
  // requirement, matching how callbackUrl is handled below.
  useEffect(() => {
    const verified = new URLSearchParams(window.location.search).get('verified');
    if (verified === '1') setBanner('verified');
    else if (verified === '0') setBanner('expired');
  }, []);

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setNotice('');

    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setNotice(res.status === 429 ? t.authFlow.resendThrottled : t.authFlow.resendSent);
    } catch (err) {
      setNotice(t.authFlow.genericError);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    setUnverified(false);
    setBanner(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // NextAuth v5 carries the CredentialsSignin subclass `code` on the
        // result; older shapes fold it into `error`, so check both.
        const code = (result as any).code ?? '';
        if (code === 'UNVERIFIED' || String(result.error).includes('UNVERIFIED')) {
          setUnverified(true);
          setError(t.authFlow.unverifiedError);
        } else {
          setError('Invalid email or password');
        }
      } else {
        const session = await getSession();
        const role = (session?.user as any)?.role;
        // Honor a same-origin callbackUrl that belongs to this role's area
        // (e.g. the request wizard sends guests here and expects to resume).
        // Read at submit time to avoid the useSearchParams Suspense
        // requirement.
        const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
        router.push(postLoginDestination(role, callbackUrl));
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col lg:justify-center px-8 lg:px-24 pt-12 pb-12 lg:py-12 relative z-10">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center mb-10">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand rounded-input flex items-center justify-center shrink-0">
                <AladdinIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-ink">Aladdin</span>
            </Link>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-ink mb-2">{t.auth.loginTitle}.</h1>
          <p className="text-ink-sub mb-10">{t.auth.loginSubtitle}.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {banner === 'verified' && (
              <Alert variant="trust" icon={MailCheck}>{t.authFlow.verifiedSuccess}</Alert>
            )}
            {banner === 'expired' && (
              <Alert variant="caution">{t.authFlow.verifiedFailed}</Alert>
            )}

            {error && (
              <Alert
                variant="danger"
                action={unverified ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={handleResend}
                      loading={resending}
                    >
                      {t.authFlow.resendVerification}
                    </Button>
                    <Link
                      href={`/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`}
                      className="text-sm font-bold text-danger underline"
                    >
                      {t.authFlow.verifyButton}
                    </Link>
                  </div>
                ) : undefined}
              >
                {error}
              </Alert>
            )}

            {notice && <Alert variant="trust">{notice}</Alert>}

            <Input
              label={t.auth.email}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />

            <div>
              <Input
                label={t.auth.password}
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
              <div className="mt-2 text-right">
                <Link href="/forgot-password" className="text-xs font-bold text-brand hover:underline">
                  {t.authFlow.forgotPassword}
                </Link>
              </div>
            </div>

            <Button type="submit" size="xl" className="w-full" loading={loading}>
              {t.auth.loginButton}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-10 pt-10 border-t border-border-dim text-center">
            <p className="text-sm text-ink-sub">
              {t.auth.noAccount} <Link href="/register" className="text-brand font-bold hover:underline">{t.auth.signUpLink}</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <AuthShowcase title={t.authShowcase.loginTitle} subtitle={t.authShowcase.loginSubtitle} />
    </div>
  );
}
