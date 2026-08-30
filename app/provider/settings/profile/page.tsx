'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2, Tags, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { Section } from '@/components/settings';
import { Button, EmptyState, Input, PageHeader, Select, Textarea, useToast } from '@/components/ui';
import { cn } from '@/lib/utils';

// Response-time values are persisted verbatim on ProviderProfile.responseTime,
// so the option *values* stay English while only the labels are localized.
const RESPONSE_VALUES = [
  'Usually responds in 30 minutes',
  'Usually responds in 1 hour',
  'Usually responds in 2 hours',
  'Usually responds same day',
  'Usually responds within 24 hours',
] as const;

const BIO_MIN = 50;

export default function ProviderProfileSettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const t = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const initialRef = useRef<string>('');
  const [dirty, setDirty] = useState(false);

  const [bio, setBio] = useState('');
  const [bioTouched, setBioTouched] = useState(false);
  const [serviceArea, setServiceArea] = useState('');
  const [languages, setLanguages] = useState<string[]>(['Lithuanian']);
  const [langInput, setLangInput] = useState('');
  const [responseTime, setResponseTime] = useState('Usually responds in 1 hour');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const getSnapshot = () => JSON.stringify({ bio, serviceArea, languages, responseTime, selectedCategories });

  const responseLabels: Record<string, string> = {
    'Usually responds in 30 minutes':    t.providerProfileSettings.response30m,
    'Usually responds in 1 hour':        t.providerProfileSettings.response1h,
    'Usually responds in 2 hours':       t.providerProfileSettings.response2h,
    'Usually responds same day':         t.providerProfileSettings.responseSameDay,
    'Usually responds within 24 hours':  t.providerProfileSettings.response24h,
  };

  // Single source of truth for the Languages chip-add flow. Called from
  // desktop keydown, mobile beforeinput, and the explicit Add button.
  // Dedupe runs inside the functional updater, so calling this twice in the
  // same event sequence (Android soft keyboards sometimes dispatch both
  // keydown and beforeinput for the same Enter) is safe: the second call
  // sees the already-appended array and returns it unchanged.
  const commitLanguage = (raw: string) => {
    const candidate = raw.trim();
    if (!candidate) return;
    setLanguages(prev =>
      prev.some(l => l.toLowerCase() === candidate.toLowerCase())
        ? prev
        : [...prev, candidate]
    );
    setLangInput('');
  };

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/provider/profile', { cache: 'no-store' }).then(async r => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok) {
            console.error('[profile page] GET /api/provider/profile failed:', r.status, data);
            throw new Error(data?.error || `HTTP ${r.status}`);
          }
          return data;
        }),
        fetch('/api/categories', { cache: 'no-store' }).then(r => r.json()).catch(() => []),
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

        const snap = JSON.stringify({
          bio: loadedBio, serviceArea: loadedArea, languages: loadedLanguages,
          responseTime: loadedResponseTime, selectedCategories: loadedCategoryIds,
        });
        initialRef.current = snap;
        setLoading(false);
      }).catch((err) => {
        console.error('[profile page] load failed:', err);
        toast.error(t.providerProfileSettings.loadFailed);
        initialRef.current = JSON.stringify({
          bio: '', serviceArea: '', languages: ['Lithuanian'],
          responseTime: 'Usually responds in 1 hour', selectedCategories: [],
        });
        setLoading(false);
      });
    }
  }, [status, router]);

  useEffect(() => {
    if (!loading && initialRef.current) {
      setDirty(getSnapshot() !== initialRef.current);
    }
  }, [bio, serviceArea, languages, responseTime, selectedCategories, loading]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/provider/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, serviceArea, languages, responseTime, categoryIds: selectedCategories }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('[profile save] server error:', data);
        toast.error(data.error || t.providerProfileSettings.saveFailed);
        return;
      }
      // Update form state from server response to confirm what was actually persisted.
      if (data.serviceArea !== undefined) setServiceArea(data.serviceArea ?? '');
      if (data.bio !== undefined) setBio(data.bio ?? '');
      if (Array.isArray(data.languages)) setLanguages(data.languages);
      if (data.responseTime !== undefined) setResponseTime(data.responseTime ?? responseTime);
      // Rebuild snapshot from confirmed server values
      const confirmedSnapshot = JSON.stringify({
        bio: data.bio ?? bio,
        serviceArea: data.serviceArea ?? serviceArea,
        languages: Array.isArray(data.languages) ? data.languages : languages,
        responseTime: data.responseTime ?? responseTime,
        selectedCategories,
      });
      initialRef.current = confirmedSnapshot;
      setDirty(false);
      toast.success(t.providerProfileSettings.savedToast);
    } catch {
      toast.error(t.common.networkError);
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

  const bioLength = bio.trim().length;
  const bioError = bioTouched && bioLength > 0 && bioLength < BIO_MIN
    ? t.providerProfileSettings.bioMinError
    : undefined;

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Back ── */}
      <Link
        href="/provider/settings"
        className="inline-flex items-center gap-2 -ml-1.5 mb-3 px-1.5 py-1 rounded-input text-xs font-medium text-ink-dim hover:text-ink hover:bg-surface-alt transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.providerSettingsHub.backToSettings}
      </Link>

      <PageHeader
        title={t.providerProfileSettings.title}
        description={t.providerProfileSettings.description}
        size="sm"
        className="mb-5"
        action={
          <Button size="sm" loading={saving} disabled={!dirty} onClick={handleSave}>
            {t.providerProfileSettings.save}
          </Button>
        }
      />

      <div className="space-y-6">

        {/* ── Public profile ── */}
        <Section title={t.providerProfileSettings.sectionPublic}>

          <div className="p-4 sm:p-5">
            <Textarea
              label={t.providerProfileSettings.bioLabel}
              value={bio}
              onChange={e => setBio(e.target.value)}
              onBlur={() => setBioTouched(true)}
              rows={4}
              placeholder={t.providerProfileSettings.bioPlaceholder}
              error={bioError}
              hint={`${bioLength}/${BIO_MIN}`}
            />
          </div>

          <div className="p-4 sm:p-5">
            <Input
              label={t.providerProfileSettings.areaLabel}
              value={serviceArea}
              onChange={e => setServiceArea(e.target.value)}
              placeholder={t.providerProfileSettings.areaPlaceholder}
              hint={t.providerProfileSettings.areaHint}
            />
          </div>

          <div className="p-4 sm:p-5 space-y-2.5">
            {languages.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {languages.map(l => (
                  <span key={l} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-brand-muted text-brand rounded-chip text-xs font-semibold">
                    {l}
                    <button
                      type="button"
                      onClick={() => setLanguages(prev => prev.filter(x => x !== l))}
                      aria-label={`${t.providerProfileSettings.languageRemove}: ${l}`}
                      className="p-0.5 rounded-full hover:bg-brand/15 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <Input
                wrapperClassName="flex-1 min-w-0"
                label={t.providerProfileSettings.languagesLabel}
                value={langInput}
                onChange={e => setLangInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key !== 'Enter') return;
                  // Android IME fires keydown with key 'Unidentified' /
                  // keyCode 229 during composition; skip those — the real
                  // Enter arrives via onBeforeInput below.
                  if ((e.nativeEvent as unknown as { isComposing?: boolean }).isComposing) return;
                  e.preventDefault();
                  commitLanguage(langInput);
                }}
                onBeforeInput={e => {
                  // Soft-keyboard Enter on most Android IMEs (Gboard, SwiftKey,
                  // Samsung) and iOS predictive-text commit + Return dispatch
                  // beforeinput with inputType 'insertLineBreak' even when
                  // keydown is missing or ambiguous. This is the reliable
                  // mobile signal for "user pressed Enter in a single-line
                  // input". commitLanguage is idempotent (dedupe happens
                  // inside setLanguages' functional updater) so if both this
                  // and keydown fire in the same sequence, the second call
                  // is a no-op.
                  const inputType = (e.nativeEvent as InputEvent).inputType;
                  if (inputType === 'insertLineBreak' || inputType === 'insertParagraph') {
                    e.preventDefault();
                    commitLanguage(langInput);
                  }
                }}
                enterKeyHint="done"
                placeholder={t.providerProfileSettings.languagesPlaceholder}
              />
              <Button
                variant="secondary"
                className="py-3"
                onClick={() => commitLanguage(langInput)}
                disabled={!langInput.trim()}
              >
                {t.providerProfileSettings.languagesAdd}
              </Button>
            </div>
            <p className="text-xs text-ink-dim leading-relaxed">{t.providerProfileSettings.languagesHint}</p>
          </div>

          <div className="p-4 sm:p-5">
            <Select
              label={t.providerProfileSettings.responseLabel}
              value={responseTime}
              onChange={e => setResponseTime(e.target.value)}
            >
              {/* Keep an unknown persisted value selectable so saving never
                  silently rewrites it to a different bucket. */}
              {responseTime && !RESPONSE_VALUES.includes(responseTime as typeof RESPONSE_VALUES[number]) && (
                <option value={responseTime}>{responseTime}</option>
              )}
              {RESPONSE_VALUES.map(v => (
                <option key={v} value={v}>{responseLabels[v]}</option>
              ))}
            </Select>
          </div>

        </Section>

        {/* ── Work details ── */}
        <Section title={t.providerProfileSettings.sectionWork}>
          <div className="p-4 sm:p-5">
            <p className="text-sm font-bold text-ink">{t.providerProfileSettings.categoriesTitle}</p>
            <p className="text-xs text-ink-dim mt-0.5 leading-relaxed">{t.providerProfileSettings.categoriesHint}</p>

            {categories.length === 0 ? (
              <EmptyState
                icon={Tags}
                size="xs"
                title={t.providerProfileSettings.categoriesEmptyTitle}
                description={t.providerProfileSettings.categoriesEmptyDesc}
                className="mt-2"
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {categories.map(cat => {
                  const sel = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => setSelectedCategories(prev => sel ? prev.filter(x => x !== cat.id) : [...prev, cat.id])}
                      className={cn(
                        'flex items-center gap-1.5 p-2.5 rounded-input border text-left text-xs font-bold transition-colors',
                        sel
                          ? 'border-brand bg-brand-muted text-brand'
                          : 'border-border bg-card text-ink-sub hover:bg-surface-alt',
                      )}
                    >
                      {sel && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />}
                      <span className="min-w-0 truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Section>

      </div>
    </div>
  );
}
