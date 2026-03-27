'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2, Save, Plus, X, CheckCircle2, MapPin,
  Languages, Clock, DollarSign, Calendar, ToggleLeft, ToggleRight, LogOut, Camera, User,
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Profile state
  const [bio, setBio] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [languages, setLanguages] = useState<string[]>(['Lithuanian']);
  const [langInput, setLangInput] = useState('');
  const [responseTime, setResponseTime] = useState('Usually responds in 1 hour');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [instantBook, setInstantBook] = useState(false);

  // Services state
  const [offerings, setOfferings] = useState<{name: string; price: string; priceType: string; description: string}[]>([]);

  // Availability state
  const [slots, setSlots] = useState<{dayOfWeek: number; startTime: string; endTime: string; enabled: boolean}[]>(
    DAYS.map((_, i) => ({ dayOfWeek: i, startTime: '09:00', endTime: '17:00', enabled: i >= 1 && i <= 5 }))
  );
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [blackoutInput, setBlackoutInput] = useState('');
  const [bufferMins, setBufferMins] = useState(30);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/provider/profile').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
      ]).then(([profile, cats]) => {
        if (profile) {
          setBio(profile.bio ?? '');
          setServiceArea(profile.serviceArea ?? '');
          setLanguages(profile.languages ?? ['Lithuanian']);
          setResponseTime(profile.responseTime ?? 'Usually responds in 1 hour');
          setSelectedCategories(profile.categories?.map((c: any) => c.id) ?? []);
          if (profile.offerings?.length) setOfferings(profile.offerings.map((o: any) => ({ name: o.name, price: String(o.price), priceType: o.priceType, description: o.description ?? '' })));
          if (profile.availability?.length) {
            setSlots(DAYS.map((_, i) => {
              const existing = profile.availability.find((s: any) => s.dayOfWeek === i);
              return existing ? { dayOfWeek: i, startTime: existing.startTime, endTime: existing.endTime, enabled: true }
                              : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', enabled: false };
            }));
          }
        }
        if (Array.isArray(cats)) setCategories(cats);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [status, router]);

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
    setSaving(true);
    try {
      await fetch('/api/provider/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio, serviceArea, languages, responseTime,
          categoryIds: selectedCategories,
          offerings: offerings.map(o => ({ ...o, price: parseFloat(o.price) || 0 })),
          availability: slots.filter(s => s.enabled).map(s => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-ink-dim" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">Settings</h1>
          <p className="text-sm text-ink-sub mt-1">Manage your profile, services, and availability</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 sm:py-2.5 rounded-full font-medium text-sm transition-all shadow-sm hover:shadow-md ${
            saved ? 'bg-trust text-white' : 'bg-brand text-white hover:bg-brand-dark'
          } disabled:opacity-50`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1.5 bg-white rounded-2xl border border-border-dim mb-6 sm:mb-8 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[100px] py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-surface-alt text-ink shadow-sm border border-border-dim' : 'text-ink-sub hover:text-ink border border-transparent'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'Profile' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-border-dim p-5 sm:p-6 space-y-5">

            {/* Photo upload */}
            <div>
              <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-3 block">Profile Photo</label>
              <div className="flex items-center gap-4">
                <label className="relative w-20 h-20 shrink-0 cursor-pointer">
                  <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-canvas border-2 border-border-dim flex items-center justify-center">
                    {localAvatar || session?.user?.image
                      ? <img src={localAvatar ?? session?.user?.image ?? ''} alt="" className="w-full h-full object-cover" />
                      : <User className="w-8 h-8 text-ink-dim" />
                    }
                  </div>
                  {/* Always-visible camera badge */}
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand rounded-full flex items-center justify-center shadow-md">
                    {avatarUploading
                      ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                      : <Camera className="w-4 h-4 text-white" />
                    }
                  </div>
                </label>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {avatarUploading ? 'Uploading…' : (localAvatar || session?.user?.image) ? 'Photo uploaded' : 'No photo yet'}
                  </p>
                  <p className="text-xs text-ink-sub mt-0.5">Tap to upload · JPG or PNG · Square crop recommended</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">Bio / Introduction</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                placeholder="Tell customers about your experience, specialties, and what makes you stand out..."
                className="w-full p-4 bg-surface-alt border border-border-dim rounded-2xl focus:ring-2 focus:ring-brand outline-none resize-none text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Coverage area
              </label>
              <input
                type="text"
                value={serviceArea}
                onChange={e => setServiceArea(e.target.value)}
                placeholder="e.g. Vilnius Center, Antakalnis, Žirmūnai"
                className="w-full px-4 py-4 bg-surface-alt border border-border-dim rounded-2xl focus:ring-2 focus:ring-brand outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block flex items-center gap-1">
                <Languages className="w-3 h-3" /> Languages
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {languages.map(l => (
                  <span key={l} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-alt rounded-xl text-sm font-medium">
                    {l}
                    <button onClick={() => setLanguages(prev => prev.filter(x => x !== l))}><X className="w-3 h-3 text-ink-dim hover:text-ink" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={langInput}
                  onChange={e => setLangInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && langInput.trim()) { setLanguages(p => [...p, langInput.trim()]); setLangInput(''); } }}
                  placeholder="Add language and press Enter"
                  className="flex-1 px-4 py-3 bg-surface-alt border border-border-dim rounded-xl focus:ring-2 focus:ring-brand outline-none text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block flex items-center gap-1">
                <Clock className="w-3 h-3" /> Typical response time
              </label>
              <select
                value={responseTime}
                onChange={e => setResponseTime(e.target.value)}
                className="w-full px-4 py-4 bg-surface-alt border border-border-dim rounded-2xl focus:ring-2 focus:ring-brand outline-none text-sm"
              >
                <option>Usually responds in 30 minutes</option>
                <option>Usually responds in 1 hour</option>
                <option>Usually responds in 2 hours</option>
                <option>Usually responds same day</option>
                <option>Usually responds within 24 hours</option>
              </select>
            </div>
          </div>

          {/* Category selection */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-border-dim p-5 sm:p-6">
            <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-4">Service categories</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map(cat => {
                const sel = selectedCategories.includes(cat.id);
                return (
                  <button key={cat.id} onClick={() => setSelectedCategories(prev => sel ? prev.filter(x => x !== cat.id) : [...prev, cat.id])}
                    className={`p-3 rounded-xl border-2 text-left text-sm font-bold transition-all ${sel ? 'border-brand bg-brand text-white' : 'border-border bg-white hover:border-border'}`}>
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SERVICES TAB */}
      {activeTab === 'Services' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-border-dim p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="font-bold">Service offerings</p>
              <button
                onClick={() => setOfferings(p => [...p, { name: '', price: '', priceType: 'HOURLY', description: '' }])}
                className="flex items-center gap-1.5 text-sm font-bold text-ink border border-brand px-3 py-1.5 rounded-xl hover:bg-brand hover:text-white transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add service
              </button>
            </div>

            {offerings.length === 0 ? (
              <div className="text-center py-8 text-ink-dim">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No services added yet. Add your first service offering.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {offerings.map((o, i) => (
                  <div key={i} className="p-4 bg-surface-alt rounded-2xl border border-border-dim space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <input
                        type="text"
                        value={o.name}
                        onChange={e => setOfferings(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                        placeholder="Service name (e.g. Pipe repair)"
                        className="flex-1 px-3 py-2 bg-white border border-border rounded-xl focus:ring-2 focus:ring-brand outline-none text-sm font-medium"
                      />
                      <button onClick={() => setOfferings(p => p.filter((_, j) => j !== i))} className="hidden sm:block text-ink-dim hover:text-red-500 transition-colors mt-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={o.description}
                      onChange={e => setOfferings(prev => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                      placeholder="Short description (optional)"
                      className="w-full px-3 py-2 bg-white border border-border rounded-xl focus:ring-2 focus:ring-brand outline-none text-sm"
                    />
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim font-bold text-sm">€</span>
                        <input
                          type="number"
                          value={o.price}
                          onChange={e => setOfferings(prev => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))}
                          placeholder="0"
                          className="w-full pl-7 pr-3 py-2 bg-white border border-border rounded-xl focus:ring-2 focus:ring-brand outline-none text-sm font-medium"
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
                    <button onClick={() => setOfferings(p => p.filter((_, j) => j !== i))} className="sm:hidden flex items-center gap-2 text-danger text-sm font-medium mt-2">
                      <X className="w-4 h-4" /> Remove Service
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instant book toggle */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-border-dim p-5 sm:p-6 flex items-center justify-between">
            <div>
              <p className="font-bold">Instant book</p>
              <p className="text-sm text-ink-dim mt-0.5">Allow customers to book directly without waiting for your approval</p>
            </div>
            <button onClick={() => setInstantBook(!instantBook)} className="shrink-0">
              {instantBook
                ? <ToggleRight className="w-10 h-10 text-ink" />
                : <ToggleLeft className="w-10 h-10 text-ink-dim" />
              }
            </button>
          </div>
        </div>
      )}

      {/* AVAILABILITY TAB */}
      {activeTab === 'Availability' && (
        <div className="space-y-5">
          {/* Working hours */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-border-dim p-5 sm:p-6">
            <p className="font-bold mb-5 flex items-center gap-2"><Calendar className="w-4 h-4" /> Working hours</p>
            <div className="space-y-3">
              {slots.map((slot, i) => (
                <div key={i} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-2xl transition-all ${slot.enabled ? 'bg-surface-alt' : 'opacity-40'}`}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSlots(prev => prev.map((s, j) => j === i ? { ...s, enabled: !s.enabled } : s))}
                      className={`w-8 h-5 rounded-full relative transition-colors shrink-0 ${slot.enabled ? 'bg-brand' : 'bg-border'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${slot.enabled ? 'left-3.5' : 'left-0.5'}`} />
                    </button>
                    <span className="w-10 text-sm font-bold text-ink-sub shrink-0">{DAYS[i]}</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                    <select
                      value={slot.startTime}
                      disabled={!slot.enabled}
                      onChange={e => setSlots(prev => prev.map((s, j) => j === i ? { ...s, startTime: e.target.value } : s))}
                      className="flex-1 px-3 py-2 sm:py-1.5 bg-white border border-border rounded-xl text-sm outline-none disabled:opacity-40"
                    >
                      {ALL_TIMES.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="text-ink-dim text-sm">–</span>
                    <select
                      value={slot.endTime}
                      disabled={!slot.enabled}
                      onChange={e => setSlots(prev => prev.map((s, j) => j === i ? { ...s, endTime: e.target.value } : s))}
                      className="flex-1 px-3 py-2 sm:py-1.5 bg-white border border-border rounded-xl text-sm outline-none disabled:opacity-40"
                    >
                      {ALL_TIMES.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buffer time */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-border-dim p-5 sm:p-6">
            <p className="font-bold mb-4 flex items-center gap-2"><Clock className="w-4 h-4" /> Buffer time between jobs</p>
            <div className="flex gap-2 flex-wrap">
              {[0, 15, 30, 45, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => setBufferMins(mins)}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all ${bufferMins === mins ? 'border-brand bg-brand text-white' : 'border-border hover:border-border'}`}
                >
                  {mins === 0 ? 'None' : `${mins} min`}
                </button>
              ))}
            </div>
          </div>

          {/* Blackout dates */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-border-dim p-5 sm:p-6">
            <p className="font-bold mb-4 flex items-center gap-2"><X className="w-4 h-4" /> Blackout dates</p>
            <div className="flex gap-2 mb-4">
              <input
                type="date"
                value={blackoutInput}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setBlackoutInput(e.target.value)}
                className="flex-1 px-4 py-3 bg-surface-alt border border-border-dim rounded-xl focus:ring-2 focus:ring-brand outline-none text-sm"
              />
              <button
                onClick={() => { if (blackoutInput && !blackoutDates.includes(blackoutInput)) { setBlackoutDates(p => [...p, blackoutInput].sort()); setBlackoutInput(''); }}}
                className="px-4 py-3 bg-brand text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
              >
                Add
              </button>
            </div>
            {blackoutDates.length === 0 ? (
              <p className="text-sm text-ink-dim">No blackout dates set.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {blackoutDates.map(d => (
                  <span key={d} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 text-danger rounded-xl text-sm font-medium">
                    {new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    <button onClick={() => setBlackoutDates(p => p.filter(x => x !== d))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logout — mobile only */}
      <div className="md:hidden pt-4 pb-8">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center justify-center gap-2 py-4 border border-border-dim rounded-2xl text-sm font-bold text-ink-sub hover:border-red-200 hover:text-danger transition-all"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>
    </div>
  );
}
