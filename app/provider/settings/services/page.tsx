'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Briefcase, Loader2, Plus, Trash2, Zap } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { Section } from '@/components/settings';
import {
  Button, EmptyState, Input, PageHeader, Select, Switch, Textarea, useToast,
} from '@/components/ui';

type Offering = { name: string; price: string; priceType: string; description: string };
/** Per-field validation messages for one offering row. */
type OfferingError = { name?: string; description?: string; price?: string };

const EMPTY_OFFERING: Offering = { name: '', price: '', priceType: 'HOURLY', description: '' };

export default function ProviderServicesSettingsPage() {
  const { status } = useSession();
  const t = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const initialRef = useRef<string>('');
  const [dirty, setDirty] = useState(false);

  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [offeringErrors, setOfferingErrors] = useState<Record<number, OfferingError>>({});
  const [instantBook, setInstantBook] = useState(false);

  const getSnapshot = () => JSON.stringify({ offerings, instantBook });

  const addOffering = () => setOfferings(p => [...p, { ...EMPTY_OFFERING }]);

  /** Patch one field of row `i` and drop that field's error. */
  const patchOffering = (i: number, patch: Partial<Offering>, clear?: keyof OfferingError) => {
    setOfferings(prev => prev.map((x, j) => (j === i ? { ...x, ...patch } : x)));
    if (clear) {
      setOfferingErrors(prev => {
        const row = prev[i];
        if (!row?.[clear]) return prev;
        const next = { ...prev, [i]: { ...row, [clear]: undefined } };
        if (!next[i].name && !next[i].description && !next[i].price) delete next[i];
        return next;
      });
    }
  };

  // Removing a row shifts every later index, so keyed-by-index errors can no
  // longer be trusted — clear them all. (The old page cleared only errors[i]
  // on desktop and nothing at all on mobile.)
  const removeOffering = (i: number) => {
    setOfferings(p => p.filter((_, j) => j !== i));
    setOfferingErrors({});
  };

  useEffect(() => {
    // middleware owns the auth gate here; client 'unauthenticated' may be transient.
    if (status === 'authenticated') {
      fetch('/api/provider/profile').then(r => r.json()).then(profile => {
        const p = profile ?? {};
        const loadedOfferings = (p.offerings ?? []).map((o: any) => ({
          name: o.name, price: String(o.price), priceType: o.priceType, description: o.description ?? '',
        }));
        const loadedInstantBook = p.instantBook ?? false;

        setOfferings(loadedOfferings);
        setInstantBook(loadedInstantBook);
        setLoading(false);

        initialRef.current = JSON.stringify({ offerings: loadedOfferings, instantBook: loadedInstantBook });
      }).catch(() => setLoading(false));
    }
  }, [status]);

  useEffect(() => {
    if (!loading && initialRef.current) {
      setDirty(getSnapshot() !== initialRef.current);
    }
  }, [offerings, instantBook, loading]);

  const handleSave = async () => {
    const errors: Record<number, OfferingError> = {};
    offerings.forEach((o, i) => {
      const name = o.name.trim();
      const desc = o.description.trim();
      const row: OfferingError = {};
      if (name.length > 0 && name.length < 3) row.name = t.providerServices.errNameShort;
      if (desc.length > 0 && desc.length < 20) row.description = t.providerServices.errDescShort;
      if (name.length > 0 && (isNaN(parseFloat(o.price)) || parseFloat(o.price) < 0)) {
        row.price = t.providerServices.errPrice;
      }
      if (row.name || row.description || row.price) errors[i] = row;
    });
    setOfferingErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error(t.providerServices.fixErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/provider/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instantBook,
          offerings: offerings.map(o => ({ ...o, price: parseFloat(o.price) || 0 })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || t.providerServices.saveFailed);
        return;
      }
      // Ground truth is the server's response, not our local form state. If
      // the server dropped a column (e.g. instantBook missing in DB), local
      // state would falsely claim dirty=false. Re-hydrate from the response
      // and snapshot that.
      const persisted = await res.json().catch(() => null);
      if (persisted && typeof persisted === 'object') {
        const persistedOfferings = Array.isArray(persisted.offerings)
          ? persisted.offerings.map((o: any) => ({
              name: o.name ?? '',
              price: String(o.price ?? ''),
              priceType: o.priceType ?? 'HOURLY',
              description: o.description ?? '',
            }))
          : [];
        const persistedInstantBook = Boolean(persisted.instantBook);
        setOfferings(persistedOfferings);
        setInstantBook(persistedInstantBook);
        initialRef.current = JSON.stringify({
          offerings: persistedOfferings,
          instantBook: persistedInstantBook,
        });
      } else {
        initialRef.current = getSnapshot();
      }
      setDirty(false);
      toast.success(t.providerServices.savedToast);
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

  const addButton = (
    <Button variant="secondary" size="sm" onClick={addOffering}>
      <Plus className="w-3.5 h-3.5" /> {t.providerServices.add}
    </Button>
  );

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
        title={t.providerServices.title}
        description={t.providerServices.description}
        size="sm"
        className="mb-5"
        action={
          <Button size="sm" loading={saving} disabled={!dirty} onClick={handleSave}>
            {t.providerServices.save}
          </Button>
        }
      />

      <Section title={t.providerServices.sectionServices}>

        {/* ── Offerings ── */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">{t.providerServices.offeringsTitle}</p>
              {offerings.length > 0 && (
                <p className="text-xs text-ink-dim mt-0.5">
                  {offerings.length}{' '}
                  {offerings.length === 1 ? t.providerServices.countOne : t.providerServices.countMany}
                </p>
              )}
            </div>
            {offerings.length > 0 && addButton}
          </div>

          {offerings.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              size="sm"
              title={t.providerServices.emptyTitle}
              description={t.providerServices.emptyDesc}
              action={
                <Button variant="secondary" size="sm" onClick={addOffering}>
                  <Plus className="w-3.5 h-3.5" /> {t.providerServices.emptyAction}
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {offerings.map((o, i) => {
                const err = offeringErrors[i];
                return (
                  <div key={i} className="p-3.5 bg-surface-alt rounded-input border border-border-dim space-y-3">

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-3xs font-bold uppercase tracking-widest text-ink-dim">
                        #{i + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={o.name ? `${t.providerServices.remove}: ${o.name}` : t.providerServices.remove}
                        className="-mr-1.5 text-ink-dim hover:text-danger"
                        onClick={() => removeOffering(i)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <Input
                      label={t.providerServices.nameLabel}
                      value={o.name}
                      onChange={e => patchOffering(i, { name: e.target.value }, 'name')}
                      placeholder={t.providerServices.namePlaceholder}
                      error={err?.name}
                      className="bg-card"
                    />

                    <Textarea
                      label={t.providerServices.descriptionLabel}
                      value={o.description}
                      onChange={e => patchOffering(i, { description: e.target.value }, 'description')}
                      placeholder={t.providerServices.descriptionPlaceholder}
                      rows={3}
                      error={err?.description}
                      className="bg-card"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label={t.providerServices.priceLabel}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        value={o.price}
                        onChange={e => patchOffering(i, { price: e.target.value }, 'price')}
                        placeholder="0"
                        leading={<span className="text-sm font-bold">€</span>}
                        error={err?.price}
                        className="bg-card"
                      />
                      <Select
                        label={t.providerServices.priceTypeLabel}
                        value={o.priceType}
                        onChange={e => patchOffering(i, { priceType: e.target.value })}
                        className="bg-card"
                      >
                        <option value="HOURLY">{t.providerServices.priceHourly}</option>
                        <option value="FIXED">{t.providerServices.priceFixed}</option>
                        <option value="FROM">{t.providerServices.priceFrom}</option>
                      </Select>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Instant book — one switch, one row (no section of its own) ── */}
        <div className="flex items-center gap-3 p-4 sm:p-5">
          <div className="w-8 h-8 bg-brand-muted rounded-input flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-brand" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink">{t.providerServices.instantBookTitle}</p>
            <p className="text-2xs text-ink-dim mt-0.5 leading-snug">{t.providerServices.instantBookDesc}</p>
          </div>
          <Switch
            checked={instantBook}
            onChange={setInstantBook}
            label={t.providerServices.instantBookTitle}
          />
        </div>

      </Section>
    </div>
  );
}
