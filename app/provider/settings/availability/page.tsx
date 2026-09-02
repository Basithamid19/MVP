'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Check, Loader2, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { Section } from '@/components/settings';
import { Button, Input, PageHeader, Select, Switch, useToast } from '@/components/ui';
import { cn } from '@/lib/utils';

// Index === ProviderAvailability.dayOfWeek (0 = Sunday), which is what the
// API stores. Display order starts on Monday, the local convention.
const DAY_COUNT = 7;
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const ALL_TIMES = [
  '06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00',
];
const BUFFER_OPTIONS = [0, 15, 30, 45, 60];

export default function ProviderAvailabilitySettingsPage() {
  const { status } = useSession();
  const t = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const initialRef = useRef<string>('');
  const [dirty, setDirty] = useState(false);

  const [slots, setSlots] = useState<{ dayOfWeek: number; startTime: string; endTime: string; enabled: boolean }[]>(
    Array.from({ length: DAY_COUNT }, (_, i) => ({ dayOfWeek: i, startTime: '09:00', endTime: '17:00', enabled: i >= 1 && i <= 5 }))
  );
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [blackoutInput, setBlackoutInput] = useState('');
  const [bufferMins, setBufferMins] = useState(30);

  const dayNames = [
    t.providerAvailability.daySunday,
    t.providerAvailability.dayMonday,
    t.providerAvailability.dayTuesday,
    t.providerAvailability.dayWednesday,
    t.providerAvailability.dayThursday,
    t.providerAvailability.dayFriday,
    t.providerAvailability.daySaturday,
  ];

  const getSnapshot = () => JSON.stringify({ slots, blackoutDates, bufferMins });

  useEffect(() => {
    // middleware owns the auth gate here; client 'unauthenticated' may be transient.
    if (status === 'authenticated') {
      fetch('/api/provider/profile').then(r => r.json()).then(profile => {
        const p = profile ?? {};
        const loadedSlots = Array.from({ length: DAY_COUNT }, (_, i) => {
          const existing = (p.availability ?? []).find((s: any) => s.dayOfWeek === i);
          return existing
            ? { dayOfWeek: i, startTime: existing.startTime, endTime: existing.endTime, enabled: true }
            : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', enabled: false };
        });
        const loadedBlackoutDates = p.blackoutDates ?? [];
        const loadedBufferMins = p.bufferMins ?? 30;

        setSlots(loadedSlots);
        setBlackoutDates(loadedBlackoutDates);
        setBufferMins(loadedBufferMins);
        setLoading(false);

        initialRef.current = JSON.stringify({ slots: loadedSlots, blackoutDates: loadedBlackoutDates, bufferMins: loadedBufferMins });
      }).catch(() => setLoading(false));
    }
  }, [status]);

  useEffect(() => {
    if (!loading && initialRef.current) {
      setDirty(getSnapshot() !== initialRef.current);
    }
  }, [slots, blackoutDates, bufferMins, loading]);

  const toggleDay = (i: number) =>
    setSlots(prev => prev.map((s, j) => (j === i ? { ...s, enabled: !s.enabled } : s)));

  // Moving the start past the end would produce an impossible window, so the
  // end is pulled up to the next slot.
  const setStart = (i: number, value: string) =>
    setSlots(prev => prev.map((s, j) => {
      if (j !== i) return s;
      const endTime = s.endTime > value
        ? s.endTime
        : ALL_TIMES[Math.min(ALL_TIMES.indexOf(value) + 1, ALL_TIMES.length - 1)];
      return { ...s, startTime: value, endTime };
    }));

  const setEnd = (i: number, value: string) =>
    setSlots(prev => prev.map((s, j) => (j === i ? { ...s, endTime: value } : s)));

  const addBlackoutDate = () => {
    if (!blackoutInput) { toast.error(t.providerAvailability.blackoutNeedsDate); return; }
    if (blackoutDates.includes(blackoutInput)) { toast.error(t.providerAvailability.blackoutDuplicate); return; }
    setBlackoutDates(p => [...p, blackoutInput].sort());
    setBlackoutInput('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/provider/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bufferMins,
          blackoutDates,
          availability: slots.filter(s => s.enabled).map(s => ({
            dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || t.providerAvailability.saveFailed);
        return;
      }
      // Ground truth is the server's response — re-hydrate form + snapshot
      // from what actually persisted, so a silently-dropped column (e.g.
      // bufferMins/blackoutDates missing in DB) doesn't falsely mark the
      // form clean.
      const persisted = await res.json().catch(() => null);
      if (persisted && typeof persisted === 'object') {
        const persistedSlots = Array.from({ length: DAY_COUNT }, (_, i) => {
          const existing = Array.isArray(persisted.availability)
            ? persisted.availability.find((s: any) => s.dayOfWeek === i)
            : null;
          return existing
            ? { dayOfWeek: i, startTime: existing.startTime, endTime: existing.endTime, enabled: true }
            : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', enabled: false };
        });
        const persistedBlackout = Array.isArray(persisted.blackoutDates) ? persisted.blackoutDates : [];
        const persistedBuffer = typeof persisted.bufferMins === 'number' ? persisted.bufferMins : 30;
        setSlots(persistedSlots);
        setBlackoutDates(persistedBlackout);
        setBufferMins(persistedBuffer);
        initialRef.current = JSON.stringify({
          slots: persistedSlots,
          blackoutDates: persistedBlackout,
          bufferMins: persistedBuffer,
        });
      } else {
        initialRef.current = getSnapshot();
      }
      setDirty(false);
      toast.success(t.providerAvailability.savedToast);
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
        title={t.providerAvailability.title}
        description={t.providerAvailability.description}
        size="sm"
        className="mb-5"
        action={
          <Button size="sm" loading={saving} disabled={!dirty} onClick={handleSave}>
            {t.providerAvailability.save}
          </Button>
        }
      />

      <div className="space-y-6">

        {/* ── Working hours ── */}
        <Section title={t.providerAvailability.sectionHours}>
          <div className="p-4 sm:p-5">
            <p className="text-xs text-ink-dim leading-relaxed mb-3">{t.providerAvailability.hoursHint}</p>
            <div className="space-y-1">
              {DISPLAY_ORDER.map(i => {
                const slot = slots[i];
                const dayName = dayNames[i];
                // An end time is only valid after the start; a persisted value
                // outside the option list is kept so the select never silently
                // shows a time the pro never chose.
                const startOptions = ALL_TIMES.slice(0, -1);
                if (!startOptions.includes(slot.startTime)) startOptions.unshift(slot.startTime);
                const endOptions = ALL_TIMES.filter(time => time > slot.startTime);
                if (!endOptions.includes(slot.endTime)) endOptions.unshift(slot.endTime);
                return (
                  <div
                    key={i}
                    className={cn(
                      'rounded-input px-3 py-2.5 transition-colors',
                      slot.enabled ? 'bg-surface-alt' : 'opacity-50',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        size="sm"
                        checked={slot.enabled}
                        onChange={() => toggleDay(i)}
                        label={dayName}
                      />
                      <span className="text-sm font-semibold text-ink">{dayName}</span>
                    </div>
                    {/* Height is reserved either way so toggling a day never
                        shifts the rows below it. */}
                    <div className="min-h-[38px] mt-2">
                      {slot.enabled && (
                        <div className="flex items-center gap-2">
                          <Select
                            wrapperClassName="flex-1 min-w-0"
                            aria-label={`${t.providerAvailability.startLabel} — ${dayName}`}
                            value={slot.startTime}
                            onChange={e => setStart(i, e.target.value)}
                            className="bg-card py-2 pl-3 pr-8 text-xs"
                          >
                            {startOptions.map(time => <option key={time} value={time}>{time}</option>)}
                          </Select>
                          <span className="text-xs text-ink-dim shrink-0">–</span>
                          <Select
                            wrapperClassName="flex-1 min-w-0"
                            aria-label={`${t.providerAvailability.endLabel} — ${dayName}`}
                            value={slot.endTime}
                            onChange={e => setEnd(i, e.target.value)}
                            className="bg-card py-2 pl-3 pr-8 text-xs"
                          >
                            {endOptions.map(time => <option key={time} value={time}>{time}</option>)}
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ── Break between jobs ── */}
        <Section title={t.providerAvailability.sectionBuffer}>
          <div className="p-4 sm:p-5">
            <p className="text-xs text-ink-dim leading-relaxed mb-3">{t.providerAvailability.bufferHint}</p>
            <div className="flex gap-1.5 flex-wrap">
              {BUFFER_OPTIONS.map(mins => {
                const sel = bufferMins === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    aria-pressed={sel}
                    onClick={() => setBufferMins(mins)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-chip border text-sm font-bold transition-colors',
                      sel
                        ? 'border-brand bg-brand-muted text-brand'
                        : 'border-border bg-card text-ink-sub hover:bg-surface-alt',
                    )}
                  >
                    {sel && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />}
                    {mins === 0 ? t.providerAvailability.bufferNone : `${mins}m`}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ── Days off ── */}
        <Section title={t.providerAvailability.sectionDaysOff}>
          <div className="p-4 sm:p-5">
            <p className="text-xs text-ink-dim leading-relaxed mb-3">{t.providerAvailability.blackoutHint}</p>
            <div className="flex items-end gap-2">
              <Input
                wrapperClassName="flex-1 min-w-0"
                label={t.providerAvailability.blackoutDateLabel}
                type="date"
                value={blackoutInput}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setBlackoutInput(e.target.value)}
              />
              <Button variant="secondary" className="py-3" onClick={addBlackoutDate}>
                {t.providerAvailability.blackoutAdd}
              </Button>
            </div>

            {blackoutDates.length === 0 ? (
              <p className="text-xs text-ink-dim mt-3">{t.providerAvailability.blackoutEmpty}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {blackoutDates.map(d => {
                  const label = new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                  return (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-surface-alt border border-border-dim text-ink-sub rounded-chip text-xs font-medium"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => setBlackoutDates(p => p.filter(x => x !== d))}
                        aria-label={`${t.providerAvailability.blackoutRemove}: ${label}`}
                        className="p-0.5 rounded-full text-ink-dim hover:text-danger transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
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
