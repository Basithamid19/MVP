'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useSession } from 'next-auth/react';
import { 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Droplets, 
  Zap, 
  Hammer, 
  Sparkles, 
  Box, 
  Truck,
  ArrowRight,
  AlertCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';

const categories = [
  { name: 'Plumber', slug: 'plumber', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
  { name: 'Electrician', slug: 'electrician', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { name: 'Handyman', slug: 'handyman', icon: Hammer, color: 'text-orange-500', bg: 'bg-orange-50' },
  { name: 'Cleaning', slug: 'cleaning', icon: Sparkles, color: 'text-green-500', bg: 'bg-green-50' },
  { name: 'Furniture', slug: 'furniture-assembly', icon: Box, color: 'text-purple-500', bg: 'bg-purple-50' },
  { name: 'Moving', slug: 'moving-help', icon: Truck, color: 'text-red-500', bg: 'bg-red-50' },
];

const heroVariants = {
  speed: {
    badge: 'Trusted local pros in Vilnius',
    title: 'Book verified home service pros in minutes.',
    description:
      'Compare plumbers, electricians, and cleaners with transparent pricing, real reviews, and fast local response.',
  },
  trust: {
    badge: 'Handpicked professionals in Vilnius',
    title: 'Hire trusted experts backed by real customer reviews.',
    description:
      'Every pro is ID-verified and reviewed by completed customers, so you can book with confidence from day one.',
  },
  value: {
    badge: 'Transparent pricing, no surprises',
    title: 'Get quality home services at clear, upfront prices.',
    description:
      'Compare offers from top local pros, check ratings, and choose the right fit for your budget and timeline.',
  },
};

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeVariant, setActiveVariant] = useState<'speed' | 'trust' | 'value'>('speed');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [savedAddress, setSavedAddress] = useState('');
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    const variantParam = new URLSearchParams(window.location.search).get('hero');
    if (variantParam === 'trust' || variantParam === 'value' || variantParam === 'speed') {
      setActiveVariant(variantParam);
    }
    // Load saved address from localStorage
    const addr = localStorage.getItem('vp_saved_address');
    if (addr) setSavedAddress(addr);
  }, []);

  useEffect(() => {
    if (session) {
      fetch('/api/bookings')
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setRecentBookings(d.slice(0, 3)); })
        .catch(() => {});
    }
  }, [session]);

  const heroContent = heroVariants[activeVariant];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/browse');
    }
  };

  const handleCategoryRequest = (slug: string) => {
    const params = new URLSearchParams({ category: slug });
    if (isUrgent) params.set('urgent', '1');
    router.push(`/requests/new?${params.toString()}`);
  };

  const BOOKING_STATUS_STYLES: Record<string, string> = {
    SCHEDULED:   'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-orange-100 text-orange-700',
    COMPLETED:   'bg-green-100 text-green-700',
    CANCELED:    'bg-red-100 text-red-600',
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <span className="font-bold text-xl tracking-tight">VilniusPro</span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <Link href="/account" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">My Account</Link>
                <Link href="/requests/new" className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all">Book a Pro</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 rounded-md">Log in</Link>
                <Link href="/register" className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-offset-2">Join as Pro</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-[11px] sm:text-xs font-bold uppercase tracking-widest rounded-full mb-4 sm:mb-6">
                {heroContent.badge}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-[0.95] mb-4 sm:mb-6">
                {heroContent.title}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-500 mb-6 sm:mb-8 leading-relaxed max-w-xl">
                {heroContent.description}
              </p>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="mb-5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search for a service, e.g. 'plumber'..."
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-black text-white px-6 py-4 rounded-2xl font-semibold hover:bg-gray-800 transition-all flex items-center gap-2 shrink-0"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Saved address + urgency toggle */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={savedAddress}
                    onChange={e => {
                      setSavedAddress(e.target.value);
                      localStorage.setItem('vp_saved_address', e.target.value);
                    }}
                    placeholder="Your address in Vilnius"
                    className="bg-transparent text-sm font-medium text-gray-700 outline-none placeholder:text-gray-400 w-48"
                  />
                </div>
                <button
                  onClick={() => setIsUrgent(!isUrgent)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                    isUrgent ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  <AlertCircle className={`w-4 h-4 ${isUrgent ? 'text-orange-500' : 'text-gray-400'}`} />
                  {isUrgent ? 'Urgent — on' : 'Mark as urgent'}
                  <div className={`w-8 h-5 rounded-full relative transition-colors ${isUrgent ? 'bg-orange-500' : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isUrgent ? 'left-3.5' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>

              {/* Quick category links */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {categories.slice(0, 4).map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoryRequest(cat.slug)}
                    className="px-3 sm:px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:text-black hover:border-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    {cat.name}
                    {isUrgent && <span className="ml-1 text-orange-500">⚡</span>}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="hidden lg:block"
            >
              <div className="bg-gray-50 rounded-[40px] border border-gray-100 p-8 shadow-sm">
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Avg. Rating</p>
                    <p className="text-2xl font-bold tracking-tight">4.9</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Response</p>
                    <p className="text-2xl font-bold tracking-tight">&lt;1h</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Verified</p>
                    <p className="text-2xl font-bold tracking-tight">100%</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">Emergency plumber</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Available now</span>
                    </div>
                    <p className="text-sm text-gray-500">From €35 • 4.9 rating • 220+ jobs</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">Licensed electrician</p>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">Fast reply</span>
                    </div>
                    <p className="text-sm text-gray-500">From €40 • 4.8 rating • 180+ jobs</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gray-50 -z-10 rounded-l-[100px] hidden lg:block">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>
      </section>

      {/* Recent Bookings — only shown for logged-in users */}
      {session && recentBookings.length > 0 && (
        <section className="py-12 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Recent bookings</h2>
                <p className="text-sm text-gray-500">Pick up where you left off.</p>
              </div>
              <Link href="/account" className="text-sm font-bold text-black border-b-2 border-black pb-0.5 hover:opacity-70 transition-opacity">View all</Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentBookings.map(b => (
                <Link
                  key={b.id}
                  href={`/bookings/${b.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:border-black transition-all"
                >
                  <img
                    src={b.provider?.user?.image || `https://i.pravatar.cc/60?u=${b.providerId}`}
                    alt={b.provider?.user?.name}
                    className="w-10 h-10 rounded-xl object-cover grayscale shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{b.provider?.user?.name}</p>
                    <p className="text-xs text-gray-400">{b.quote?.request?.category?.name ?? 'Service'}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${BOOKING_STATUS_STYLES[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Grid */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Popular Categories</h2>
              <p className="text-gray-500">Whatever you need, we have a pro for that.</p>
            </div>
            <Link href="/browse" className="text-sm font-bold text-black border-b-2 border-black pb-1 hover:opacity-70 transition-opacity">View all</Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <button 
                  onClick={() => handleCategoryRequest(cat.slug)}
                  className="group block w-full p-6 bg-white rounded-3xl border border-gray-100 hover:border-black transition-all hover:shadow-xl hover:-translate-y-1 text-left"
                >
                  <div className={`w-12 h-12 ${cat.bg} ${cat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm">{cat.name}</h3>
                  {isUrgent && <p className="text-[10px] text-orange-500 font-bold mt-1">⚡ Urgent</p>}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-square bg-gray-100 rounded-[60px] overflow-hidden">
               <img 
                src="https://picsum.photos/seed/vilnius/800/800" 
                alt="Vilnius Professional" 
                className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-black font-bold text-sm">4.9/5</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-800 italic">&quot;Found an amazing electrician in just 5 minutes. Highly recommend!&quot;</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-8">Why VilniusPro?</h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Verified Experts</h3>
                    <p className="text-gray-500 leading-relaxed">Every professional goes through a multi-tier verification process, including ID and trade certification checks.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-14 h-14 bg-gray-100 text-black rounded-2xl flex items-center justify-center shrink-0">
                    <Star className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Real Reviews</h3>
                    <p className="text-gray-500 leading-relaxed">Only customers with completed bookings can leave reviews, ensuring 100% authentic feedback.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-14 h-14 bg-gray-100 text-black rounded-2xl flex items-center justify-center shrink-0">
                    <Zap className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Fast Response</h3>
                    <p className="text-gray-500 leading-relaxed">Our pros are local and ready to help. Most requests get a response within the hour.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold text-xl">V</span>
                </div>
                <span className="font-bold text-xl tracking-tight">VilniusPro</span>
              </div>
              <p className="text-gray-400 max-w-sm mb-8">
                Connecting Vilnius residents with the best local service professionals. Quality work, guaranteed.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Services</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><Link href="/browse?category=plumber" className="hover:text-white transition-colors">Plumbing</Link></li>
                <li><Link href="/browse?category=electrician" className="hover:text-white transition-colors">Electrical</Link></li>
                <li><Link href="/browse?category=cleaning" className="hover:text-white transition-colors">Cleaning</Link></li>
                <li><Link href="/browse?category=handyman" className="hover:text-white transition-colors">Handyman</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/provider/register" className="hover:text-white transition-colors">Become a Pro</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:row justify-between items-center gap-4 text-xs text-gray-500">
            <p>© 2026 VilniusPro Marketplace. All rights reserved.</p>
            <div className="flex gap-6">
              <span>Vilnius, Lithuania</span>
              <span>English / Lietuvių</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
