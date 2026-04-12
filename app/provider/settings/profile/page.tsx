'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, Save, CheckCircle2, X,
  MapPin, Languages, Clock,
} from 'lucide-react';

export default function ProviderProfileSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const initialRef = useRef<string>('');
  const [dirty, setDirty] = useState(false);

  const [bio, setBio] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [languages, setLanguages] = useState<string[]>(['Lithuanian']);
  const [langInput, setLangInput] = useState('');
  const [responseTime, setResponseTime] = useState('Usually responds in 1 hour');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const getSnapshot = () => JSON.stringify({ bio, serviceArea, languages, responseTime, selectedCategories });

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/provider/profile').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
      ]).then(([profile, cats]) => {
        const p = profile ?? {};
        const loadedBio = p.bio ?? '';
        const loadedArea = p.serviceArea ?? '';
        const loadedLanguages = p.languages ?? ['Lithuanian'];
        const loadedResponseTime = p.responseTime ?? 'Usually responds in 1 hour';
        const loadedCategoryIds = (p.categories ?? []).map((c: any) => c.id);

        setBio(loadedBio);
        setServiceArea(loadedArea);
        setLanguages(loadedLanguages);
        setResponseTime(loadedResponseTime);
        setSelectedCategories(loadedCategoryIds);
        if (Array.isArray(cats)) setCategories(cats);
        setLoading(false);

        initialRef.current = JSON.stringify({
          bio: loadedBio, serviceArea: loadedArea, languages: loadedLanguages,
          responseTime: loadedResponseTime, selectedCategories: loadedCategoryIds,
        });
      }).catch(() => setLoading(false));
    }
  }, [status, router]);

  useEffect(() => {
    if (!loading && initialRef.current) {
      setDirty(getSnapshot() !== initialRef.current);
    }
  }, [bio, serviceArea, languages, responseTime, selectedCategories, loading]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/provider/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, serviceArea, languages, responseTime, categoryIds: selectedCategories }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.error || 'Save failed. Please try again.');
        return;
      }
      setSaved(true);
      initialRef.current = getSnapshot();
      setDirty(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError('Network error. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto pb-28 sm:pb-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/provider/settings"
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-alt transition-colors text-ink-sub"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg font-bold text-ink">Profile</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className={`hidden sm:flex items-center gap-2 px-5 py-2 rounded-full font-medium text-sm transition-all ${
            saved ? 'bg-trust text-white shadow-sm'
            : dirty ? 'bg-brand text-white hover:bg-brand-dark shadow-sm'
            : 'bg-surface-alt text-ink-dim border border-border-dim cursor-default'
          } disabled:opacity-60`}
        >
          {saving
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : saved
              ? <><CheckCircle2 className="w-4 h-4" /> Saved</>
              : <><Save className="w-4 h-4" /> Save Changes</>
          }
        </button>
      </div>

      {/* Save error */}
      {saveError && (
        <div className="mb-4 px-4 py-3 bg-caution-surface border border-caution-edge rounded-xl text-sm text-caution font-medium flex items-center justify-between gap-2">
          <span>{saveError}</span>
          <button onClick={() => setSaveError(null)} className="shrink-0 text-caution hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-4">

        {/* Public profile */}
        <div>
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-0.5">Public profile</p>
          <div className="bg-white rounded-2xl border border-border-dim shadow-sm overflow-hidden">

            {/* Bio */}
            <div className="p-4 sm:p-6">
              <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">Bio / Introduction</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                placeholder="Tell customers about your experience, specialties, and what makes you different."
                className={`w-full p-3.5 bg-surface-alt border ${bio.trim().length > 0 && bio.trim().length < 50 ? 'border-caution' : 'border-border-dim'} rounded-xl focus:ring-2 focus:ring-brand outline-none resize-none text-[16px] sm:text-sm leading-relaxed`}
              />
              <div className="flex items-center justify-between mt-1.5">
                {bio.trim().length > 0 && bio.trim().length < 50
                  ? <p className="text-[11px] text-caution font-medium">Minimum 50 characters for a strong profile</p>
                  : <span />
                }
                <p className={`text-[11px] ${bio.trim().length >= 50 ? 'text-ink-dim' : bio.trim().length > 0 ? 'text-caution' : 'text-ink-dim'}`}>
                  {bio.trim().length}/50 min
                </p>
              </div>
            </div>

            {/* Coverage area */}
            <div className="border-t border-border-dim p-4 sm:p-6">
              <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Coverage area
              </label>
              <input
                type="text"
                value={serviceArea}
                onChange={e => setServiceArea(e.target.value)}
                placeholder="e.g. Vilnius Center, Antakalnis, Žirmūnai"
                className="w-full px-3.5 py-3 bg-surface-alt border border-border-dim rounded-xl focus:ring-2 focus:ring-brand outline-none text-[16px] sm:text-sm"
              />
            </div>

            {/* Languages */}
            <div className="border-t border-border-dim p-4 sm:p-6">
              <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block flex items-center gap-1">
                <Languages className="w-3 h-3" /> Languages
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {languages.map(l => (
                  <span key={l} className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-muted text-brand rounded-full text-xs font-semibold">
                    {l}
                    <button onClick={() => setLanguages(prev => prev.filter(x => x !== l))} className="hover:text-brand-dark">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={langInput}
                onChange={e => setLangInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && langInput.trim()) {
                    setLanguages(p => [...p, langInput.trim()]);
                    setLangInput('');
                  }
                }}
                placeholder="Add language and press Enter"
                className="w-full px-3.5 py-2.5 bg-surface-alt border border-border-dim rounded-xl focus:ring-2 focus:ring-brand outline-none text-[16px] sm:text-sm"
              />
            </div>

            {/* Response time */}
            <div className="border-t border-border-dim p-4 sm:p-6">
              <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block flex items-center gap-1">
                <Clock className="w-3 h-3" /> Typical response time
              </label>
              <select
                value={responseTime}
                onChange={e => setResponseTime(e.target.value)}
                className="w-full px-3.5 py-3 bg-surface-alt border border-border-dim rounded-xl focus:ring-2 focus:ring-brand outline-none text-[16px] sm:text-sm"
              >
                <option>Usually responds in 30 minutes</option>
                <option>Usually responds in 1 hour</option>
                <option>Usually responds in 2 hours</option>
                <option>Usually responds same day</option>
                <option>Usually responds within 24 hours</option>
              </select>
            </div>

          </div>
        </div>

        {/* Work details — categories */}
        <div>
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-0.5">Work details</p>
          <div className="bg-white rounded-2xl border border-border-dim shadow-sm p-4 sm:p-6">
            <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-3">Service categories</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map(cat => {
                const sel = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategories(prev => sel ? prev.filter(x => x !== cat.id) : [...prev, cat.id])}
                    className={`p-2.5 rounded-xl border-2 text-left text-xs font-bold transition-all ${sel ? 'border-brand bg-brand text-white' : 'border-border bg-white hover:border-border'}`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Mobile save */}
      <div className="sm:hidden mt-6">
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all ${
            saved ? 'bg-trust text-white'
            : dirty ? 'bg-brand text-white hover:bg-brand-dark'
            : 'bg-surface-alt text-ink-dim border border-border-dim'
          } disabled:opacity-60`}
        >
          {saving
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : saved
              ? <><CheckCircle2 className="w-4 h-4" /> Saved</>
              : <><Save className="w-4 h-4" /> Save Changes</>
          }
        </button>
      </div>

    </div>
  );
}
