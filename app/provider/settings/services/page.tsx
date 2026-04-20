'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, Save, CheckCircle2, X, Plus,
  Briefcase, Zap, ToggleLeft, ToggleRight,
} from 'lucide-react';

export default function ProviderServicesSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const initialRef = useRef<string>('');
  const [dirty, setDirty] = useState(false);

  const [offerings, setOfferings] = useState<{ name: string; price: string; priceType: string; description: string }[]>([]);
  const [offeringErrors, setOfferingErrors] = useState<Record<number, string>>({});
  const [instantBook, setInstantBook] = useState(false);

  const getSnapshot = () => JSON.stringify({ offerings, instantBook });

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
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
  }, [status, router]);

  useEffect(() => {
    if (!loading && initialRef.current) {
      setDirty(getSnapshot() !== initialRef.current);
    }
  }, [offerings, instantBook, loading]);

  const handleSave = async () => {
    const errors: Record<number, string> = {};
    offerings.forEach((o, i) => {
      const name = o.name.trim();
      const desc = o.description.trim();
      if (name.length > 0 && name.length < 3) {
        errors[i] = 'Service name must be at least 3 characters.';
      } else if (desc.length > 0 && desc.length < 20) {
        errors[i] = 'Description must be at least 20 characters if provided.';
      } else if (name.length > 0 && (isNaN(parseFloat(o.price)) || parseFloat(o.price) < 0)) {
        errors[i] = 'Price must be a valid positive number.';
      }
    });
    setOfferingErrors(errors);
    if (Object.keys(errors).length > 0) {
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
          instantBook,
          offerings: offerings.map(o => ({ ...o, price: parseFloat(o.price) || 0 })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.error || 'Save failed. Please try again.');
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
      setSaved(true);
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
          <h1 className="text-lg font-bold text-ink">Services</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full font-medium text-sm transition-all ${
            saved ? 'bg-trust text-white shadow-sm'
            : dirty ? 'bg-brand text-white hover:bg-brand-dark shadow-sm'
            : 'bg-surface-alt text-ink-dim border border-border-dim cursor-default'
          } disabled:opacity-60`}
        >
          {saving
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : saved
              ? <><CheckCircle2 className="w-4 h-4" /> Saved</>
              : <><Save className="w-4 h-4" /><span className="hidden sm:inline"> Save Changes</span><span className="sm:hidden"> Save</span></>
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

        {/* Your services */}
        <div>
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-0.5">Your services</p>
          <div className="bg-white rounded-2xl border border-border-dim shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-sm">Service offerings</p>
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
              <div className="text-center py-6">
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
              <div className="space-y-3">
                {offerings.map((o, i) => (
                  <div
                    key={i}
                    className={`p-3.5 bg-surface-alt rounded-xl border ${offeringErrors[i] ? 'border-danger' : 'border-border-dim'} space-y-2.5`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="text"
                        value={o.name}
                        onChange={e => {
                          setOfferings(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x));
                          setOfferingErrors(prev => { const n = { ...prev }; delete n[i]; return n; });
                        }}
                        placeholder="Service name (e.g. TV Installation, Pipe Repair)"
                        className={`flex-1 px-3 py-2 bg-white border ${offeringErrors[i]?.includes('name') ? 'border-danger' : 'border-border'} rounded-xl focus:ring-2 focus:ring-brand outline-none text-[16px] sm:text-sm font-medium`}
                      />
                      <button
                        onClick={() => {
                          setOfferings(p => p.filter((_, j) => j !== i));
                          setOfferingErrors(prev => { const n = { ...prev }; delete n[i]; return n; });
                        }}
                        className="hidden sm:block text-ink-dim hover:text-red-500 transition-colors mt-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={o.description}
                      onChange={e => {
                        setOfferings(prev => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x));
                        setOfferingErrors(prev => { const n = { ...prev }; delete n[i]; return n; });
                      }}
                      placeholder="Describe what's included, typical duration, and any requirements (min. 20 characters)"
                      rows={2}
                      className={`w-full px-3 py-2 bg-white border ${offeringErrors[i]?.includes('escription') ? 'border-danger' : 'border-border'} rounded-xl focus:ring-2 focus:ring-brand outline-none text-[16px] sm:text-sm resize-none`}
                    />
                    {offeringErrors[i] && (
                      <p className="text-xs text-danger font-medium">{offeringErrors[i]}</p>
                    )}
                    <div className="flex gap-2">
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
                    <button
                      onClick={() => setOfferings(p => p.filter((_, j) => j !== i))}
                      className="sm:hidden flex items-center gap-2 text-danger text-xs font-medium"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking settings */}
        <div>
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-0.5">Booking settings</p>
          <div className="bg-white rounded-2xl border border-border-dim shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-muted rounded-xl flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Instant book</p>
                <p className="text-[11px] text-ink-dim mt-0.5 leading-relaxed">Let customers book without approval</p>
              </div>
              <button onClick={() => setInstantBook(!instantBook)} className="shrink-0">
                {instantBook
                  ? <ToggleRight className="w-10 h-10 text-brand" />
                  : <ToggleLeft className="w-10 h-10 text-ink-dim" />
                }
              </button>
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
              : <><Save className="w-4 h-4" /><span className="hidden sm:inline"> Save Changes</span><span className="sm:hidden"> Save</span></>
          }
        </button>
      </div>

    </div>
  );
}
