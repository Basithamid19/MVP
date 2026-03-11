'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, User, Briefcase } from 'lucide-react';

export default function RegisterPage() {
  const [role, setRole] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role }),
      });

      if (res.ok) {
        router.push('/login?registered=true');
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-24 py-12">
        <div className="max-w-md w-full mx-auto">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <span className="font-bold text-xl tracking-tight">VilniusPro</span>
          </Link>

          <h1 className="text-4xl font-bold tracking-tighter mb-2">Create account.</h1>
          <p className="text-gray-500 mb-10">Join the VilniusPro community today.</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button 
              onClick={() => setRole('CUSTOMER')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                role === 'CUSTOMER' ? 'border-black bg-black text-white shadow-xl' : 'border-gray-100 bg-gray-50 text-gray-400'
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-widest">Customer</span>
            </button>
            <button 
              onClick={() => setRole('PROVIDER')}
              className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                role === 'PROVIDER' ? 'border-black bg-black text-white shadow-xl' : 'border-gray-100 bg-gray-50 text-gray-400'
              }`}
            >
              <Briefcase className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-widest">Provider</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-2xl">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Full Name</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all"
                placeholder="Jonas Jonaitis"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Email Address</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Password</label>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white p-4 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account? <Link href="/login" className="text-black font-bold hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:block flex-1 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:40px_40px] opacity-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white rounded-full shadow-2xl flex items-center justify-center p-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
              <span className="text-white font-bold text-4xl">V</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              {role === 'PROVIDER' ? 'Grow your business in Vilnius.' : 'The best pros in Vilnius.'}
            </h2>
            <p className="text-gray-500 leading-relaxed">
              {role === 'PROVIDER' 
                ? 'Join our network of verified professionals and get access to high-quality leads every day.'
                : 'Join thousands of residents who trust VilniusPro for their home maintenance needs.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
