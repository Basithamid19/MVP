'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2,
  User, Building2, FileText, Camera, Shield, Upload, X,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslation();

  // Built inside the component so labels follow the active locale.
  const STEPS = [
    { id: 1, label: t.onboarding.stepIdentity,    icon: User },
    { id: 2, label: t.onboarding.stepBusiness,    icon: Building2 },
    { id: 3, label: t.onboarding.stepCredentials, icon: FileText },
    { id: 4, label: t.onboarding.stepSelfie,      icon: Camera },
    { id: 5, label: t.onboarding.stepDone,        icon: Shield },
  ];

  const BUSINESS_TYPES = [
    { id: 'sole_trader', label: t.onboarding.btSoleTrader, desc: t.onboarding.btSoleTraderDesc },
    { id: 'company',     label: t.onboarding.btCompany, desc: t.onboarding.btCompanyDesc },
    { id: 'freelancer',  label: t.onboarding.btFreelancer, desc: t.onboarding.btFreelancerDesc },
  ];

  const DOC_TYPES = [
    { id: 'id_card',     label: t.onboarding.docIdCard,      required: true },
    { id: 'passport',    label: t.onboarding.docPassport,    required: false },
    { id: 'certificate', label: t.onboarding.docCertificate, required: false },
    { id: 'insurance',   label: t.onboarding.docInsurance,   required: false },
  ];

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [identity, setIdentity] = useState({ fullName: '', phone: '', idNumber: '' });
  const [businessType, setBusinessType] = useState('sole_trader');
  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [docs, setDocs] = useState<Record<string, { file: File; preview: string; uploaded: boolean; url: string }>>({});
  const [selfie, setSelfie] = useState<{ file: File; preview: string } | null>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const handleDocSelect = async (docType: string, file: File) => {
    const preview = URL.createObjectURL(file);
    setDocs(prev => ({ ...prev, [docType]: { file, preview, uploaded: false, url: '' } }));
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/uploads', { method: 'POST', body: fd });
      if (res.ok) {
        const data = await res.json();
        setDocs(prev => ({ ...prev, [docType]: { ...prev[docType], uploaded: true, url: data.url } }));
      }
    } catch {}
  };

  const handleSelfieSelect = (file: File) => {
    setSelfie({ file, preview: URL.createObjectURL(file) });
  };

  const [finishError, setFinishError] = useState<string | null>(null);

  const handleFinish = async () => {
    setSaving(true);
    setFinishError(null);
    try {
      // Upload selfie first
      let selfieUrl = '';
      if (selfie) {
        const fd = new FormData();
        fd.append('file', selfie.file);
        const res = await fetch('/api/uploads', { method: 'POST', body: fd });
        if (res.ok) {
          const data = await res.json();
          selfieUrl = data.url;
        }
      }

      // Build document list for verification records
      const docTypeMap: Record<string, string> = {
        id_card: 'ID', passport: 'ID', certificate: 'CERTIFICATE', insurance: 'INSURANCE',
      };
      const documents = Object.entries(docs)
        .filter(([, d]) => d.uploaded && d.url)
        .map(([key, d]) => ({ docType: docTypeMap[key] || 'ID', docUrl: d.url }));

      if (selfieUrl) {
        documents.push({ docType: 'SELFIE', docUrl: selfieUrl });
      }

      // Nothing actually finished uploading → don't fake a success screen.
      if (documents.length === 0) {
        setFinishError(t.onboarding.errNoDocs);
        return;
      }

      // Submit verification documents to DB — only advance on success.
      const res = await fetch('/api/provider/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents,
          identity: { fullName: identity.fullName, phone: identity.phone, companyName, vatNumber },
          businessType,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({} as any));
        setFinishError(d.error ?? t.onboarding.errSubmitFailed);
        return;
      }
      setStep(5);
    } catch {
      setFinishError(t.common.networkError);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return identity.fullName.trim().length > 2 && identity.phone.trim().length > 6;
    if (step === 2) return !!businessType;
    // Require the ID document to have finished uploading, not just be selected.
    if (step === 3) return !!docs['id_card']?.uploaded && !!docs['id_card']?.url;
    if (step === 4) return !!selfie;
    return true;
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="bg-white border-b border-border-dim sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          {step > 1 && step < 5 ? (
            <button onClick={() => setStep(s => s - 1)} className="p-2 hover:bg-surface-alt rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link href="/provider/dashboard" className="p-2 hover:bg-surface-alt rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div className="flex-1 flex items-center gap-1.5">
            {STEPS.filter(s => s.id < 5).map((s, i) => (
              <React.Fragment key={s.id}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold transition-all ${
                  s.id < step ? 'bg-brand text-white' :
                  s.id === step ? 'bg-brand text-white' :
                  'bg-surface-alt text-ink-dim'
                }`}>
                  {s.id < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
                </div>
                <span className={`text-xs font-bold hidden sm:block ${s.id === step ? 'text-ink' : 'text-ink-dim'}`}>{s.label}</span>
                {i < 3 && <div className={`flex-1 h-px ${s.id < step ? 'bg-brand' : 'bg-surface-alt'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
        {/* Step 1: Identity */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">{t.onboarding.identityTitle}</h1>
            <p className="text-ink-dim text-sm mb-8">{t.onboarding.identitySubtitle}</p>
            <div className="space-y-5">
              <div>
                <label className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-2 block">{t.onboarding.fullLegalName}</label>
                <input
                  type="text"
                  value={identity.fullName}
                  onChange={e => setIdentity(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Jonas Jonaitis"
                  className="w-full px-4 py-4 bg-white border border-border rounded-card focus:ring-2 focus:ring-brand outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-2 block">{t.onboarding.phoneNumber}</label>
                <input
                  type="tel"
                  value={identity.phone}
                  onChange={e => setIdentity(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+370 6X XXX XXX"
                  className="w-full px-4 py-4 bg-white border border-border rounded-card focus:ring-2 focus:ring-brand outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-2 block">{t.onboarding.nationalIdLabel} <span className="normal-case font-normal">{t.onboarding.optionalEncrypted}</span></label>
                <input
                  type="text"
                  value={identity.idNumber}
                  onChange={e => setIdentity(p => ({ ...p, idNumber: e.target.value }))}
                  placeholder={t.onboarding.idPlaceholder}
                  className="w-full px-4 py-4 bg-white border border-border rounded-card focus:ring-2 focus:ring-brand outline-none text-sm"
                />
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-card text-xs text-info leading-relaxed">
                <strong>{t.onboarding.privacyBold}</strong> {t.onboarding.privacyNote}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Business type */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">{t.onboarding.businessTitle}</h1>
            <p className="text-ink-dim text-sm mb-8">{t.onboarding.businessSubtitle}</p>
            <div className="space-y-3 mb-6">
              {BUSINESS_TYPES.map(bt => (
                <button
                  key={bt.id}
                  onClick={() => setBusinessType(bt.id)}
                  className={`w-full text-left p-5 rounded-card border-2 transition-all ${
                    businessType === bt.id ? 'border-brand bg-brand text-white' : 'border-border bg-white hover:border-border'
                  }`}
                >
                  <p className={`font-bold mb-0.5 ${businessType === bt.id ? 'text-white' : 'text-ink'}`}>{bt.label}</p>
                  <p className={`text-xs ${businessType === bt.id ? 'text-white/70' : 'text-ink-dim'}`}>{bt.desc}</p>
                </button>
              ))}
            </div>

            {businessType === 'company' && (
              <div className="space-y-4">
                <div>
                  <label className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-2 block">{t.onboarding.companyName}</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder={t.onboarding.companyPlaceholder}
                    className="w-full px-4 py-4 bg-white border border-border rounded-card focus:ring-2 focus:ring-brand outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-3xs font-bold text-ink-dim uppercase tracking-widest mb-2 block">{t.onboarding.vatNumber} <span className="normal-case font-normal">{t.wizard.optional}</span></label>
                  <input
                    type="text"
                    value={vatNumber}
                    onChange={e => setVatNumber(e.target.value)}
                    placeholder="LT000000000"
                    className="w-full px-4 py-4 bg-white border border-border rounded-card focus:ring-2 focus:ring-brand outline-none text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">{t.onboarding.docsTitle}</h1>
            <p className="text-ink-dim text-sm mb-8">{t.onboarding.docsSubtitle}</p>
            <div className="space-y-4">
              {DOC_TYPES.map(doc => {
                const uploaded = docs[doc.id];
                return (
                  <div key={doc.id} className={`p-4 bg-white rounded-card border transition-all ${
                    uploaded?.uploaded ? 'border-green-200 bg-green-50' : 'border-border'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-sm">
                          {doc.label}
                          {doc.required && <span className="ml-1 text-red-500">*</span>}
                        </p>
                        {!doc.required && <p className="text-xs text-ink-dim">{t.onboarding.optionalTrust}</p>}
                      </div>
                      {uploaded?.uploaded && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                    </div>

                    {uploaded ? (
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded-input overflow-hidden border border-border shrink-0">
                          <img src={uploaded.preview} alt={doc.label} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-ink-sub truncate">{uploaded.file.name}</p>
                          <p className="text-3xs text-ink-dim">{uploaded.uploaded ? t.onboarding.uploadedCheck : t.onboarding.uploading}</p>
                        </div>
                        <button onClick={() => setDocs(prev => { const n = { ...prev }; delete n[doc.id]; return n; })} className="text-ink-dim hover:text-red-500 transition-colors">
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
                          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-input text-sm font-bold text-ink-dim hover:border-brand hover:text-ink transition-colors"
                        >
                          <Upload className="w-4 h-4" /> {t.onboarding.uploadFile}
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
            <h1 className="text-2xl font-bold tracking-tight mb-1">{t.onboarding.selfieTitle}</h1>
            <p className="text-ink-dim text-sm mb-8">{t.onboarding.selfieSubtitle}</p>
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
                <div className="relative w-full aspect-[4/3] rounded-panel overflow-hidden border border-border">
                  <img src={selfie.preview} alt="Selfie" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setSelfie(null)}
                    className="absolute top-3 right-3 w-8 h-8 bg-brand/60 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="p-4 bg-green-50 border border-green-100 rounded-card flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-bold text-sm text-green-900">{t.onboarding.lookingGood}</p>
                    <p className="text-xs text-trust">{t.onboarding.reviewIn24h}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => selfieRef.current?.click()}
                  className="w-full aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-panel hover:border-brand transition-colors gap-4 text-ink-dim hover:text-ink"
                >
                  <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center">
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="font-bold">{t.onboarding.takeSelfie}</p>
                  <p className="text-xs text-ink-dim">{t.onboarding.orTapUpload}</p>
                </button>
                <div className="p-4 bg-surface-alt border border-border-dim rounded-card text-xs text-ink-dim space-y-1">
                  <p className="font-bold text-ink-sub">{t.onboarding.tipsTitle}</p>
                  <p>• {t.onboarding.tip1}</p>
                  <p>• {t.onboarding.tip2}</p>
                  <p>• {t.onboarding.tip3}</p>
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
            <h1 className="text-3xl font-bold tracking-tight mb-3">{t.onboarding.doneTitle}</h1>
            <p className="text-ink-dim mb-8 max-w-sm mx-auto leading-relaxed">
              {t.onboarding.doneDescPrefix} <strong>{t.onboarding.done24h}</strong>{t.onboarding.doneDescSuffix}
            </p>
            <div className="bg-white rounded-panel border border-border-dim p-6 text-left max-w-sm mx-auto mb-8 shadow-card space-y-3">
              {[
                { label: t.onboarding.identityTitle, done: true },
                { label: t.onboarding.businessTitle, done: true },
                { label: t.onboarding.reviewDocsUploaded, done: Object.keys(docs).length > 0 },
                { label: t.onboarding.selfieTitle, done: !!selfie },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-green-500' : 'bg-border'}`}>
                    {item.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm font-medium ${item.done ? 'text-ink' : 'text-ink-dim'}`}>{item.label}</span>
                </div>
              ))}
            </div>
            <Link
              href="/provider/dashboard"
              className="inline-flex items-center gap-2 bg-brand text-white px-8 py-4 rounded-card font-bold hover:bg-brand-dark transition-all"
            >
              {t.onboarding.goToDashboard} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>

      {/* Bottom bar */}
      {step < 5 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-dim p-4">
          <div className="max-w-2xl mx-auto">
            {finishError && step === 4 && (
              <div className="px-4 py-3 mb-3 bg-caution-surface border border-caution-edge rounded-2xl text-sm font-medium text-caution leading-relaxed">
                {finishError}
              </div>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="w-full bg-brand text-white py-4 rounded-card font-bold hover:bg-brand-dark transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {t.wizard.continueBtn} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!canProceed() || saving}
                className="w-full bg-brand text-white py-4 rounded-card font-bold hover:bg-brand-dark transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Shield className="w-4 h-4" /> {t.onboarding.submitForReview}</>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
