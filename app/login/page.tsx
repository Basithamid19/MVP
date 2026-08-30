'use client';

import { AladdinIcon } from '@/components/icons';
import React, { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, MailCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        // Honor a same-origin callbackUrl (e.g. the request wizard sends
        // guests here and expects to resume). Read at submit time to avoid
        // the useSearchParams Suspense requirement.
        const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
        const safeCallback = callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : null;
        if (role === 'PROVIDER') router.push('/provider/dashboard');
        else if (role === 'ADMIN') router.push('/admin/dashboard');
        else router.push(safeCallback ?? '/');
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
          <div className="flex items-center justify-between mb-10">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand rounded-input flex items-center justify-center shrink-0">
                <AladdinIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-ink">Aladdin</span>
            </Link>
            <LanguageSwitcher />
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-ink mb-2">{t.auth.loginTitle}.</h1>
          <p className="text-ink-sub mb-10">{t.auth.loginSubtitle}.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {banner === 'verified' && (
              <div className="p-4 bg-trust-surface border border-trust-edge text-trust text-sm font-medium rounded-input flex items-start gap-3">
                <MailCheck className="w-5 h-5 shrink-0" />
                {t.authFlow.verifiedSuccess}
              </div>
            )}
            {banner === 'expired' && (
              <div className="p-4 bg-caution-surface border border-caution-edge text-caution text-sm font-medium rounded-input">
                {t.authFlow.verifiedFailed}
              </div>
            )}

            {error && (
              <div className="p-4 bg-danger-surface border border-danger-edge text-danger text-sm font-medium rounded-input">
                {error}
                {unverified && (
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="font-bold underline disabled:opacity-50"
                    >
                      {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : t.authFlow.resendVerification}
                    </button>
                    <Link
                      href={`/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`}
                      className="font-bold underline"
                    >
                      {t.authFlow.verifyButton}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {notice && (
              <div className="p-4 bg-trust-surface border border-trust-edge text-trust text-sm font-medium rounded-input">
                {notice}
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-widest text-ink-dim">{t.auth.password}</label>
                <Link href="/forgot-password" className="text-xs font-bold text-brand hover:underline">
                  {t.authFlow.forgotPassword}
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-white border border-border rounded-input focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all text-ink placeholder:text-ink-dim"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand text-white p-4 rounded-input font-bold hover:bg-brand-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.auth.loginButton}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-border-dim text-center">
            <p className="text-sm text-ink-sub">
              {t.auth.noAccount} <Link href="/register" className="text-brand font-bold hover:underline">{t.auth.signUpLink}</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:40px_40px] opacity-50"></div>
        <div className="relative w-[600px] h-[600px] shrink-0 bg-white rounded-full shadow-float flex items-center justify-center p-20 border border-border-dim">
          <div className="text-center">
            <div className="w-20 h-20 bg-brand rounded-panel flex items-center justify-center mx-auto mb-8 shadow-elevated">
              <AladdinIcon className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-ink mb-4">The best pros in Vilnius.</h2>
            <p className="text-ink-sub leading-relaxed text-lg">Join thousands of residents who trust Aladdin for their home maintenance needs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
