'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, Save, CheckCircle2, X,
  Calendar, Clock, CalendarOff,
} from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ALL_TIMES = [
  '06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00',
];

export default function ProviderAvailabilitySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const initialRef = useRef<string>('');
  const [dirty, setDirty] = useState(false);

  const [slots, setSlots] = useState<{ dayOfWeek: number; startTime: string; endTime: string; enabled: boolean }[]>(
    DAYS.map((_, i) => ({ dayOfWeek: i, startTime: '09:00', endTime: '17:00', enabled: i >= 1 && i <= 5 }))
  );
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [blackoutInput, setBlackoutInput] = useState('');
  const [bufferMins, setBufferMins] = useState(30);

  const getSnapshot = () => JSON.stringify({ slots, blackoutDates, bufferMins });

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      fetch('/api/provider/profile').then(r => r.json()).then(profile => {
        const p = profile ?? {};
        const loadedSlots = DAYS.map((_, i) => {
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
  }, [status, router]);

  useEffect(() => {
    if (!loading && initialRef.current) {
      setDirty(getSnapshot() !== initialRef.current);
    }
  }, [slots, blackoutDates, bufferMins, loading]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
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
          <h1 className="text-lg font-bold text-ink">Availability</h1>
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

        {/* Working hours */}
        <div>
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-0.5">Working hours</p>
          <div className="bg-white rounded-2xl border border-border-dim shadow-sm p-4 sm:p-6">
            <p className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-ink-dim" /> Weekly schedule
            </p>
            <div className="space-y-1.5">
              {slots.map((slot, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl transition-all ${slot.enabled ? 'bg-surface-alt' : 'bg-transparent'}`}
                >
                  <button
                    onClick={() => setSlots(prev => prev.map((s, j) => j === i ? { ...s, enabled: !s.enabled } : s))}
                    className={`w-8 h-5 rounded-full relative transition-colors shrink-0 ${slot.enabled ? 'bg-brand' : 'bg-border'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${slot.enabled ? 'left-3.5' : 'left-0.5'}`} />
                  </button>
                  <span className={`w-9 text-xs font-bold shrink-0 ${slot.enabled ? 'text-ink' : 'text-ink-dim'}`}>{DAYS[i]}</span>
                  {slot.enabled ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <select
                        value={slot.startTime}
                        onChange={e => setSlots(prev => prev.map((s, j) => j === i ? { ...s, startTime: e.target.value } : s))}
                        className="flex-1 min-w-0 px-2 py-1.5 bg-white border border-border rounded-lg text-xs outline-none"
                      >
                        {ALL_TIMES.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span className="text-ink-dim text-xs">–</span>
                      <select
                        value={slot.endTime}
                        onChange={e => setSlots(prev => prev.map((s, j) => j === i ? { ...s, endTime: e.target.value } : s))}
                        className="flex-1 min-w-0 px-2 py-1.5 bg-white border border-border rounded-lg text-xs outline-none"
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
        </div>

        {/* Break between jobs */}
        <div>
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-0.5">Break between jobs</p>
          <div className="bg-white rounded-2xl border border-border-dim shadow-sm p-4 sm:p-6">
            <p className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-ink-dim" /> Buffer time
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {[0, 15, 30, 45, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => setBufferMins(mins)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    bufferMins === mins
                      ? 'bg-brand text-white shadow-sm'
                      : 'bg-surface-alt text-ink-sub border border-border-dim hover:border-border'
                  }`}
                >
                  {mins === 0 ? 'None' : `${mins}m`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Days off */}
        <div>
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 px-0.5">Days off</p>
          <div className="bg-white rounded-2xl border border-border-dim shadow-sm p-4 sm:p-6">
            <p className="font-semibold text-sm mb-3 flex items-center gap-2">
              <CalendarOff className="w-4 h-4 text-ink-dim" /> Blackout dates
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="date"
                value={blackoutInput}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setBlackoutInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-surface-alt border border-border-dim rounded-xl focus:ring-2 focus:ring-brand outline-none text-[16px] sm:text-sm"
              />
              <button
                onClick={() => {
                  if (blackoutInput && !blackoutDates.includes(blackoutInput)) {
                    setBlackoutDates(p => [...p, blackoutInput].sort());
                    setBlackoutInput('');
                  }
                }}
                className="px-4 py-2.5 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition-colors"
              >
                Add
              </button>
            </div>
            {blackoutDates.length === 0 ? (
              <p className="text-xs text-ink-dim">No blackout dates. Add dates when you're unavailable.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {blackoutDates.map(d => (
                  <span
                    key={d}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-caution-surface border border-caution-edge text-caution rounded-full text-xs font-medium"
                  >
                    {new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    <button onClick={() => setBlackoutDates(p => p.filter(x => x !== d))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
