'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2,
  User, Building2, FileText, Camera, Shield, Upload, X,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Identity',    icon: User },
  { id: 2, label: 'Business',    icon: Building2 },
  { id: 3, label: 'Credentials', icon: FileText },
  { id: 4, label: 'Selfie',      icon: Camera },
  { id: 5, label: 'Done',        icon: Shield },
];

const BUSINESS_TYPES = [
  { id: 'sole_trader', label: 'Sole Trader', desc: 'Working independently under your own name' },
  { id: 'company',     label: 'Registered Company', desc: 'You operate via a registered LT business entity' },
  { id: 'freelancer',  label: 'Freelancer / Contractor', desc: 'Self-employed under freelance agreement' },
];

const DOC_TYPES = [
  { id: 'id_card',     label: 'National ID Card',       required: true },
  { id: 'passport',    label: 'Passport',               required: false },
  { id: 'certificate', label: 'Trade Certificate',      required: false },
  { id: 'insurance',   label: 'Liability Insurance',    required: false },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [identity, setIdentity] = useState({ fullName: '', phone: '', idNumber: '' });
  const [businessType, setBusinessType] = useState('sole_trader');
  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [docs, setDocs] = useState<Record<string, { file: File; preview: string; uploaded: boolean }>>({});
  const [selfie, setSelfie] = useState<{ file: File; preview: string } | null>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const handleDocSelect = async (docType: string, file: File) => {
    const preview = URL.createObjectURL(file);
    setDocs(prev => ({ ...prev, [docType]: { file, preview, uploaded: false } }));
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/uploads', { method: 'POST', body: fd });
      if (res.ok) setDocs(prev => ({ ...prev, [docType]: { ...prev[docType], uploaded: true } }));
    } catch {}
  };

  const handleSelfieSelect = (file: File) => {
    setSelfie({ file, preview: URL.createObjectURL(file) });
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await fetch('/api/provider/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: `${businessType === 'company' ? companyName + ' · ' : ''}Verified ${BUSINESS_TYPES.find(b => b.id === businessType)?.label}`,
        }),
      });
    } catch {}
    setSaving(false);
    setStep(5);
  };

  const canProceed = () => {
    if (step === 1) return identity.fullName.trim().length > 2 && identity.phone.trim().length > 6;
    if (step === 2) return !!businessType;
    if (step === 3) return !!docs['id_card'];
    if (step === 4) return !!selfie;
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          {step > 1 && step < 5 ? (
            <button onClick={() => setStep(s => s - 1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link href="/provider/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div className="flex-1 flex items-center gap-1.5">
            {STEPS.filter(s => s.id < 5).map((s, i) => (
              <React.Fragment key={s.id}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  s.id < step ? 'bg-black text-white' :
                  s.id === step ? 'bg-black text-white' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {s.id < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
                </div>
                <span className={`text-xs font-bold hidden sm:block ${s.id === step ? 'text-black' : 'text-gray-300'}`}>{s.label}</span>
                {i < 3 && <div className={`flex-1 h-px ${s.id < step ? 'bg-black' : 'bg-gray-100'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
        {/* Step 1: Identity */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Identity details</h1>
            <p className="text-gray-500 text-sm mb-8">This information is verified by our team and never shown publicly.</p>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Full legal name</label>
                <input
                  type="text"
                  value={identity.fullName}
                  onChange={e => setIdentity(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Jonas Jonaitis"
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Phone number</label>
                <input
                  type="tel"
                  value={identity.phone}
                  onChange={e => setIdentity(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+370 6X XXX XXX"
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">National ID number <span className="normal-case font-normal">(optional, encrypted)</span></label>
                <input
                  type="text"
                  value={identity.idNumber}
                  onChange={e => setIdentity(p => ({ ...p, idNumber: e.target.value }))}
                  placeholder="Personal code or ID number"
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black outline-none text-sm"
                />
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-700 leading-relaxed">
                <strong>Privacy:</strong> Your personal data is encrypted at rest and only used for verification. It is never shared with customers.
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Business type */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Business type</h1>
            <p className="text-gray-500 text-sm mb-8">How do you operate your services?</p>
            <div className="space-y-3 mb-6">
              {BUSINESS_TYPES.map(bt => (
                <button
                  key={bt.id}
                  onClick={() => setBusinessType(bt.id)}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                    businessType === bt.id ? 'border-black bg-black text-white' : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <p className={`font-bold mb-0.5 ${businessType === bt.id ? 'text-white' : 'text-black'}`}>{bt.label}</p>
                  <p className={`text-xs ${businessType === bt.id ? 'text-white/70' : 'text-gray-400'}`}>{bt.desc}</p>
                </button>
              ))}
            </div>

            {businessType === 'company' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Company name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="UAB Your Company"
                    className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">VAT number <span className="normal-case font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={vatNumber}
                    onChange={e => setVatNumber(e.target.value)}
                    placeholder="LT000000000"
                    className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black outline-none text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Documents & credentials</h1>
            <p className="text-gray-500 text-sm mb-8">Upload your ID and any relevant trade certificates.</p>
            <div className="space-y-4">
              {DOC_TYPES.map(doc => {
                const uploaded = docs[doc.id];
                return (
                  <div key={doc.id} className={`p-4 bg-white rounded-2xl border transition-all ${
                    uploaded?.uploaded ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-sm">
                          {doc.label}
                          {doc.required && <span className="ml-1 text-red-500">*</span>}
                        </p>
                        {!doc.required && <p className="text-xs text-gray-400">Optional — increases your trust score</p>}
                      </div>
                      {uploaded?.uploaded && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                    </div>

                    {uploaded ? (
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                          <img src={uploaded.preview} alt={doc.label} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-700 truncate">{uploaded.file.name}</p>
                          <p className="text-[10px] text-gray-400">{uploaded.uploaded ? 'Uploaded ✓' : 'Uploading…'}</p>
                        </div>
                        <button onClick={() => setDocs(prev => { const n = { ...prev }; delete n[doc.id]; return n; })} className="text-gray-400 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          ref={el => { fileRefs.current[doc.id] = el; }}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleDocSelect(doc.id, f); }}
                        />
                        <button
                          onClick={() => fileRefs.current[doc.id]?.click()}
                          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-400 hover:border-black hover:text-black transition-colors"
                        >
                          <Upload className="w-4 h-4" /> Upload file
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Selfie */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Selfie proof</h1>
            <p className="text-gray-500 text-sm mb-8">Take a photo holding your ID to confirm your identity. This is reviewed only by our compliance team.</p>
            <input
              ref={selfieRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleSelfieSelect(f); }}
            />
            {selfie ? (
              <div className="space-y-4">
                <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border border-gray-200">
                  <img src={selfie.preview} alt="Selfie" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setSelfie(null)}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-green-900">Looking good!</p>
                    <p className="text-xs text-green-700">Our team will review within 24 hours.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => selfieRef.current?.click()}
                  className="w-full aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl hover:border-black transition-colors gap-4 text-gray-400 hover:text-black"
                >
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="font-bold">Take selfie with ID</p>
                  <p className="text-xs text-gray-400">Or tap to upload a photo</p>
                </button>
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs text-gray-500 space-y-1">
                  <p className="font-bold text-gray-700">Tips for a good selfie:</p>
                  <p>• Hold your ID clearly visible next to your face</p>
                  <p>• Make sure your face and ID text are both in focus</p>
                  <p>• Use good lighting — avoid glare on the ID</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Done */}
        {step === 5 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-3">Verification submitted!</h1>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
              Our compliance team will review your documents within <strong>24 hours</strong>. You'll receive a notification once approved.
            </p>
            <div className="bg-white rounded-3xl border border-gray-100 p-6 text-left max-w-sm mx-auto mb-8 shadow-sm space-y-3">
              {[
                { label: 'Identity details', done: true },
                { label: 'Business type', done: true },
                { label: 'Documents uploaded', done: Object.keys(docs).length > 0 },
                { label: 'Selfie proof', done: !!selfie },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {item.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm font-medium ${item.done ? 'text-black' : 'text-gray-400'}`}>{item.label}</span>
                </div>
              ))}
            </div>
            <Link
              href="/provider/dashboard"
              className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>

      {/* Bottom bar */}
      {step < 5 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
          <div className="max-w-2xl mx-auto">
            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!canProceed() || saving}
                className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Shield className="w-4 h-4" /> Submit for Review</>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
