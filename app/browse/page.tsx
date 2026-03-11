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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
          </Link>
          
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search services..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-black transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <img src="https://i.pravatar.cc/100?img=12" className="w-full h-full rounded-full" alt="Profile" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-4 h-4" />
                <h2 className="font-bold">Filters</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 block">Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-black outline-none"
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
                    className={`w-10 h-6 rounded-full transition-colors relative ${verifiedOnly ? 'bg-black' : 'bg-gray-200'}`}
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
              <span className="text-sm text-gray-500 font-medium">{providers.length} results</span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300 mb-4" />
                <p className="text-gray-400 font-medium">Finding the best pros...</p>
              </div>
            ) : providers.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {providers.map((p) => (
                  <Link 
                    key={p.id} 
                    href={`/providers/${p.id}`}
                    className="group bg-white p-6 rounded-[32px] border border-gray-100 hover:border-black transition-all hover:shadow-2xl flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                          <img src={p.user.image || `https://i.pravatar.cc/150?u=${p.id}`} alt={p.user.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{p.user.name}</h3>
                            {p.isVerified && (
                              <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
                                <ShieldCheck className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-black font-bold text-sm">{p.ratingAvg.toFixed(1)}</span>
                            <span className="text-gray-400 text-xs font-medium ml-1">({p.completedJobs} jobs)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-500 text-sm line-clamp-2 mb-6 leading-relaxed">
                      {p.bio}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-50">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <MapPin className="w-3 h-3" />
                        {p.serviceArea}
                      </div>
                      <div className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        {p.responseTime}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-[40px] border border-dashed border-gray-200 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SearchIcon className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">No pros found</h3>
                <p className="text-gray-500 mb-8">Try adjusting your filters to find more professionals.</p>
                <button 
                  onClick={() => { setCategory(''); setVerifiedOnly(false); }}
                  className="bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all"
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500 font-medium">Loading...</p>
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
