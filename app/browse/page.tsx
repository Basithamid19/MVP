'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Star, 
  ShieldCheck, 
  MapPin, 
  Filter, 
  Search as SearchIcon,
  ChevronRight,
  Loader2
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
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="bg-white border-b border-border-dim sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-chip flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
          </Link>
          
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-dim" />
              <input 
                type="text" 
                placeholder="Search services..." 
                className="w-full pl-10 pr-4 py-2 bg-surface-alt border-none rounded-full text-sm focus:ring-2 focus:ring-brand transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="w-8 h-8 bg-surface-alt rounded-full flex items-center justify-center">
              <img src="https://i.pravatar.cc/100?img=12" className="w-full h-full rounded-full" alt="Profile" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white p-6 rounded-panel border border-border-dim sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-4 h-4" />
                <h2 className="font-bold">Filters</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-dim mb-3 block">Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 bg-surface-alt border border-border-dim rounded-input text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
                  >
                    <option value="">All Categories</option>
                    <option value="plumber">Plumber</option>
                    <option value="electrician">Electrician</option>
                    <option value="handyman">Handyman</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="furniture-assembly">Furniture Assembly</option>
                    <option value="moving-help">Moving Help</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verified Only</span>
                  <button 
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${verifiedOnly ? 'bg-brand' : 'bg-border'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${verifiedOnly ? 'left-5' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Provider List */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">
                {category ? `${category.charAt(0).toUpperCase() + category.slice(1)}s` : 'All Professionals'} in Vilnius
              </h1>
              <span className="text-sm text-ink-sub font-medium">{providers.length} results</span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-ink-dim mb-4" />
                <p className="text-ink-dim font-medium">Finding the best pros...</p>
              </div>
            ) : providers.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {providers.map((p) => (
                  <Link 
                    key={p.id} 
                    href={`/providers/${p.id}`}
                    className="group bg-white p-6 rounded-panel border border-border-dim hover:border-brand transition-all hover:shadow-float flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-surface-alt rounded-card overflow-hidden  transition-all">
                          <img src={p.user.image || `https://i.pravatar.cc/150?u=${p.id}`} alt={p.user.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{p.user.name}</h3>
                            {p.isVerified && (
                              <div className="w-5 h-5 bg-info text-white rounded-full flex items-center justify-center">
                                <ShieldCheck className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-brand">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-ink font-bold text-sm">{p.ratingAvg.toFixed(1)}</span>
                            <span className="text-ink-dim text-xs font-medium ml-1">({p.completedJobs} jobs)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-ink-sub text-sm line-clamp-2 mb-6 leading-relaxed">
                      {p.bio}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-border-dim">
                      <div className="flex items-center gap-2 text-xs font-bold text-ink-dim uppercase tracking-widest">
                        <MapPin className="w-3 h-3" />
                        {p.serviceArea}
                      </div>
                      <div className="text-xs font-bold text-trust bg-trust-surface px-3 py-1 rounded-full">
                        {p.responseTime}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-hero border border-dashed border-border text-center">
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
      </main>
    </div>
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
