'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  LifeBuoy, Upload, X, CheckCircle2, Loader2,
  Star, DollarSign, MessageSquare, ChevronRight,
  AlertTriangle, FileText,
} from 'lucide-react';

type TicketType = 'dispute_review' | 'refund_request' | 'general' | 'no_show' | 'payment';

const TICKET_TYPES: { id: TicketType; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'dispute_review',  label: 'Dispute a review',       desc: 'Believe a review is unfair or violates guidelines', icon: Star },
  { id: 'refund_request',  label: 'Request refund review',  desc: 'A booking was canceled or work was not completed',   icon: DollarSign },
  { id: 'no_show',         label: 'Customer no-show',       desc: 'Customer was not present for a scheduled job',       icon: AlertTriangle },
  { id: 'payment',         label: 'Payment issue',          desc: 'Incorrect payout amount or missing payment',         icon: DollarSign },
  { id: 'general',         label: 'General support',        desc: 'Any other question or issue',                        icon: MessageSquare },
];

export default function DisputesPage() {
  const [ticketType, setTicketType] = useState<TicketType | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [evidence, setEvidence] = useState<{ file: File; preview: string; name: string }[]>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleEvidenceSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingEvidence(true);
    for (const file of files) {
      const preview = URL.createObjectURL(file);
      setEvidence(prev => [...prev, { file, preview, name: file.name }]);
      try {
        const fd = new FormData();
        fd.append('file', file);
        await fetch('/api/uploads', { method: 'POST', body: fd });
      } catch {}
    }
    setUploadingEvidence(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!ticketType || !subject.trim() || !description.trim()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Ticket submitted</h1>
        <p className="text-ink-dim mb-2">Ticket ID: <span className="font-bold">VP-{Math.random().toString(36).slice(2, 10).toUpperCase()}</span></p>
        <p className="text-ink-dim mb-8 max-w-sm mx-auto leading-relaxed">
          Our support team will review your ticket and respond within <strong>24–48 business hours</strong> via email.
        </p>
        <Link href="/provider/dashboard" className="bg-brand text-white px-8 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
          <LifeBuoy className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Support & Disputes</h1>
          <p className="text-sm text-ink-dim">Get help or raise a formal dispute</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Ticket type */}
        <div className="bg-white rounded-3xl border border-border-dim p-6 shadow-sm">
          <p className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-4">What do you need help with?</p>
          <div className="space-y-2">
            {TICKET_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => { setTicketType(t.id); setSubject(t.label); }}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                  ticketType === t.id ? 'border-brand bg-brand text-white' : 'border-border hover:border-border'
                }`}
              >
                <t.icon className={`w-5 h-5 shrink-0 ${ticketType === t.id ? 'text-white' : 'text-ink-dim'}`} />
                <div>
                  <p className={`font-bold text-sm ${ticketType === t.id ? 'text-white' : 'text-ink'}`}>{t.label}</p>
                  <p className={`text-xs ${ticketType === t.id ? 'text-white/70' : 'text-ink-dim'}`}>{t.desc}</p>
                </div>
                <ChevronRight className={`w-4 h-4 ml-auto shrink-0 ${ticketType === t.id ? 'text-white/50' : 'text-ink-dim'}`} />
              </button>
            ))}
          </div>
        </div>

        {ticketType && (
          <>
            {/* Details */}
            <div className="bg-white rounded-3xl border border-border-dim p-6 shadow-sm space-y-4">
              <p className="font-bold flex items-center gap-2"><FileText className="w-4 h-4" /> Details</p>

              <div>
                <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-alt border border-border-dim rounded-xl focus:ring-2 focus:ring-brand outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">Booking reference <span className="normal-case font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={bookingRef}
                  onChange={e => setBookingRef(e.target.value)}
                  placeholder="Booking ID or date"
                  className="w-full px-4 py-3 bg-surface-alt border border-border-dim rounded-xl focus:ring-2 focus:ring-brand outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-ink-dim uppercase tracking-widest mb-2 block">Description *</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                  placeholder={
                    ticketType === 'dispute_review' ? 'Explain why this review should be reviewed. Include any relevant context or policy violations...' :
                    ticketType === 'refund_request' ? 'Describe the booking and why a refund should be considered...' :
                    ticketType === 'no_show' ? 'When was the booking? What happened when you arrived?...' :
                    'Describe your issue in detail...'
                  }
                  className="w-full p-4 bg-surface-alt border border-border-dim rounded-xl focus:ring-2 focus:ring-brand outline-none resize-none text-sm"
                />
                <p className="text-xs text-ink-dim mt-1">{description.length} characters</p>
              </div>
            </div>

            {/* Evidence upload */}
            <div className="bg-white rounded-3xl border border-border-dim p-6 shadow-sm">
              <p className="font-bold mb-4 flex items-center gap-2"><Upload className="w-4 h-4" /> Evidence <span className="text-xs text-ink-dim font-normal ml-1">(optional)</span></p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onChange={handleEvidenceSelect}
              />
              <div className="flex flex-wrap gap-3 mb-3">
                {evidence.map((f, i) => (
                  <div key={i} className="relative">
                    {f.file.type.startsWith('image/') ? (
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-border relative">
                        <img src={f.preview} alt={f.name} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setEvidence(prev => prev.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 w-5 h-5 bg-brand/60 rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-surface-alt rounded-xl border border-border">
                        <FileText className="w-4 h-4 text-ink-dim shrink-0" />
                        <span className="text-xs font-medium text-ink-sub max-w-[80px] truncate">{f.name}</span>
                        <button onClick={() => setEvidence(prev => prev.filter((_, j) => j !== i))} className="text-ink-dim hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingEvidence}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-brand transition-colors text-ink-dim hover:text-ink"
                >
                  {uploadingEvidence ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /><span className="text-[10px] font-bold">Upload</span></>}
                </button>
              </div>
              <p className="text-xs text-ink-dim">Photos, screenshots, or PDF documents. Max 10MB per file.</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!subject.trim() || !description.trim() || submitting}
              className="w-full bg-brand text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LifeBuoy className="w-4 h-4" /> Submit Support Ticket</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
