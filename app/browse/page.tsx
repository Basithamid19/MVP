'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '@/components/CustomerLayout';
import {
  Star,
  ShieldCheck,
  MapPin,
  Filter,
  Search as SearchIcon,
  Loader2,
  Clock
} from 'lucide-react';

function BrowseContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (verifiedOnly) params.append('verified', 'true');

        const res = await fetch(`/api/providers?${params.toString()}`);
        const data = await res.json();
        setProviders(data);
      } catch (error) {
        console.error('Failed to fetch providers', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [category, verifiedOnly]);

  return (
    <CustomerLayout maxWidth="max-w-6xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            {category ? `${category.charAt(0).toUpperCase() + category.slice(1)}s` : 'All Professionals'} in Vilnius
          </h1>
          <p className="text-ink-sub mt-2">Find and book trusted local experts.</p>
        </div>
        <div className="text-sm text-ink-sub font-medium bg-white px-4 py-2 rounded-full border border-border-dim shadow-sm">
          {providers.length} result{providers.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white p-5 rounded-panel border border-border-dim sticky top-24 shadow-sm">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border-dim">
              <Filter className="w-4 h-4 text-ink-dim" />
              <h2 className="font-bold text-ink">Filters</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-ink-dim mb-2 block">Category</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 bg-surface-alt border border-border-dim rounded-input text-sm font-medium focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all appearance-none pr-10"
                  >
                    <option value="">All Categories</option>
                    <option value="plumber">Plumber</option>
                    <option value="electrician">Electrician</option>
                    <option value="handyman">Handyman</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="furniture-assembly">Furniture Assembly</option>
                    <option value="moving-help">Moving Help</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-ink-dim">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-ink">Verified Only</span>
                <button
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={`w-11 h-6 rounded-full transition-colors relative shadow-inner ${verifiedOnly ? 'bg-brand' : 'bg-border'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${verifiedOnly ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Provider List */}
        <div className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-ink-dim mb-4" />
              <p className="text-ink-dim font-medium">Finding the best pros...</p>
            </div>
          ) : providers.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {providers.map((p) => (
                <Link
                  key={p.id}
                  href={`/providers/${p.id}`}
                  className="group bg-white rounded-panel border border-border-dim shadow-sm hover:border-brand/30 hover:shadow-md transition-all flex flex-col overflow-hidden"
                >
                  <div className="p-6 flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-surface-alt rounded-2xl overflow-hidden shrink-0 border border-border-dim">
                        <img src={p.user.image || `https://i.pravatar.cc/150?u=${p.id}`} alt={p.user.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-ink truncate group-hover:text-brand transition-colors">{p.user.name}</h3>
                          {p.isVerified && (
                            <ShieldCheck className="w-4 h-4 text-trust shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-1 font-bold text-ink">
                            <Star className="w-4 h-4 text-brand fill-current" />
                            {p.ratingAvg.toFixed(1)}
                          </div>
                          <span className="text-ink-dim text-xs">({p.completedJobs} jobs)</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-ink-sub text-sm line-clamp-2 leading-relaxed">
                      {p.bio}
                    </p>
                  </div>

                  <div className="px-6 py-4 bg-surface-alt border-t border-border-dim flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-ink-sub truncate">
                      <MapPin className="w-3.5 h-3.5 text-ink-dim shrink-0" />
                      <span className="truncate">{p.serviceArea}</span>
                    </div>
                    {p.responseTime && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-trust bg-trust-surface px-2.5 py-1 rounded-full shrink-0 border border-trust-edge">
                        <Clock className="w-3 h-3" />
                        {p.responseTime}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-panel border border-dashed border-border text-center">
              <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-6">
                <SearchIcon className="w-8 h-8 text-ink-dim" />
              </div>
              <h3 className="text-xl font-bold mb-2">No pros found</h3>
              <p className="text-ink-sub mb-8">Try adjusting your filters to find more professionals.</p>
              <button
                onClick={() => { setCategory(''); setVerifiedOnly(false); }}
                className="bg-brand text-white px-6 py-3 rounded-card font-bold hover:bg-brand-dark transition-all"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim mb-4" />
        <p className="text-ink-sub font-medium">Loading...</p>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BrowseContent />
    </Suspense>
  );
}
