'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, MapPin, Calendar,
  AlertCircle, Loader2, CheckCircle2, Send,
  X, ImagePlus, Zap,
  Wrench, Hammer, Truck, Package
} from 'lucide-react';
import { BroomIcon, ElectricianIcon } from '@/components/icons';
import { SUBCATEGORIES } from '@/lib/subcategories';

const ICON_MAP: Record<string, React.ElementType> = {
  plumber:              Wrench,
  electrician:          ElectricianIcon,
  cleaning:             BroomIcon,
  handyman:             Hammer,
  'furniture-assembly': Package,
  'moving-help':        Truck,
};

const STEPS = ['Service', 'Type', 'Details', 'Schedule', 'Review'];

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
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-sm font-medium text-ink ${multiline ? 'whitespace-pre-wrap' : 'truncate'}`}>{value}</p>
      </div>
      <button
        onClick={onEdit}
        className="text-xs font-bold text-brand hover:text-brand-dark transition-colors shrink-0 mt-0.5 px-2 py-0.5 rounded-md hover:bg-brand-muted"
      >
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

  const startStep = initialSlug && initialSubcategory ? 3 : initialSlug ? 2 : 1;
  const [step, setStep] = useState(startStep);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    categoryId: '',
    categoryName: '',
    categorySlug: initialSlug,
    subcategorySlug: initialSubcategory,
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
    if (step === 2) return true;
    if (step === 3) return form.description.trim().length >= 10;
    if (step === 4) return !!form.address.trim() && !!form.dateWindow;
    return true;
  };

  const next = () => setStep(s => Math.min(s + 1, 5));
  const back = () => {
    if (step === 2 && initialSlug && !initialSubcategory) { router.back(); return; }
    if (step === 3 && initialSlug && initialSubcategory) { router.back(); return; }
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

      {/* ── Stepper header ── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-border-dim sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={back}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface-alt rounded-full transition-colors shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Step indicators */}
          <div className="flex-1 flex items-center gap-1 min-w-0">
            {STEPS.map((s, i) => {
              const done    = i + 1 < step;
              const current = i + 1 === step;
              return (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className={`flex items-center justify-center rounded-full font-bold transition-all ${
                      current
                        ? 'w-7 h-7 bg-brand text-white text-[11px] ring-4 ring-brand/15'
                        : done
                        ? 'w-6 h-6 bg-brand text-white text-[10px]'
                        : 'w-6 h-6 bg-surface-alt text-ink-dim text-[10px]'
                    }`}>
                      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <span className={`text-xs font-bold hidden sm:block transition-colors ${current ? 'text-ink' : 'text-ink-dim'}`}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px transition-colors ${done ? 'bg-brand' : 'bg-surface-alt'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-2xl mx-auto px-4 pt-7 pb-36">

        {/* ── Step 1: Category ── */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink mb-1">What do you need help with?</h1>
            <p className="text-ink-sub text-sm mb-7">Choose a service to get matched with local pros.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {categories.map((cat) => {
                const Icon = ICON_MAP[cat.slug] || Wrench;
                const selected = form.categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setForm(f => ({ ...f, categoryId: cat.id, categoryName: cat.name, categorySlug: cat.slug }))}
                    className={`p-5 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center active:scale-[0.97] ${
                      selected
                        ? 'border-brand bg-brand shadow-elevated ring-4 ring-brand/15'
                        : 'border-transparent bg-white shadow-sm hover:shadow-elevated hover:border-brand-muted'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                      selected ? 'bg-white/20 text-white' : 'bg-surface-alt text-ink-sub'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className={`font-bold text-sm leading-tight ${selected ? 'text-white' : 'text-ink'}`}>{cat.name}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 2: Subcategory ── */}
        {step === 2 && (() => {
          const catData = SUBCATEGORIES[form.categorySlug];
          return (
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink mb-1">
                {catData?.description ?? 'What type of work do you need?'}
              </h1>
              <p className="text-ink-sub text-sm mb-6">Pick the closest match — or skip and describe it yourself.</p>
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {(catData?.items ?? []).map((item) => {
                  const Icon = item.Icon;
                  const selected = form.subcategorySlug === item.slug;
                  return (
                    <button
                      key={item.slug}
                      onClick={() => {
                        setForm(f => ({
                          ...f,
                          subcategorySlug: item.slug,
                          description: item.label,
                        }));
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col gap-2.5 active:scale-[0.97] ${
                        selected
                          ? 'border-brand bg-brand-muted shadow-sm'
                          : 'border-border-dim bg-white hover:border-brand/40 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        selected ? 'bg-brand text-white' : 'bg-surface-alt text-ink-sub'
                      }`}>
                        <Icon className="w-4.5 h-4.5" strokeWidth={1.5} />
                      </div>
                      <p className={`font-semibold text-sm leading-snug ${selected ? 'text-brand' : 'text-ink'}`}>{item.label}</p>
                    </button>
                  );
                })}
              </div>
              {/* "Something else" — intentionally secondary, still polished */}
              <button
                onClick={() => setStep(3)}
                className="w-full py-3.5 rounded-2xl border border-border-dim bg-white text-ink-sub text-sm font-medium hover:bg-surface-alt hover:text-ink transition-all flex items-center justify-center gap-2"
              >
                Something else
                <ArrowRight className="w-4 h-4 text-ink-dim" />
              </button>
            </div>
          );
        })()}

        {/* ── Step 3: Details ── */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink mb-1">Describe the job</h1>
            <p className="text-ink-sub text-sm mb-6">More detail means better, faster quotes from pros.</p>
            <div className="space-y-5">

              {/* Textarea */}
              <div>
                <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">
                  What needs to be done?
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder={`e.g. "Leaking pipe under kitchen sink, dripping for 2 days. Shutoff valve still works. 3rd floor apartment."`}
                  className="w-full p-4 bg-white border border-border rounded-2xl focus:ring-2 focus:ring-brand outline-none resize-none text-base leading-relaxed"
                />
                <div className="flex justify-between items-center mt-1.5">
                  <p className="text-xs text-ink-dim">{form.description.length} characters — aim for at least 50</p>
                  {form.description.length >= 10 && <CheckCircle2 className="w-4 h-4 text-trust shrink-0" />}
                </div>
              </div>

              {/* Photo upload */}
              <div>
                <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">
                  Photos <span className="normal-case font-normal text-ink-dim">(optional)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                <div className="flex flex-wrap gap-2.5">
                  {photos.map(p => (
                    <div key={p.preview} className="relative w-[76px] h-[76px] rounded-xl overflow-hidden border border-border">
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
                    className="w-[76px] h-[76px] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-brand hover:bg-brand-muted/30 transition-all text-ink-dim hover:text-brand disabled:opacity-50"
                  >
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Add photo</span>
                  </button>
                </div>
                {photos.length > 0 && (
                  <p className="text-xs text-ink-dim mt-2">{photos.length} photo{photos.length > 1 ? 's' : ''} attached</p>
                )}
              </div>

              {/* Urgency toggle — neutral when off, caution when on */}
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isUrgent: !f.isUrgent }))}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                  form.isUrgent
                    ? 'bg-caution-surface border-caution/40'
                    : 'bg-white border-border-dim hover:border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    form.isUrgent ? 'bg-caution/15' : 'bg-surface-alt'
                  }`}>
                    <Zap className={`w-4 h-4 ${form.isUrgent ? 'text-caution' : 'text-ink-dim'}`} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${form.isUrgent ? 'text-orange-900' : 'text-ink'}`}>Mark as urgent</p>
                    <p className={`text-xs mt-0.5 ${form.isUrgent ? 'text-caution' : 'text-ink-sub'}`}>
                      {form.isUrgent ? 'Pros get instant notification to respond faster.' : 'Pros respond within a few hours.'}
                    </p>
                  </div>
                </div>
                {/* Toggle pill */}
                <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ml-3 ${form.isUrgent ? 'bg-caution' : 'bg-border'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isUrgent ? 'left-5' : 'left-0.5'}`} />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Schedule ── */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink mb-1">Location & schedule</h1>
            <p className="text-ink-sub text-sm mb-6">Where is the job and when do you need it done?</p>
            <div className="space-y-5">

              <div>
                <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">Address in Vilnius</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-dim pointer-events-none" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Street name, house number, apartment"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-2xl focus:ring-2 focus:ring-brand outline-none text-base"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">Preferred date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-dim pointer-events-none" />
                  <input
                    type="date"
                    value={form.dateWindow}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm(f => ({ ...f, dateWindow: e.target.value }))}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-2xl focus:ring-2 focus:ring-brand outline-none text-base"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">Time of day</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {TIME_PREFS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setForm(f => ({ ...f, timePreference: t.id }))}
                      className={`py-3.5 px-2 rounded-xl border-2 text-center transition-all active:scale-[0.97] ${
                        form.timePreference === t.id
                          ? 'border-brand bg-brand shadow-sm'
                          : 'border-border-dim bg-white shadow-sm hover:border-brand/40'
                      }`}
                    >
                      <p className={`font-bold text-xs ${form.timePreference === t.id ? 'text-white' : 'text-ink'}`}>{t.label}</p>
                      <p className={`text-[10px] mt-0.5 ${form.timePreference === t.id ? 'text-white/75' : 'text-ink-dim'}`}>{t.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">
                  Budget estimate <span className="normal-case font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-dim font-bold text-base pointer-events-none">€</span>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                    placeholder="e.g. 80"
                    className="w-full pl-10 pr-4 py-4 bg-white border border-border rounded-2xl focus:ring-2 focus:ring-brand outline-none text-base"
                  />
                </div>
                <p className="text-xs text-ink-dim mt-1.5">Helps pros calibrate their quotes. You&apos;re not locked in.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Review ── */}
        {step === 5 && (
          <div>
            {/* Premium heading with trust signal */}
            <div className="flex items-center gap-2.5 mb-1">
              <CheckCircle2 className="w-6 h-6 text-brand shrink-0" />
              <h1 className="text-2xl font-bold tracking-tight text-ink">Review your request</h1>
            </div>
            <p className="text-ink-sub text-sm mb-6 pl-8">Looks good? Post it and get quotes from local pros.</p>

            {/* Review card */}
            <div className="bg-white rounded-2xl border border-border-dim shadow-sm overflow-hidden mb-4">
              {/* Service pill header */}
              <div className="px-5 py-4 border-b border-border-dim bg-surface-alt/50 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 bg-brand-muted text-brand text-xs font-bold px-3 py-1.5 rounded-full">
                  {form.categoryName}
                </span>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-brand hover:text-brand-dark px-2 py-0.5 rounded-md hover:bg-brand-muted transition-all"
                >
                  Change
                </button>
              </div>

              {/* Review rows */}
              <div className="px-5 divide-y divide-border-dim">
                <ReviewRow label="Description" value={form.description} onEdit={() => setStep(3)} multiline />
                {form.isUrgent && (
                  <div className="py-3.5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-caution-surface text-caution text-xs font-bold rounded-full">
                      <Zap className="w-3 h-3" /> Urgent
                    </span>
                  </div>
                )}
                <ReviewRow label="Address" value={form.address} onEdit={() => setStep(4)} />
                <ReviewRow
                  label="Date"
                  value={new Date(form.dateWindow).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  onEdit={() => setStep(4)}
                />
                <ReviewRow
                  label="Time"
                  value={TIME_PREFS.find(t => t.id === form.timePreference)?.label || 'Flexible'}
                  onEdit={() => setStep(4)}
                />
                {form.budget && <ReviewRow label="Budget" value={`€${form.budget}`} onEdit={() => setStep(4)} />}
                {photos.length > 0 && (
                  <div className="py-3.5">
                    <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2">Photos</p>
                    <div className="flex gap-2 flex-wrap">
                      {photos.map(p => (
                        <img key={p.preview} src={p.preview} alt="Attached" className="w-14 h-14 rounded-xl object-cover border border-border-dim" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trust callout */}
            <div className="flex items-start gap-3 p-4 bg-brand-muted rounded-2xl border border-brand/15">
              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <Zap className="w-4 h-4 text-brand" />
              </div>
              <p className="text-sm text-ink-sub leading-relaxed">
                Verified local pros will review and send quotes. Most requests get a response within{' '}
                <span className="font-bold text-ink">1 hour</span>.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── Sticky bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border-dim shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-safe">
          {/* Step indicator */}
          <p className="text-center text-[11px] font-semibold text-ink-dim mb-2.5 tracking-wide">
            Step {step} of {STEPS.length}
          </p>

          {step < 5 ? (
            <button
              onClick={next}
              disabled={!canProceed()}
              className="w-full bg-brand text-white py-3.5 min-h-[48px] rounded-2xl font-bold hover:bg-brand-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-brand text-white py-3.5 min-h-[48px] rounded-2xl font-bold hover:bg-brand-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Post Request</>}
            </button>
          )}

          {/* Extra safe area buffer below pb-safe on very old browsers */}
          <div className="h-1 sm:h-0" />
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
