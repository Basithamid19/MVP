'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, X, Send, Loader2, CheckCircle2,
  DollarSign, Clock, AlertCircle, FileText, Calendar,
} from 'lucide-react';

export default function QuoteBuilderPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [basePrice, setBasePrice] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [lineItems, setLineItems] = useState<{name: string; amount: string}[]>([]);
  const [materialsNote, setMaterialsNote] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [notes, setNotes] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('3');

  useEffect(() => {
    fetch(`/api/requests?id=${requestId}`)
      .then(r => r.json())
      .then(d => { setRequest(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [requestId]);

  const totalPrice = () => {
    const base = parseFloat(basePrice) || 0;
    const extras = lineItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    return base + extras;
  };

  const handleSubmit = async () => {
    if (!basePrice || parseFloat(basePrice) <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          price: totalPrice(),
          estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
          notes: [
            notes,
            materialsNote ? `Materials: ${materialsNote}` : '',
            exclusions ? `Exclusions: ${exclusions}` : '',
            lineItems.length ? `Line items: ${lineItems.map(i => `${i.name} (€${i.amount})`).join(', ')}` : '',
          ].filter(Boolean).join('\n\n') || null,
        }),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-ink-dim" /></div>;

  if (submitted) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Quote sent!</h1>
        <p className="text-ink-dim mb-8">Your quote of <strong>€{totalPrice().toFixed(2)}</strong> has been sent to the customer. You'll be notified if they accept.</p>
        <Link href="/provider/leads" className="bg-brand text-white px-8 py-3 rounded-card font-bold hover:bg-gray-800 transition-all">
          Back to Leads
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/provider/leads" className="p-2 hover:bg-surface-alt rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Quote Builder</h1>
          <p className="text-sm text-ink-dim">{request?.category?.name}</p>
        </div>
      </div>

      {/* Request summary */}
      {request && (
        <div className="bg-surface-alt border border-border-dim rounded-card p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            {request.isUrgent && (
              <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" /> Urgent
              </span>
            )}
            <span className="text-xs bg-border text-ink-sub px-2 py-0.5 rounded-full font-bold">{request.category?.name}</span>
          </div>
          <p className="text-sm text-ink-sub leading-relaxed mb-2">{request.description}</p>
          <div className="flex flex-wrap gap-3 text-xs text-ink-dim">
            <span>{request.address}</span>
            <span>·</span>
            <span>{new Date(request.dateWindow).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            {request.budget && <><span>·</span><span className="text-green-600 font-bold">Budget: €{request.budget}</span></>}
          </div>
        </div>
      )}

      <div className="space-y-5">
        {/* Base price */}
        <div className="bg-white rounded-panel border border-border-dim p-6 shadow-card">
          <p className="font-bold mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Pricing</p>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">Base price *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-dim font-bold">€</span>
                <input
                  type="number"
                  value={basePrice}
                  onChange={e => setBasePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-3 bg-surface-alt border border-border-dim rounded-input focus:ring-2 focus:ring-brand outline-none text-sm font-bold"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block flex items-center gap-1">
                <Clock className="w-3 h-3" /> Estimated hours
              </label>
              <input
                type="number"
                value={estimatedHours}
                onChange={e => setEstimatedHours(e.target.value)}
                placeholder="e.g. 2.5"
                className="w-full px-4 py-3 bg-surface-alt border border-border-dim rounded-input focus:ring-2 focus:ring-brand outline-none text-sm"
              />
            </div>
          </div>

          {/* Line items */}
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2">Optional line items</p>
          <div className="space-y-2 mb-3">
            {lineItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={e => setLineItems(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                  placeholder="Item description"
                  className="flex-1 px-3 py-2 bg-surface-alt border border-border-dim rounded-input text-sm outline-none focus:ring-2 focus:ring-brand"
                />
                <div className="relative w-28 shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim text-sm">€</span>
                  <input
                    type="number"
                    value={item.amount}
                    onChange={e => setLineItems(prev => prev.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 bg-surface-alt border border-border-dim rounded-input text-sm outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <button onClick={() => setLineItems(p => p.filter((_, j) => j !== i))} className="text-ink-dim hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setLineItems(p => [...p, { name: '', amount: '' }])}
            className="flex items-center gap-1.5 text-sm font-bold text-ink-dim hover:text-ink transition-colors"
          >
            <Plus className="w-4 h-4" /> Add line item
          </button>

          {/* Total */}
          {(basePrice || lineItems.length > 0) && (
            <div className="mt-4 pt-4 border-t border-border-dim flex justify-between items-center">
              <span className="font-bold text-ink-dim">Total quote</span>
              <span className="text-2xl font-bold">€{totalPrice().toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-panel border border-border-dim p-6 shadow-card space-y-4">
          <p className="font-bold flex items-center gap-2"><FileText className="w-4 h-4" /> Notes & Terms</p>
          <div>
            <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">Message to customer</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Introduce yourself, mention your approach, ask any clarifying questions..."
              className="w-full p-3 bg-surface-alt border border-border-dim rounded-input focus:ring-2 focus:ring-brand outline-none resize-none text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">Materials note</label>
            <input
              type="text"
              value={materialsNote}
              onChange={e => setMaterialsNote(e.target.value)}
              placeholder="e.g. Basic materials included. Specialist parts extra."
              className="w-full px-4 py-3 bg-surface-alt border border-border-dim rounded-input focus:ring-2 focus:ring-brand outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">Exclusions</label>
            <input
              type="text"
              value={exclusions}
              onChange={e => setExclusions(e.target.value)}
              placeholder="e.g. Does not include wall patching after pipe work."
              className="w-full px-4 py-3 bg-surface-alt border border-border-dim rounded-input focus:ring-2 focus:ring-brand outline-none text-sm"
            />
          </div>
        </div>

        {/* Expiry */}
        <div className="bg-white rounded-panel border border-border-dim p-6 shadow-card">
          <p className="font-bold mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> Quote expiry</p>
          <div className="flex gap-2">
            {['1', '2', '3', '7'].map(d => (
              <button key={d} onClick={() => setExpiresInDays(d)}
                className={`flex-1 py-2.5 rounded-input border-2 text-sm font-bold transition-all ${expiresInDays === d ? 'border-brand bg-brand text-white' : 'border-border hover:border-border'}`}>
                {d}d
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-dim mt-2">
            Expires: {new Date(Date.now() + parseInt(expiresInDays) * 86400000).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!basePrice || parseFloat(basePrice) <= 0 || submitting}
          className="w-full bg-brand text-white py-4 rounded-card font-bold hover:bg-gray-800 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send Quote · €{totalPrice().toFixed(2)}</>}
        </button>
      </div>
    </div>
  );
}
