'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2, Save, Plus, X, CheckCircle2, MapPin,
  Languages, Clock, Calendar, ToggleLeft, ToggleRight, LogOut, Camera, User,
  Briefcase, Zap, Shield, ShieldCheck,
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = Array.from({ length: 25 }, (_, i) => `${String(Math.floor(i * 0.5 + 8)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`).filter((_, i) => i < 26);
const ALL_TIMES = ['06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30',
  '18:00','18:30','19:00','19:30','20:00','20:30','21:00'];
const TABS = ['Profile', 'Services', 'Availability'] as const;

export default function ProviderSettingsPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Profile');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const initialRef = useRef<string>('');
  const [dirty, setDirty] = useState(false);

  // Profile state
  const [bio, setBio] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [languages, setLanguages] = useState<string[]>(['Lithuanian']);
  const [langInput, setLangInput] = useState('');
  const [responseTime, setResponseTime] = useState('Usually responds in 1 hour');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [instantBook, setInstantBook] = useState(false);
  const [verificationTier, setVerificationTier] = useState<string>('TIER0_BASIC');
  const [completedJobs, setCompletedJobs] = useState(0);

  // Services state
  const [offerings, setOfferings] = useState<{name: string; price: string; priceType: string; description: string}[]>([]);
  const [offeringErrors, setOfferingErrors] = useState<Record<number, string>>({});

  // Availability state
  const [slots, setSlots] = useState<{dayOfWeek: number; startTime: string; endTime: string; enabled: boolean}[]>(
    DAYS.map((_, i) => ({ dayOfWeek: i, startTime: '09:00', endTime: '17:00', enabled: i >= 1 && i <= 5 }))
  );
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [blackoutInput, setBlackoutInput] = useState('');
  const [bufferMins, setBufferMins] = useState(30);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  const getSnapshot = () => JSON.stringify({ bio, serviceArea, languages, responseTime, selectedCategories, instantBook, offerings, slots, blackoutDates, bufferMins });

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      setLoadError(false);
      Promise.all([
        fetch('/api/provider/profile').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
      ]).then(([profile, cats]) => {
        // Derive all loaded values explicitly so we can build the initial
        // snapshot directly — avoids the stale-closure bug of using
        // getSnapshot() inside a setTimeout after batch state updates.
        const p = profile ?? {};
        const loadedBio             = p.bio ?? '';
        const loadedArea            = p.serviceArea ?? '';
        const loadedLanguages       = p.languages ?? ['Lithuanian'];
        const loadedResponseTime    = p.responseTime ?? 'Usually responds in 1 hour';
        const loadedCategoryIds     = (p.categories ?? []).map((c: any) => c.id);
        const loadedInstantBook     = p.instantBook ?? false;
        const loadedOfferings       = (p.offerings ?? []).map((o: any) => ({
          name: o.name, price: String(o.price), priceType: o.priceType, description: o.description ?? '',
        }));
        const loadedSlots           = DAYS.map((_, i) => {
          const existing = (p.availability ?? []).find((s: any) => s.dayOfWeek === i);
          return existing
            ? { dayOfWeek: i, startTime: existing.startTime, endTime: existing.endTime, enabled: true }
            : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', enabled: false };
        });
        const loadedBlackoutDates   = p.blackoutDates ?? [];
        const loadedBufferMins      = p.bufferMins ?? 30;

        setBio(loadedBio);
        setServiceArea(loadedArea);
        setLanguages(loadedLanguages);
        setResponseTime(loadedResponseTime);
        setSelectedCategories(loadedCategoryIds);
        setInstantBook(loadedInstantBook);
        setVerificationTier(p.verificationTier ?? 'TIER0_BASIC');
        setCompletedJobs(p.completedJobs ?? 0);
        setOfferings(loadedOfferings);
        setSlots(loadedSlots);
        setBlackoutDates(loadedBlackoutDates);
        setBufferMins(loadedBufferMins);

        if (Array.isArray(cats)) setCategories(cats);
        setLoading(false);

        // Build initial snapshot directly from the loaded data so dirty
        // detection starts from the true persisted state, not empty defaults.
        initialRef.current = JSON.stringify({
          bio: loadedBio, serviceArea: loadedArea, languages: loadedLanguages,
          responseTime: loadedResponseTime, selectedCategories: loadedCategoryIds,
          instantBook: loadedInstantBook, offerings: loadedOfferings,
          slots: loadedSlots, blackoutDates: loadedBlackoutDates, bufferMins: loadedBufferMins,
        });
      }).catch(() => { setLoading(false); setLoadError(true); });
    }
  }, [status, router, retryCount]);

  // Track dirty state
  useEffect(() => {
    if (!loading && initialRef.current) {
      setDirty(getSnapshot() !== initialRef.current);
    }
  }, [bio, serviceArea, languages, responseTime, selectedCategories, instantBook, offerings, slots, blackoutDates, bufferMins, loading]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const size = 300;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setLocalAvatar(dataUrl);
        fetch('/api/user/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: dataUrl }),
        }).then(() => updateSession()).finally(() => setAvatarUploading(false));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    // Validate offerings — but don't block profile save; just flag bad services
    const errors: Record<number, string> = {};
    offerings.forEach((o, i) => {
      const name = o.name.trim();
      const desc = o.description.trim();
      if (name.length > 0 && name.length < 3) {
        errors[i] = 'Service name must be at least 3 characters.';
      } else if (desc.length > 0 && desc.length < 20) {
        errors[i] = 'Description must be at least 20 characters if provided.';
      }
    });
    setOfferingErrors(errors);
    if (Object.keys(errors).length > 0) {
      setActiveTab('Services');
      setSaveError('Fix service errors before saving.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/provider/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio, serviceArea, languages, responseTime,
          categoryIds: selectedCategories,
          instantBook,
          bufferMins,
          blackoutDates,
          offerings: offerings.map(o => ({ ...o, price: parseFloat(o.price) || 0 })),
          availability: slots.filter(s => s.enabled).map(s => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })),
        }),
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

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-ink-dim" /></div>;

  if (loadError) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <p className="text-base font-semibold text-ink">Could not load your profile</p>
      <p className="text-sm text-ink-sub max-w-xs leading-relaxed">There was a problem fetching your data. Check your connection and try again.</p>
      <button onClick={() => { setLoading(true); setRetryCount(c => c + 1); }} className="px-6 py-2.5 bg-brand text-white rounded-full font-medium text-sm hover:bg-brand-dark transition-colors">Retry</button>
    </div>
  );

  // Profile completeness
  const hasAvatar = !!(localAvatar || session?.user?.image);
  const hasBio = bio.trim().length >= 50;
  const hasArea = serviceArea.trim().length > 0;
  const hasCategories = selectedCategories.length > 0;
  const hasOfferings = offerings.length > 0;
  const completedSteps = [hasAvatar, hasBio, hasArea, hasCategories, hasOfferings].filter(Boolean).length;
  const totalSteps = 5;
  const completePct = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto pb-28 sm:pb-8">
      {/* ── Provider summary card ── */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-border-dim shadow-sm p-4 sm:p-6 mb-5 sm:mb-7">
        <div className="flex items-start gap-4">
          <label className="relative shrink-0 cursor-pointer">
            <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-canvas border-2 border-border-dim flex items-center justify-center">
              {localAvatar || session?.user?.image
                ? <img src={localAvatar ?? session?.user?.image ?? ''} alt="" className="w-full h-full object-cover" />
                : <User className="w-7 h-7 sm:w-8 sm:h-8 text-ink-dim" />
              }
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-brand rounded-full flex items-center justify-center shadow-md">
              {avatarUploading
                ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                : <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              }
            </div>
          </label>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-semibold text-ink truncate leading-tight">{session?.user?.name ?? 'Provider'}</p>
                <p className="text-xs text-ink-sub truncate mt-0.5">{session?.user?.email}</p>
              </div>
              {verificationTier === 'TIER0_BASIC' ? (
                <Link href="/provider/verification"
                  className="flex items-center gap-1 px-2 py-0.5 bg-caution-surface border border-caution-edge text-caution rounded-full text-[10px] font-bold shrink-0 hover:opacity-80 transition-opacity">
                  <Shield className="w-3 h-3" /> Get verified
                </Link>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-brand-muted text-brand rounded-full text-[10px] font-bold shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  {verificationTier === 'TIER1_ID_VERIFIED' ? 'ID Verified' : verificationTier === 'TIER2_TRADE_VERIFIED' ? 'Trade Verified' : 'Enhanced'}
                </span>
              )}
            </div>
            {completedJobs > 0 && (
              <p className="text-[10px] text-ink-dim mt-1.5">{completedJobs} job{completedJobs !== 1 ? 's' : ''} completed</p>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border-dim">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-ink">Profile completeness</p>
            <span className={`text-xs font-bold ${completePct === 100 ? 'text-trust' : 'text-brand'}`}>{completePct}%</span>
          </div>
          <div className="w-full bg-surface-alt rounded-full h-1.5 mb-2.5">
            <div className={`h-1.5 rounded-full transition-all ${completePct === 100 ? 'bg-trust' : 'bg-brand'}`} style={{ width: `${completePct}%` }} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              [hasAvatar, 'Photo'],
              [hasBio, 'Bio (50+ chars)'],
              [hasArea, 'Coverage area'],
              [hasCategories, 'Categories'],
              [hasOfferings, 'Services listed'],
            ].map(([done, label]) => (
              <span key={label as string} className={`text-[10px] font-medium ${done ? 'text-trust' : 'text-ink-dim'}`}>
                {done ? '✓' : '○'} {label as string}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Setup label + desktop save button */}
      <div className="hidden sm:flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest">Setup</p>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium text-sm transition-all ${
            saved ? 'bg-trust text-white shadow-sm'
            : dirty ? 'bg-brand text-white hover:bg-brand-dark shadow-sm'
            : 'bg-surface-alt text-ink-dim border border-border-dim cursor-default'
          } disabled:opacity-60`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      {/* Save error banner */}
      {saveError && (
        <div className="mb-4 px-4 py-3 bg-caution-surface border border-caution-edge rounded-xl text-sm text-caution font-medium flex items-center justify-between gap-2">
          <span>{saveError}</span>
          <button onClick={() => setSaveError(null)} className="shrink-0 text-caution hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-alt rounded-xl sm:rounded-2xl mb-4 sm:mb-8 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[90px] py-2 rounded-lg sm:rounded-xl text-sm transition-all ${
              activeTab === tab
                ? 'bg-white text-brand font-semibold shadow-card'
                : 'text-ink-sub hover:text-ink font-medium'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'Profile' && (
        <div className="space-y-3 sm:space-y-5">
          {/* Public profile group */}
          <div>
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-0.5">Public profile</p>
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-border-dim shadow-sm overflow-hidden">
            {/* Bio */}
            <div className="p-4 sm:p-6">
              <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">Bio / Introduction</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                placeholder="Tell customers about your experience, specialties, and what makes you different. Example: 'Licensed electrician with 8 years of experience in Vilnius. I specialize in residential wiring, smart home installations, and lighting upgrades.'"
                className={`w-full p-3.5 sm:p-4 bg-surface-alt border ${bio.trim().length > 0 && bio.trim().length < 50 ? 'border-caution' : 'border-border-dim'} rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-brand outline-none resize-none text-[16px] sm:text-sm leading-relaxed`}
              />
              <div className="flex items-center justify-between mt-1.5">
                {bio.trim().length > 0 && bio.trim().length < 50 ? (
                  <p className="text-[11px] text-caution font-medium">Minimum 50 characters for a strong profile</p>
                ) : (
                  <span />
                )}
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
                className="w-full px-3.5 sm:px-4 py-3 sm:py-4 bg-surface-alt border border-border-dim rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-brand outline-none text-[16px] sm:text-sm"
              />
            </div>

            {/* Languages */}
            <div className="border-t border-border-dim p-4 sm:p-6">
              <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block flex items-center gap-1">
                <Languages className="w-3 h-3" /> Languages
              </label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                {languages.map(l => (
                  <span key={l} className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-muted text-brand rounded-full text-xs font-semibold">
                    {l}
                    <button onClick={() => setLanguages(prev => prev.filter(x => x !== l))} className="hover:text-brand-dark"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={langInput}
                onChange={e => setLangInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && langInput.trim()) { setLanguages(p => [...p, langInput.trim()]); setLangInput(''); } }}
                placeholder="Add language and press Enter"
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-surface-alt border border-border-dim rounded-xl focus:ring-2 focus:ring-brand outline-none text-[16px] sm:text-sm"
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
                className="w-full px-3.5 sm:px-4 py-3 sm:py-4 bg-surface-alt border border-border-dim rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-brand outline-none text-[16px] sm:text-sm"
              >
                <option>Usually responds in 30 minutes</option>
                <option>Usually responds in 1 hour</option>
                <option>Usually responds in 2 hours</option>
                <option>Usually responds same day</option>
                <option>Usually responds within 24 hours</option>
              </select>
            </div>
          </div>
          </div>{/* end public profile group */}

          {/* Work details group */}
          <div>
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-0.5">Work details</p>
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-border-dim p-4 sm:p-6">
            <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-3 sm:mb-4">Service categories</p>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
              {categories.map(cat => {
                const sel = selectedCategories.includes(cat.id);
                return (
                  <button key={cat.id} onClick={() => setSelectedCategories(prev => sel ? prev.filter(x => x !== cat.id) : [...prev, cat.id])}
                    className={`p-2.5 sm:p-3 rounded-xl border-2 text-left text-xs sm:text-sm font-bold transition-all ${sel ? 'border-brand bg-brand text-white' : 'border-border bg-white hover:border-border'}`}>
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
          </div>{/* end work details group */}
        </div>
      )}

      {/* SERVICES TAB */}
      {activeTab === 'Services' && (
        <div className="space-y-3 sm:space-y-5">
          {/* Your services */}
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-0.5">Your services</p>
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-border-dim p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div>
                <p className="font-semibold text-sm sm:text-base">Service offerings</p>
                {offerings.length > 0 && (
                  <p className="text-[10px] text-ink-dim mt-0.5">{offerings.length} service{offerings.length !== 1 ? 's' : ''} listed</p>
                )}
              </div>
              <button
                onClick={() => setOfferings(p => [...p, { name: '', price: '', priceType: 'HOURLY', description: '' }])}
                className="flex items-center gap-1.5 text-xs font-bold text-brand border border-brand/30 bg-brand-muted px-3 py-1.5 rounded-full hover:bg-brand hover:text-white transition-all"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            {offerings.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <div className="w-12 h-12 bg-surface-alt rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="w-5 h-5 text-ink-dim" />
                </div>
                <p className="font-semibold text-sm text-ink mb-1">No services added yet</p>
                <p className="text-xs text-ink-dim max-w-[240px] mx-auto leading-relaxed">
                  Add your service offerings so customers know what you provide and your pricing.
                </p>
                <button
                  onClick={() => setOfferings(p => [...p, { name: '', price: '', priceType: 'HOURLY', description: '' }])}
                  className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand px-4 py-2 rounded-full hover:bg-brand-dark transition-all"
                >
                  <Plus className="w-3 h-3" /> Add your first service
                </button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {offerings.map((o, i) => (
                  <div key={i} className={`p-3.5 sm:p-4 bg-surface-alt rounded-xl sm:rounded-2xl border ${offeringErrors[i] ? 'border-danger' : 'border-border-dim'} space-y-2.5 sm:space-y-3`}>
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <input
                        type="text"
                        value={o.name}
                        onChange={e => { setOfferings(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x)); setOfferingErrors(prev => { const n = { ...prev }; delete n[i]; return n; }); }}
                        placeholder="Service name (e.g. TV Installation, Pipe Repair)"
                        className={`flex-1 px-3 py-2 bg-white border ${offeringErrors[i]?.includes('name') ? 'border-danger' : 'border-border'} rounded-xl focus:ring-2 focus:ring-brand outline-none text-[16px] sm:text-sm font-medium`}
                      />
                      <button onClick={() => { setOfferings(p => p.filter((_, j) => j !== i)); setOfferingErrors(prev => { const n = { ...prev }; delete n[i]; return n; }); }} className="hidden sm:block text-ink-dim hover:text-red-500 transition-colors mt-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={o.description}
                      onChange={e => { setOfferings(prev => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x)); setOfferingErrors(prev => { const n = { ...prev }; delete n[i]; return n; }); }}
                      placeholder="Describe what's included, typical duration, and any requirements (min. 20 characters)"
                      rows={2}
                      className={`w-full px-3 py-2 bg-white border ${offeringErrors[i]?.includes('escription') ? 'border-danger' : 'border-border'} rounded-xl focus:ring-2 focus:ring-brand outline-none text-[16px] sm:text-sm resize-none`}
                    />
                    {offeringErrors[i] && (
                      <p className="text-xs text-danger font-medium">{offeringErrors[i]}</p>
                    )}
                    <div className="flex gap-2 sm:gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim font-bold text-sm">€</span>
                        <input
                          type="number"
                          value={o.price}
                          onChange={e => setOfferings(prev => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))}
                          placeholder="0"
                          className="w-full pl-7 pr-3 py-2 bg-white border border-border rounded-xl focus:ring-2 focus:ring-brand outline-none text-[16px] sm:text-sm font-medium"
                        />
                      </div>
                      <select
                        value={o.priceType}
                        onChange={e => setOfferings(prev => prev.map((x, j) => j === i ? { ...x, priceType: e.target.value } : x))}
                        className="px-3 py-2 bg-white border border-border rounded-xl focus:ring-2 focus:ring-brand outline-none text-sm font-medium"
                      >
                        <option value="HOURLY">/ hour</option>
                        <option value="FIXED">fixed</option>
                        <option value="FROM">from</option>
                      </select>
                    </div>
                    <button onClick={() => setOfferings(p => p.filter((_, j) => j !== i))} className="sm:hidden flex items-center gap-2 text-danger text-xs font-medium">
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking settings */}
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-0.5">Booking settings</p>
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-border-dim overflow-hidden">
            <div className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 bg-brand-muted rounded-xl flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Instant book</p>
                <p className="text-[11px] text-ink-dim mt-0.5 leading-relaxed">Let customers book without approval</p>
              </div>
              <button onClick={() => setInstantBook(!instantBook)} className="shrink-0">
                {instantBook
                  ? <ToggleRight className="w-9 h-9 sm:w-10 sm:h-10 text-brand" />
                  : <ToggleLeft className="w-9 h-9 sm:w-10 sm:h-10 text-ink-dim" />
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AVAILABILITY TAB */}
      {activeTab === 'Availability' && (
        <div className="space-y-3 sm:space-y-5">
          {/* Working hours */}
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-0.5">Working hours</p>
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-border-dim p-4 sm:p-6">
            <p className="font-semibold text-sm sm:text-base mb-3 sm:mb-5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-ink-dim" /> Working hours
            </p>
            <div className="space-y-1.5 sm:space-y-3">
              {slots.map((slot, i) => (
                <div key={i} className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all ${slot.enabled ? 'bg-surface-alt' : 'bg-transparent'}`}>
                  <button
                    onClick={() => setSlots(prev => prev.map((s, j) => j === i ? { ...s, enabled: !s.enabled } : s))}
                    className={`w-8 h-5 rounded-full relative transition-colors shrink-0 ${slot.enabled ? 'bg-brand' : 'bg-border'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${slot.enabled ? 'left-3.5' : 'left-0.5'}`} />
                  </button>
                  <span className={`w-8 sm:w-10 text-xs sm:text-sm font-bold shrink-0 ${slot.enabled ? 'text-ink' : 'text-ink-dim'}`}>{DAYS[i]}</span>
                  {slot.enabled ? (
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                      <select
                        value={slot.startTime}
                        onChange={e => setSlots(prev => prev.map((s, j) => j === i ? { ...s, startTime: e.target.value } : s))}
                        className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-border rounded-lg sm:rounded-xl text-xs sm:text-sm outline-none"
                      >
                        {ALL_TIMES.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span className="text-ink-dim text-xs">–</span>
                      <select
                        value={slot.endTime}
                        onChange={e => setSlots(prev => prev.map((s, j) => j === i ? { ...s, endTime: e.target.value } : s))}
                        className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 bg-white border border-border rounded-lg sm:rounded-xl text-xs sm:text-sm outline-none"
                      >
                        {ALL_TIMES.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-dim">Off</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Break between jobs */}
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-0.5">Break between jobs</p>
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-border-dim p-4 sm:p-6">
            <p className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-ink-dim" /> Buffer between jobs
            </p>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {[0, 15, 30, 45, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => setBufferMins(mins)}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                    bufferMins === mins ? 'bg-brand text-white shadow-sm' : 'bg-surface-alt text-ink-sub border border-border-dim hover:border-border'
                  }`}
                >
                  {mins === 0 ? 'None' : `${mins}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Days off */}
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-0.5">Days off</p>
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-border-dim p-4 sm:p-6">
            <p className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-ink-dim" /> Blackout dates
            </p>
            <div className="flex gap-2 mb-3 sm:mb-4">
              <input
                type="date"
                value={blackoutInput}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setBlackoutInput(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-surface-alt border border-border-dim rounded-xl focus:ring-2 focus:ring-brand outline-none text-[16px] sm:text-sm"
              />
              <button
                onClick={() => { if (blackoutInput && !blackoutDates.includes(blackoutInput)) { setBlackoutDates(p => [...p, blackoutInput].sort()); setBlackoutInput(''); }}}
                className="px-4 py-2.5 sm:py-3 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition-colors"
              >
                Add
              </button>
            </div>
            {blackoutDates.length === 0 ? (
              <p className="text-xs text-ink-dim">No blackout dates. Add dates when you're unavailable.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {blackoutDates.map(d => (
                  <span key={d} className="flex items-center gap-1.5 px-2.5 py-1 bg-caution-surface border border-caution-edge text-caution rounded-full text-xs font-medium">
                    {new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    <button onClick={() => setBlackoutDates(p => p.filter(x => x !== d))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Account actions (mobile) ── */}
      <div className="sm:hidden mt-6">
        <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2.5 px-1">Account</p>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-3 p-3.5 bg-white rounded-xl border border-border-dim text-left hover:border-caution-edge transition-all"
        >
          <LogOut className="w-4 h-4 text-ink-dim" />
          <span className="text-sm font-medium text-ink-sub">Log out</span>
        </button>
      </div>

      {/* ── Mobile: Save button ── */}
      <div className="sm:hidden mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all ${
            saved ? 'bg-trust text-white' : 'bg-brand text-white hover:bg-brand-dark'
          } disabled:opacity-50`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}
