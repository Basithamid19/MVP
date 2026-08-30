'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft, ArrowRight, Calendar, Check,
  AlertCircle, Loader2, CheckCircle2, Send,
  X, ImagePlus, Zap,
  Wrench, Hammer, Truck, Package
} from 'lucide-react';
import { BroomIcon, ElectricianIcon } from '@/components/icons';
import { SUBCATEGORIES } from '@/lib/subcategories';
import { AddressAutocomplete, Input, Textarea } from '@/components/ui';
import { WizardStepper } from '@/components/WizardStepper';
import { useTranslation } from '@/lib/i18n';

const ICON_MAP: Record<string, React.ElementType> = {
  plumber:              Wrench,
  electrician:          ElectricianIcon,
  cleaning:             BroomIcon,
  handyman:             Hammer,
  'furniture-assembly': Package,
  'moving-help':        Truck,
};

function ReviewRow({
  label, value, onEdit, multiline,
}: { label: string; value: string; onEdit: () => void; multiline?: boolean }) {
  const t = useTranslation();
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="flex-1 min-w-0">
        <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-sm font-medium text-ink ${multiline ? 'whitespace-pre-wrap' : 'truncate'}`}>{value}</p>
      </div>
      <button
        onClick={onEdit}
        className="text-xs font-bold text-brand hover:text-brand-dark transition-colors shrink-0 mt-0.5 px-2 py-0.5 rounded-md hover:bg-brand-muted"
      >
        {t.common.edit}
      </button>
    </div>
  );
}

function NewRequestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { status: authStatus } = useSession();
  const t = useTranslation();

  const STEPS = [
    { key: 'service',  label: t.wizard.stepService },
    { key: 'type',     label: t.wizard.stepType },
    { key: 'details',  label: t.wizard.stepDetails },
    { key: 'schedule', label: t.wizard.stepSchedule },
    { key: 'review',   label: t.wizard.stepReview },
  ];

  const TIME_PREFS = [
    { id: 'morning',   label: t.wizard.timeMorning,   sub: t.wizard.timeMorningSub },
    { id: 'afternoon', label: t.wizard.timeAfternoon, sub: t.wizard.timeAfternoonSub },
    { id: 'evening',   label: t.wizard.timeEvening,   sub: t.wizard.timeEveningSub },
    { id: 'flexible',  label: t.wizard.timeFlexible,  sub: t.wizard.timeFlexibleSub },
  ];

  // Posting requires an account — redirect to login up front instead of
  // letting a guest fill all five steps and hit a silent 401 on submit.
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      const callback = `${pathname}?${searchParams.toString()}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callback)}`);
    }
  }, [authStatus, router, pathname, searchParams]);

  const initialSlug        = searchParams.get('category')    || '';
  const initialSubcategory = searchParams.get('subcategory') || '';
  const initialDescription = searchParams.get('description') || '';
  // Direct request: arriving from a provider's profile targets that provider
  // only — the request is sent to them alone, not broadcast to the category.
  const targetProviderId   = searchParams.get('providerId')  || '';
  // When arriving from a multi-service provider profile, scope the step-1
  // service picker to just that provider's services (comma-separated slugs).
  const providerCatSlugs = (searchParams.get('providerCategories') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const startStep = initialSlug && initialSubcategory ? 3 : initialSlug ? 2 : 1;
  const [step, setStep] = useState(startStep);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
  const [targetProviderName, setTargetProviderName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resolve the target provider's name for the "To:" chip on Review.
  useEffect(() => {
    if (!targetProviderId) return;
    fetch(`/api/providers?id=${targetProviderId}`)
      .then(r => r.json())
      .then(d => { if (d?.user?.name) setTargetProviderName(d.user.name); })
      .catch(() => {});
  }, [targetProviderId]);

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
        } else {
          // Drop the tile instead of leaving a spinner overlay that never
          // resolves (p.url stays unset forever on a failed upload).
          setPhotos(prev => prev.filter(p => p.preview !== preview));
          alert(t.wizard.uploadFailed);
        }
      } catch {
        setPhotos(prev => prev.filter(p => p.preview !== preview));
        alert(t.wizard.uploadFailedNetwork);
      }
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
    setSubmitError(null);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: form.categoryId,
          address: form.address,
          description: form.description,
          dateWindow: form.dateWindow,
          timeOfDay: form.timePreference,
          budget: form.budget ? form.budget : null,
          isUrgent: form.isUrgent,
          photoUrls: photos.map(p => p.url).filter(Boolean),
          providerId: targetProviderId || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/requests/${data.id}`);
        return;
      }
      if (res.status === 401) {
        const callback = `${pathname}?${searchParams.toString()}`;
        router.push(`/login?callbackUrl=${encodeURIComponent(callback)}`);
        return;
      }
      const d = await res.json().catch(() => ({} as any));
      setSubmitError(d.error ?? t.wizard.submitFailed);
    } catch (err) {
      console.error(err);
      setSubmitError(t.common.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas">

      {/* ── Stepper header ── */}
      <header className="bg-card/90 backdrop-blur-md border-b border-border-dim sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={back}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface-alt rounded-full transition-colors shrink-0"
            aria-label={t.common.back}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Step indicators — shared with provider onboarding */}
          <WizardStepper steps={STEPS} current={step} />
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-2xl mx-auto px-4 pt-7 pb-36">

        {/* ── Step 1: Category ── */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink mb-1">{t.wizard.step1Title}</h1>
            <p className="text-ink-sub text-sm mb-7">{t.wizard.step1Subtitle}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(providerCatSlugs.length
                ? categories.filter(c => providerCatSlugs.includes(c.slug))
                : categories
              ).map((cat) => {
                const Icon = ICON_MAP[cat.slug] || Wrench;
                const selected = form.categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setForm(f => ({ ...f, categoryId: cat.id, categoryName: cat.name, categorySlug: cat.slug }))}
                    className={`p-5 rounded-card border-2 text-center transition-all flex flex-col items-center justify-center active:scale-[0.97] ${
                      selected
                        ? 'bg-brand text-white border-brand shadow-elevated'
                        : 'bg-card border-border text-ink-sub hover:border-border-dim'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                      selected ? 'bg-white/20 text-white' : 'bg-brand-muted text-brand'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-sm leading-tight">{cat.name}</p>
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
                {catData?.description ?? t.wizard.step2Fallback}
              </h1>
              <p className="text-ink-sub text-sm mb-6">{t.wizard.step2Subtitle}</p>
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
                      className={`relative p-3.5 rounded-card border-2 text-left transition-all flex flex-col gap-2.5 active:scale-[0.97] ${
                        selected
                          ? 'border-brand bg-brand-muted text-brand'
                          : 'bg-card border-border text-ink-sub hover:border-border-dim hover:bg-surface-alt'
                      }`}
                    >
                      {selected && <Check className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-brand" strokeWidth={3} />}
                      <div className={`w-9 h-9 rounded-input flex items-center justify-center transition-colors ${
                        selected ? 'bg-brand text-white' : 'bg-surface-alt text-ink-sub'
                      }`}>
                        <Icon className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <p className="font-semibold text-sm leading-snug pr-4">{item.label}</p>
                    </button>
                  );
                })}
              </div>
              {/* "Something else" — intentionally secondary, still polished */}
              <button
                onClick={() => setStep(3)}
                className="w-full py-3.5 rounded-card border border-border-dim bg-card text-ink-sub text-sm font-medium hover:bg-surface-alt hover:text-ink transition-all flex items-center justify-center gap-2"
              >
                {t.wizard.somethingElse}
                <ArrowRight className="w-4 h-4 text-ink-dim" />
              </button>
            </div>
          );
        })()}

        {/* ── Step 3: Details ── */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink mb-1">{t.wizard.step3Title}</h1>
            <p className="text-ink-sub text-sm mb-6">{t.wizard.step3Subtitle}</p>
            <div className="space-y-5">

              {/* Textarea */}
              <div>
                <label className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-2 block">
                  {t.wizard.descLabel}
                </label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder={t.wizard.descPlaceholder}
                  /* text-base keeps iOS from zooming on focus — do not drop to text-sm */
                  className="p-4 resize-none text-base leading-relaxed"
                />
                <div className="flex justify-between items-center mt-1.5">
                  <p className="text-xs text-ink-dim">{form.description.length} {t.wizard.charHint}</p>
                  {form.description.length >= 10 && <CheckCircle2 className="w-4 h-4 text-trust shrink-0" />}
                </div>
              </div>

              {/* Photo upload */}
              <div>
                <label className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-2 block">
                  {t.wizard.photosLabel} <span className="normal-case font-normal text-ink-dim">{t.wizard.optional}</span>
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
                    <div key={p.preview} className="relative w-[76px] h-[76px] rounded-input overflow-hidden border border-border">
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
                    className="w-[76px] h-[76px] rounded-input border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-brand hover:bg-brand-muted/30 transition-all text-ink-dim hover:text-brand disabled:opacity-50"
                  >
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-3xs font-bold">{t.wizard.addPhoto}</span>
                  </button>
                </div>
                {photos.length > 0 && (
                  <p className="text-xs text-ink-dim mt-2">{photos.length} {photos.length > 1 ? t.wizard.photosAttached : t.wizard.photoAttached}</p>
                )}
              </div>

              {/* Urgency toggle — neutral when off, caution when on */}
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isUrgent: !f.isUrgent }))}
                className={`w-full flex items-center justify-between p-4 rounded-card border transition-all text-left ${
                  form.isUrgent
                    ? 'bg-caution-surface border-caution-edge'
                    : 'bg-card border-border-dim hover:border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-input flex items-center justify-center shrink-0 ${
                    form.isUrgent ? 'bg-caution/15' : 'bg-surface-alt'
                  }`}>
                    <Zap className={`w-4 h-4 ${form.isUrgent ? 'text-caution' : 'text-ink-dim'}`} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${form.isUrgent ? 'text-caution' : 'text-ink'}`}>{t.wizard.markUrgent}</p>
                    <p className={`text-xs mt-0.5 ${form.isUrgent ? 'text-caution/80' : 'text-ink-sub'}`}>
                      {form.isUrgent ? t.wizard.urgentOn : t.wizard.urgentOff}
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
            <h1 className="text-2xl font-bold tracking-tight text-ink mb-1">{t.wizard.step4Title}</h1>
            <p className="text-ink-sub text-sm mb-6">{t.wizard.step4Subtitle}</p>
            <div className="space-y-5">

              <div>
                <label className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-2 block">{t.wizard.addressLabel}</label>
                <AddressAutocomplete
                  value={form.address}
                  onChange={v => setForm(f => ({ ...f, address: v }))}
                  placeholder={t.wizard.addressPlaceholder}
                />
              </div>

              <div>
                <label className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-2 block">{t.wizard.dateLabel}</label>
                <Input
                  type="date"
                  value={form.dateWindow}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, dateWindow: e.target.value }))}
                  leading={<Calendar className="w-5 h-5" />}
                  className="py-4 text-base"
                />
              </div>

              <div>
                <label className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-2 block">{t.wizard.timeLabel}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {TIME_PREFS.map(pref => {
                    const selected = form.timePreference === pref.id;
                    return (
                      <button
                        key={pref.id}
                        onClick={() => setForm(f => ({ ...f, timePreference: pref.id }))}
                        className={`relative py-3.5 px-2 rounded-card border-2 text-center transition-all active:scale-[0.97] ${
                          selected
                            ? 'border-brand bg-brand-muted text-brand'
                            : 'bg-card border-border text-ink-sub hover:border-border-dim hover:bg-surface-alt'
                        }`}
                      >
                        {selected && <Check className="absolute top-1.5 right-1.5 w-3 h-3 text-brand" strokeWidth={3} />}
                        <p className="font-bold text-xs">{pref.label}</p>
                        <p className={`text-3xs mt-0.5 ${selected ? 'text-brand/70' : 'text-ink-dim'}`}>{pref.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-2 block">
                  {t.wizard.budgetLabel} <span className="normal-case font-normal">{t.wizard.optional}</span>
                </label>
                <Input
                  type="number"
                  value={form.budget}
                  onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                  placeholder={t.wizard.budgetPlaceholder}
                  leading={<span className="font-bold text-base">€</span>}
                  hint={t.wizard.budgetHint}
                  className="py-4 text-base"
                />
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
              <h1 className="text-2xl font-bold tracking-tight text-ink">{t.wizard.step5Title}</h1>
            </div>
            <p className="text-ink-sub text-sm mb-6 pl-8">
              {targetProviderId
                ? t.wizard.step5SubtitleDirect
                : t.wizard.step5SubtitleOpen}
            </p>

            {/* Direct-request chip */}
            {targetProviderId && (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 mb-4 bg-brand-muted rounded-full">
                <Send className="w-3.5 h-3.5 text-brand-dark" />
                <span className="text-xs font-bold text-brand-dark">
                  {t.wizard.toPrefix} {targetProviderName ?? t.wizard.chosenProFallback} {t.wizard.toSuffix}
                </span>
              </div>
            )}

            {/* Review card */}
            <div className="bg-card rounded-card border border-border-dim shadow-card overflow-hidden mb-4">
              {/* Service pill header */}
              <div className="px-5 py-4 border-b border-border-dim bg-surface-alt/50 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 bg-brand-muted text-brand text-xs font-bold px-3 py-1.5 rounded-full">
                  {form.categoryName}
                </span>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-brand hover:text-brand-dark px-2 py-0.5 rounded-md hover:bg-brand-muted transition-all"
                >
                  {t.wizard.change}
                </button>
              </div>

              {/* Review rows */}
              <div className="px-5 divide-y divide-border-dim">
                <ReviewRow label={t.wizard.reviewDescription} value={form.description} onEdit={() => setStep(3)} multiline />
                {form.isUrgent && (
                  <div className="py-3.5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-caution-surface text-caution text-xs font-bold rounded-full">
                      <Zap className="w-3 h-3" /> {t.hero.urgent}
                    </span>
                  </div>
                )}
                <ReviewRow label={t.common.address} value={form.address} onEdit={() => setStep(4)} />
                <ReviewRow
                  label={t.common.date}
                  value={new Date(form.dateWindow).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  onEdit={() => setStep(4)}
                />
                <ReviewRow
                  label={t.common.time}
                  value={TIME_PREFS.find(p => p.id === form.timePreference)?.label || t.wizard.timeFlexible}
                  onEdit={() => setStep(4)}
                />
                {form.budget && <ReviewRow label={t.wizard.reviewBudget} value={`€${form.budget}`} onEdit={() => setStep(4)} />}
                {photos.length > 0 && (
                  <div className="py-3.5">
                    <p className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-2">{t.wizard.reviewPhotos}</p>
                    <div className="flex gap-2 flex-wrap">
                      {photos.map(p => (
                        <img key={p.preview} src={p.preview} alt="Attached" className="w-14 h-14 rounded-input object-cover border border-border-dim" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trust callout */}
            <div className="flex items-start gap-3 p-4 bg-brand-muted rounded-card border border-brand/15">
              <div className="w-8 h-8 bg-card rounded-input flex items-center justify-center shrink-0 shadow-card">
                <Zap className="w-4 h-4 text-brand" />
              </div>
              <p className="text-sm text-ink-sub leading-relaxed">
                {t.wizard.calloutPrefix}{' '}
                <span className="font-bold text-ink">{t.wizard.calloutBold}</span>.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── Sticky bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border-dim shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
          {/* Submit error — a failed POST used to be completely invisible */}
          {submitError && step === 5 && (
            <div className="flex items-start gap-2.5 px-4 py-3 mb-2.5 bg-caution-surface border border-caution-edge rounded-card">
              <AlertCircle className="w-4 h-4 text-caution shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-caution leading-relaxed">{submitError}</p>
            </div>
          )}

          {/* Step indicator */}
          <p className="text-center text-2xs font-semibold text-ink-dim mb-2.5 tracking-wide">
            {t.wizard.stepLabel} {step} {t.wizard.stepOf} {STEPS.length}
          </p>

          {step < 5 ? (
            <button
              onClick={next}
              disabled={!canProceed()}
              className="w-full bg-brand text-white py-3.5 min-h-[48px] rounded-card font-bold hover:bg-brand-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {t.wizard.continueBtn} <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-brand text-white py-3.5 min-h-[48px] rounded-card font-bold hover:bg-brand-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> {t.wizard.postRequest}</>}
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
