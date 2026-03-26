'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, MapPin, Calendar,
  AlertCircle, Loader2, CheckCircle2, Send,
  X, ImagePlus,
  Wrench, Hammer, Truck, Paintbrush, Box
} from 'lucide-react';
import { BroomIcon, ElectricianIcon } from '@/components/icons';

const ICON_MAP: Record<string, React.ElementType> = {
  plumber:              Wrench,
  electrician:          ElectricianIcon,
  cleaning:             BroomIcon,
  handyman:             Hammer,
  'furniture-assembly': Box,
  'moving-help':        Truck,
  painting:             Paintbrush,
};



const STEPS = ['Service', 'Details', 'Schedule', 'Review'];

const TIME_PREFS = [
  { id: 'morning',   label: 'Morning',   sub: '8am – 12pm' },
  { id: 'afternoon', label: 'Afternoon', sub: '12pm – 5pm' },
  { id: 'evening',   label: 'Evening',   sub: '5pm – 9pm' },
  { id: 'flexible',  label: 'Flexible',  sub: 'Any time' },
];

function ReviewRow({
  label, value, onEdit, multiline,
}: { label: string; value: string; onEdit: () => void; multiline?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 pb-4 border-b border-border-dim last:border-0 last:pb-0">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-0.5">{label}</p>
        <p className={`text-sm font-medium text-ink ${multiline ? 'whitespace-pre-wrap' : 'truncate'}`}>{value}</p>
      </div>
      <button onClick={onEdit} className="text-xs font-bold text-ink-dim hover:text-ink transition-colors shrink-0 mt-0.5">
        Edit
      </button>
    </div>
  );
}

function NewRequestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSlug        = searchParams.get('category')    || '';
  const initialSubcategory = searchParams.get('subcategory') || '';
  const initialDescription = searchParams.get('description') || '';

  // Skip category step when a category is already provided (from homepage or subcategory screen)
  const [step, setStep] = useState(initialSlug ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    categoryId: '',
    categoryName: '',
    categorySlug: initialSlug,
    description: initialDescription,
    isUrgent: false,
    address: '',
    dateWindow: '',
    timePreference: 'flexible',
    budget: '',
  });
  const [photos, setPhotos] = useState<{ file: File; preview: string; url?: string }[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill saved address and urgent flag from home page
  useEffect(() => {
    const savedAddr = localStorage.getItem('vp_saved_address');
    if (savedAddr) setForm(f => ({ ...f, address: f.address || savedAddr }));
    const urgentParam = searchParams.get('urgent');
    if (urgentParam === '1') setForm(f => ({ ...f, isUrgent: true }));
  }, [searchParams]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingPhoto(true);
    for (const file of files) {
      const preview = URL.createObjectURL(file);
      setPhotos(prev => [...prev, { file, preview }]);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/uploads', { method: 'POST', body: fd });
        if (res.ok) {
          const data = await res.json();
          setPhotos(prev => prev.map(p => p.preview === preview ? { ...p, url: data.url } : p));
        }
      } catch {}
    }
    setUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (preview: string) => {
    setPhotos(prev => prev.filter(p => p.preview !== preview));
  };

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        setCategories(data);
        if (initialSlug) {
          const cat = data.find(c => c.slug === initialSlug);
          if (cat) setForm(f => ({ ...f, categoryId: cat.id, categoryName: cat.name, categorySlug: cat.slug }));
        }
      })
      .catch(() => {});
  }, [initialSlug]);

  const canProceed = () => {
    if (step === 1) return !!form.categoryId;
    if (step === 2) return form.description.trim().length >= 10;
    if (step === 3) return !!form.address.trim() && !!form.dateWindow;
    return true;
  };

  const next = () => setStep(s => Math.min(s + 1, 4));
  const back = () => {
    if (step === 2 && initialSlug) { router.back(); return; }
    if (step > 1) setStep(s => s - 1);
    else router.back();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: form.categoryId,
          address: form.address,
          description: `${form.description}${form.timePreference !== 'flexible' ? `\n\nPreferred time: ${form.timePreference}` : ''}`,
          dateWindow: form.dateWindow,
          budget: form.budget ? form.budget : null,
          isUrgent: form.isUrgent,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/requests/${data.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-border-dim sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={back} className="p-2 hover:bg-surface-alt rounded-full transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-1.5 min-w-0">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-all ${
                    i + 1 < step ? 'bg-brand text-white' :
                    i + 1 === step ? 'bg-brand text-white' :
                    'bg-surface-alt text-ink-dim'
                  }`}>
                    {i + 1 < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-xs font-bold hidden sm:block transition-colors ${i + 1 === step ? 'text-ink' : 'text-ink-dim'}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px transition-colors ${i + 1 < step ? 'bg-brand' : 'bg-surface-alt'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 pb-32">

        {/* Step 1: Category */}
        {step === 1 && (
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink mb-2">What do you need help with?</h1>
            <p className="text-ink-sub text-base mb-8">Choose a service to get matched with the right pros.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map((cat) => {
                const Icon = ICON_MAP[cat.slug] || Wrench;
                const selected = form.categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setForm(f => ({ ...f, categoryId: cat.id, categoryName: cat.name, categorySlug: cat.slug }))}
                    className={`p-6 rounded-[20px] border-2 text-center transition-all flex flex-col items-center justify-center h-full ${
                      selected 
                        ? 'border-brand bg-brand shadow-elevated -translate-y-1' 
                        : 'border-transparent bg-white shadow-sm hover:shadow-elevated hover:border-brand-muted hover:-translate-y-1'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors ${
                      selected ? 'bg-white/20 text-white' : 'bg-surface-alt text-ink-sub'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className={`font-bold text-sm leading-tight ${selected ? 'text-white' : 'text-ink'}`}>{cat.name}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink mb-2">Describe the job</h1>
            <p className="text-ink-sub text-base mb-8">More detail means better, faster quotes from pros.</p>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">
                  What needs to be done?
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={5}
                  placeholder={`e.g. "Leaking pipe under kitchen sink, dripping for 2 days. The shutoff valve still works. Apartment on 3rd floor."`}
                  className="w-full p-4 bg-white border border-border rounded-card focus:ring-2 focus:ring-brand outline-none resize-none text-sm"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-ink-dim">{form.description.length} characters — aim for at least 50</p>
                  {form.description.length >= 10 && <CheckCircle2 className="w-4 h-4 text-trust" />}
                </div>
              </div>

              {/* Photo upload */}
              <div>
                <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">
                  Photos <span className="normal-case font-normal">(optional — helps pros give accurate quotes)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <div className="flex flex-wrap gap-3">
                  {photos.map(p => (
                    <div key={p.preview} className="relative w-20 h-20 rounded-input overflow-hidden border border-border">
                      <img src={p.preview} alt="Upload" className="w-full h-full object-cover" />
                      {!p.url && (
                        <div className="absolute inset-0 bg-ink/40 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(p.preview)}
                        className="absolute top-1 right-1 w-5 h-5 bg-ink/60 hover:bg-ink rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="w-20 h-20 rounded-input border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-brand transition-colors text-ink-dim hover:text-ink"
                  >
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Add</span>
                  </button>
                </div>
                {photos.length > 0 && (
                  <p className="text-xs text-ink-dim mt-2">{photos.length} photo{photos.length > 1 ? 's' : ''} attached</p>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-caution-surface rounded-card border border-caution-edge">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-orange-900">Mark as urgent</p>
                    <p className="text-xs text-caution mt-0.5">Pros get an instant notification to respond faster.</p>
                  </div>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, isUrgent: !f.isUrgent }))}
                  className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${form.isUrgent ? 'bg-caution' : 'bg-border'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isUrgent ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink mb-2">Location & schedule</h1>
            <p className="text-ink-sub text-base mb-8">Where is the job and when do you need it done?</p>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">Address in Vilnius</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-dim" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Street name, house number, apartment"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-card focus:ring-2 focus:ring-brand outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">Preferred date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-dim" />
                  <input
                    type="date"
                    value={form.dateWindow}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm(f => ({ ...f, dateWindow: e.target.value }))}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-card focus:ring-2 focus:ring-brand outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">Time preference</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TIME_PREFS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setForm(f => ({ ...f, timePreference: t.id }))}
                      className={`p-3 rounded-input border-2 text-center transition-all ${
                        form.timePreference === t.id ? 'border-brand bg-brand' : 'border-border bg-white hover:border-border'
                      }`}
                    >
                      <p className={`font-bold text-xs ${form.timePreference === t.id ? 'text-white' : 'text-ink'}`}>{t.label}</p>
                      <p className={`text-[10px] mt-0.5 ${form.timePreference === t.id ? 'text-white/70' : 'text-ink-dim'}`}>{t.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">
                  Budget estimate <span className="normal-case font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-dim font-bold text-sm">€</span>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                    placeholder="e.g. 80"
                    className="w-full pl-10 pr-4 py-4 bg-white border border-border rounded-card focus:ring-2 focus:ring-brand outline-none text-sm"
                  />
                </div>
                <p className="text-xs text-ink-dim mt-1">Helps pros calibrate their quotes. You&apos;re not locked in.</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink mb-2">Review your request</h1>
            <p className="text-ink-sub text-base mb-8">Double-check everything before posting to local pros.</p>
            <div className="bg-white rounded-panel border border-border-dim p-6 space-y-4 shadow-card mb-6">
              <ReviewRow label="Service" value={form.categoryName} onEdit={() => setStep(1)} />
              <ReviewRow label="Description" value={form.description} onEdit={() => setStep(2)} multiline />
              {form.isUrgent && (
                <div className="flex items-center gap-2 py-1">
                  <span className="px-3 py-1 bg-caution-surface text-caution text-xs font-bold rounded-full uppercase tracking-wide">Urgent request</span>
                </div>
              )}
              <ReviewRow label="Address" value={form.address} onEdit={() => setStep(3)} />
              <ReviewRow label="Preferred date" value={new Date(form.dateWindow).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} onEdit={() => setStep(3)} />
              <ReviewRow label="Time preference" value={TIME_PREFS.find(t => t.id === form.timePreference)?.label || 'Flexible'} onEdit={() => setStep(3)} />
              {form.budget && <ReviewRow label="Budget" value={`€${form.budget}`} onEdit={() => setStep(3)} />}
              {photos.length > 0 && (
                <div className="pb-4 border-b border-border-dim last:border-0 last:pb-0">
                  <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2">Photos</p>
                  <div className="flex gap-2 flex-wrap">
                    {photos.map(p => (
                      <img key={p.preview} src={p.preview} alt="Attached" className="w-14 h-14 rounded-input object-cover border border-border-dim" />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-surface-alt rounded-card border border-border-dim text-sm text-ink-sub leading-relaxed">
              Once posted, verified local pros will review your request and send competitive quotes. Most requests receive a response within <span className="font-bold text-ink">1 hour</span>.
            </div>
          </div>
        )}
      </main>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-dim p-4">
        <div className="max-w-2xl mx-auto">
          {step < 4 ? (
            <button
              onClick={next}
              disabled={!canProceed()}
              className="w-full bg-brand text-white py-4 rounded-card font-bold hover:bg-brand-dark transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-brand text-white py-4 rounded-card font-bold hover:bg-brand-dark transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Post Request</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewRequestContent />
    </Suspense>
  );
}
