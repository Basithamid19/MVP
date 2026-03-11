'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Star, 
  ShieldCheck, 
  MapPin, 
  MessageSquare, 
  Clock, 
  Languages,
  CheckCircle2,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function ProviderProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const res = await fetch(`/api/providers?id=${id}`);
        const data = await res.json();
        // Since the API returns an array, find the specific one
        const p = data.find((item: any) => item.id === id);
        setProvider(p);
      } catch (error) {
        console.error('Failed to fetch provider', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProvider();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Provider not found</h1>
        <Link href="/browse" className="text-black font-bold underline">Back to browse</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold">Professional Profile</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-32 h-32 bg-gray-100 rounded-[40px] overflow-hidden grayscale shrink-0">
                  <img src={provider.user.image || `https://i.pravatar.cc/300?u=${provider.id}`} alt={provider.user.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold tracking-tight">{provider.user.name}</h2>
                    {provider.isVerified && (
                      <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-6 mb-6">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="text-black font-bold">{provider.ratingAvg.toFixed(1)}</span>
                      <span className="text-gray-400 text-sm font-medium ml-1">({provider.completedJobs} jobs completed)</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                      <MapPin className="w-4 h-4" />
                      {provider.serviceArea}
                    </div>
                  </div>

                  <p className="text-gray-500 leading-relaxed mb-8">
                    {provider.bio}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                        <Clock className="w-3 h-3" />
                        Response
                      </div>
                      <div className="text-sm font-bold">{provider.responseTime}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                        <Languages className="w-3 h-3" />
                        Languages
                      </div>
                      <div className="text-sm font-bold">{provider.languages.join(', ')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Services & Pricing</h3>
              <div className="space-y-4">
                {provider.categories.map((cat: any) => (
                  <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <span className="font-bold">{cat.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Starting from</div>
                      <div className="text-lg font-bold">€25.00<span className="text-gray-400 text-xs font-medium ml-1">/hr</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-black text-white p-8 rounded-[40px] shadow-2xl sticky top-24">
              <h3 className="text-2xl font-bold tracking-tight mb-2">Need help?</h3>
              <p className="text-gray-400 text-sm mb-8">Send a request to {provider.user.name.split(' ')[0]} and get a quote within the hour.</p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  No upfront payment
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  Free cancellation
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  VilniusPro Guarantee
                </div>
              </div>

              <Link 
                href={`/requests/new?providerId=${provider.id}&category=${provider.categories[0]?.slug}`}
                className="block w-full bg-white text-black text-center py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all mb-4"
              >
                Send Service Request
              </Link>
              
              <button className="w-full bg-white/10 text-white text-center py-4 rounded-2xl font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat with Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
