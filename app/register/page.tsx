'use client';

import { AladdinIcon } from '@/components/icons';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, User, Briefcase } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function RegisterPage() {
  const [role, setRole] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const t = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role }),
      });

      if (res.ok) {
        router.push('/login?registered=true');
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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

          <h1 className="text-4xl font-bold tracking-tight text-ink mb-2">{t.auth.registerTitle}.</h1>
          <p className="text-ink-sub mb-10">{t.auth.registerSubtitle}.</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setRole('CUSTOMER')}
              className={`p-4 rounded-input border flex flex-col items-center gap-2 transition-all ${
                role === 'CUSTOMER' ? 'border-brand bg-brand text-white shadow-elevated' : 'border-border bg-white text-ink-sub hover:border-border-dim hover:bg-surface-alt'
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-widest">{t.auth.customerRole}</span>
            </button>
            <button
              onClick={() => setRole('PROVIDER')}
              className={`p-4 rounded-input border flex flex-col items-center gap-2 transition-all ${
                role === 'PROVIDER' ? 'border-brand bg-brand text-white shadow-elevated' : 'border-border bg-white text-ink-sub hover:border-border-dim hover:bg-surface-alt'
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

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-2 block">{t.auth.name}</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-4 bg-white border border-border rounded-input focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all text-ink placeholder:text-ink-dim"
                placeholder="Jonas Jonaitis"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-2 block">{t.auth.email}</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-4 bg-white border border-border rounded-input focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all text-ink placeholder:text-ink-dim"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-ink-dim mb-2 block">{t.auth.password}</label>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-4 bg-white border border-border rounded-input focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all text-ink placeholder:text-ink-dim"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand text-white p-4 rounded-input font-bold hover:bg-brand-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.auth.registerButton}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-border-dim text-center">
            <p className="text-sm text-ink-sub">
              {t.auth.haveAccount} <Link href="/login" className="text-brand font-bold hover:underline">{t.auth.loginLink}</Link>
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
              {role === 'PROVIDER' ? 'Grow your business in Vilnius.' : 'The best pros in Vilnius.'}
            </h2>
            <p className="text-ink-sub leading-relaxed text-lg">
              {role === 'PROVIDER' 
                ? 'Join our network of verified professionals and get access to high-quality leads every day.'
                : 'Join thousands of residents who trust Aladdin for their home maintenance needs.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
