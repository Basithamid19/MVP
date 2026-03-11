'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  FileText, 
  Euro, 
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

function NewRequestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const providerId = searchParams.get('providerId');
  const initialCategory = searchParams.get('category') || '';

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    address: '',
    description: '',
    dateWindow: '',
    budget: '',
    isUrgent: false,
  });

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch('/api/providers'); // Reusing this for now or could have a dedicated cat API
      // For MVP, let's just hardcode or fetch from a simple list
      setCategories([
        { id: 'clplumber', name: 'Plumber', slug: 'plumber' },
        { id: 'clelectrician', name: 'Electrician', slug: 'electrician' },
        { id: 'clhandyman', name: 'Handyman', slug: 'handyman' },
        { id: 'clcleaning', name: 'Cleaning', slug: 'cleaning' },
      ]);
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // In a real app, we'd find the actual category ID
          categoryId: categories.find(c => c.slug === initialCategory)?.id || categories[0].id
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch (error) {
      console.error('Failed to create request', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Request Sent!</h1>
        <p className="text-gray-500 mb-8">Professionals will review your request and send quotes shortly.</p>
        <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold">New Service Request</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
            {/* Category */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 block">What do you need help with?</label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, categoryId: cat.id })}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      initialCategory === cat.slug ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-bold text-sm">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 block">Where in Vilnius?</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  required
                  placeholder="Street name, house number, apartment"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 block">Describe the job</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <textarea 
                  required
                  rows={4}
                  placeholder="Be as specific as possible. What's the problem? What needs to be done?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Date & Budget */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 block">Preferred Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input 
                    type="date" 
                    required
                    value={formData.dateWindow}
                    onChange={(e) => setFormData({ ...formData, dateWindow: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 block">Estimated Budget (Optional)</label>
                <div className="relative">
                  <Euro className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <input 
                    type="number" 
                    placeholder="e.g. 50"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Urgent Toggle */}
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="font-bold text-sm text-orange-900">Is this urgent?</div>
                  <div className="text-xs text-orange-700">Pros will be notified to respond immediately.</div>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, isUrgent: !formData.isUrgent })}
                className={`w-12 h-7 rounded-full transition-colors relative ${formData.isUrgent ? 'bg-orange-500' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${formData.isUrgent ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white py-5 rounded-[32px] font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Post Request'}
          </button>
        </form>
      </main>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500 font-medium">Loading...</p>
      </div>
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
