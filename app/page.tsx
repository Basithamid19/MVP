'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
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
  ArrowRight
} from 'lucide-react';

const categories = [
  { name: 'Plumber', slug: 'plumber', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
  { name: 'Electrician', slug: 'electrician', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { name: 'Handyman', slug: 'handyman', icon: Hammer, color: 'text-orange-500', bg: 'bg-orange-50' },
  { name: 'Cleaning', slug: 'cleaning', icon: Sparkles, color: 'text-green-500', bg: 'bg-green-50' },
  { name: 'Furniture', slug: 'furniture-assembly', icon: Box, color: 'text-purple-500', bg: 'bg-purple-50' },
  { name: 'Moving', slug: 'moving-help', icon: Truck, color: 'text-red-500', bg: 'bg-red-50' },
];

export default function LandingPage() {
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
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Log in</Link>
            <Link href="/register" className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all">Join as Pro</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-widest rounded-full mb-6">
                Launching in Vilnius 🇱🇹
              </span>
              <h1 className="text-6xl sm:text-7xl font-bold tracking-tighter leading-[0.9] mb-8">
                Find trusted local pros for your home.
              </h1>
              <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-xl">
                The easiest way to book plumbers, electricians, and cleaners in Vilnius. Verified experts, transparent pricing.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/browse" className="flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-semibold hover:bg-gray-800 transition-all group">
                  Browse Services
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 font-medium">Vilnius, Lithuania</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gray-50 -z-10 rounded-l-[100px] hidden lg:block">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>
      </section>

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
                <Link 
                  href={`/browse?category=${cat.slug}`}
                  className="group block p-6 bg-white rounded-3xl border border-gray-100 hover:border-black transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 ${cat.bg} ${cat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm">{cat.name}</h3>
                </Link>
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
