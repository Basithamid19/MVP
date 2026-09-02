'use client';

import { AladdinIcon } from '@/components/icons';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, User, Briefcase, Mail, MessageSquare, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import AuthShowcase from '@/components/AuthShowcase';
import { Button, Input } from '@/components/ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

export default function RegisterPage() {
  const [role, setRole] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  // Only offer SMS when this deployment actually has an SMS provider wired up.
  const [smsAvailable, setSmsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const t = useTranslation();
  const { data: session, status: sessionStatus } = useSession();

  // Signing up while already signed in is never what the user meant — the
  // marketing footer and nav both link here. Send them to their own home.
  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;
    const sessionRole = (session?.user as any)?.role;
    router.replace(
      sessionRole === 'PROVIDER' ? '/provider/dashboard'
        : sessionRole === 'ADMIN' ? '/admin/dashboard'
        : '/dashboard',
    );
  }, [sessionStatus, session, router]);

  useEffect(() => {
    fetch('/api/auth/verification-channels')
      .then((res) => res.json())
      .then((data) => setSmsAvailable(!!data?.sms))
      .catch(() => setSmsAvailable(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mirror the server-side rules so the user gets the message next to the
    // form instead of a round-trip.
    if (!EMAIL_RE.test(formData.email.trim())) {
      setError(t.authFlow.invalidEmail);
      return;
    }
    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setError(t.authFlow.passwordTooShort);
      return;
    }
    if (channel === 'sms' && !phone.trim()) {
      setError(t.authFlow.invalidPhone);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role,
          channel,
          // Only send the number when it's actually part of the chosen flow —
          // a stale value from a switched-away SMS choice would 400 the signup.
          ...(channel === 'sms' && phone.trim() ? { phone: phone.trim() } : {}),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // No provider configured server-side → the account is already usable.
        if (data.verification === 'none') {
          router.push('/login?registered=true');
        } else {
          router.push(
            `/verify?email=${encodeURIComponent(formData.email.trim().toLowerCase())}&channel=${data.verification}`,
          );
        }
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Authenticated and forwarding — don't flash the signup form.
  if (sessionStatus === 'authenticated') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col lg:flex-row overflow-hidden">
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

          <h1 className="text-4xl font-bold tracking-tight text-ink mb-2">{t.auth.registerTitle}.</h1>
          <p className="text-ink-sub mb-10">{t.auth.registerSubtitle}.</p>

          {/* High-emphasis selection tier — solid brand fill for the single
              most consequential choice on the page. */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setRole('CUSTOMER')}
              className={`p-4 rounded-input border flex flex-col items-center gap-2 transition-all duration-150 ${
                role === 'CUSTOMER'
                  ? 'bg-brand text-white shadow-elevated border-brand'
                  : 'bg-card border-border text-ink-sub hover:border-border-dim'
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-widest">{t.auth.customerRole}</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('PROVIDER')}
              className={`p-4 rounded-input border flex flex-col items-center gap-2 transition-all duration-150 ${
                role === 'PROVIDER'
                  ? 'bg-brand text-white shadow-elevated border-brand'
                  : 'bg-card border-border text-ink-sub hover:border-border-dim'
              }`}
            >
              <Briefcase className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-widest">{t.auth.providerRole}</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-danger-surface border border-danger-edge text-danger text-sm font-medium rounded-input">
                {error}
              </div>
            )}

            <Input
              label={t.auth.name}
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Jonas Jonaitis"
            />

            <Input
              label={t.auth.email}
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@example.com"
            />

            <Input
              label={t.auth.password}
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

            {smsAvailable && (
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-2 block">{t.authFlow.verifyByLabel}</label>
                {/* Default selection tier — a reversible preference, not the
                    headline choice, so tinted rather than solid. */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setChannel('email')}
                    className={`p-4 rounded-input border flex items-center justify-center gap-2 transition-all duration-150 ${
                      channel === 'email'
                        ? 'border-brand bg-brand-muted text-brand'
                        : 'bg-card border-border text-ink-sub hover:border-border-dim'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">{t.authFlow.channelEmail}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('sms')}
                    className={`p-4 rounded-input border flex items-center justify-center gap-2 transition-all duration-150 ${
                      channel === 'sms'
                        ? 'border-brand bg-brand-muted text-brand'
                        : 'bg-card border-border text-ink-sub hover:border-border-dim'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">{t.authFlow.channelSms}</span>
                  </button>
                </div>
              </div>
            )}

            {smsAvailable && channel === 'sms' && (
              <Input
                label={t.authFlow.phone}
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.authFlow.phonePlaceholder}
              />
            )}

            <Button type="submit" size="xl" className="w-full" loading={loading}>
              {t.auth.registerButton}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-10 pt-10 border-t border-border-dim text-center">
            <p className="text-sm text-ink-sub">
              {t.auth.haveAccount} <Link href="/login" className="text-brand font-bold hover:underline">{t.auth.loginLink}</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Showcase copy follows the role picker — the pitch differs per side. */}
      <AuthShowcase
        title={role === 'PROVIDER' ? t.authShowcase.registerProviderTitle : t.authShowcase.registerCustomerTitle}
        subtitle={role === 'PROVIDER' ? t.authShowcase.registerProviderSubtitle : t.authShowcase.registerCustomerSubtitle}
      />
    </div>
  );
}
