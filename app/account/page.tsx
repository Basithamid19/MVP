'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import MobileNav from '@/components/MobileNav';
import {
  ArrowLeft, Star, Loader2, CheckCircle2, Clock,
  Gift, Share2, FileText, LogOut,
  ChevronRight, User, Receipt, Download,
  LifeBuoy, Mail, MessageCircle, HelpCircle, Shield,
} from 'lucide-react';

const TABS = ['Bookings', 'Invoices', 'Credits', 'My Account'] as const;
type Tab = typeof TABS[number];

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED:   'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  COMPLETED:   'bg-green-100 text-green-700',
  CANCELED:    'bg-red-100 text-red-600',
};

function AccountContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Derive active tab from URL query param; default to Bookings
  const tabParam = searchParams.get('tab');
  const initialTab: Tab = tabParam === 'settings' ? 'My Account'
    : tabParam === 'invoices' ? 'Invoices'
    : tabParam === 'credits' ? 'Credits'
    : 'Bookings';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Re-sync if query param changes (e.g. back/forward navigation)
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'settings') setActiveTab('My Account');
    else if (t === 'invoices') setActiveTab('Invoices');
    else if (t === 'credits') setActiveTab('Credits');
    else setActiveTab('Bookings');
  }, [searchParams]);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      fetch('/api/bookings')
        .then(r => r.json())
        .then(d => { setBookings(Array.isArray(d) ? d : []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loader2 className="w-8 h-8 animate-spin text-ink-dim" />
      </div>
    );
  }

  if (!session) return null;

  const user = session.user;
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const totalSpent = completedBookings.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);
  const reviewsGiven = completedBookings.filter(b => b.review).length;

  const uniqueAddresses = [...new Set(
    bookings.map(b => b.quote?.request?.address).filter(Boolean)
  )] as string[];

  const referralLink = `https://mvpvilnius.vercel.app?ref=${(user as any)?.id?.slice(0, 8)}`;

  return (
    <div className="min-h-screen bg-canvas pb-24 md:pb-20">
      {/* Header */}
      <header className="bg-white border-b border-border-dim sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-surface-alt rounded-full transition-colors md:flex hidden">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold flex-1">My Account</h1>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 text-sm font-bold text-ink-dim hover:text-danger transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
              {user?.image
                ? <img src={user.image} alt={user.name ?? ''} className="w-full h-full object-cover" />
                : <User className="w-8 h-8 text-ink-dim" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-xl truncate">{user?.name}</h2>
              <p className="text-sm text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-canvas rounded-2xl">
              <p className="text-2xl font-bold">{bookings.length}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Bookings</p>
            </div>
            <div className="text-center p-3 bg-canvas rounded-2xl">
              <p className="text-2xl font-bold">€{totalSpent.toFixed(0)}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Spent</p>
            </div>
            <div className="text-center p-3 bg-canvas rounded-2xl">
              <p className="text-2xl font-bold">{reviewsGiven}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Reviews</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[80px] py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab ? 'bg-brand text-white' : 'text-gray-400 hover:text-ink'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Bookings */}
        {activeTab === 'Bookings' && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-border-dim p-12 text-center">
                <div className="w-14 h-14 bg-canvas rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-7 h-7 text-gray-200" />
                </div>
                <p className="font-bold mb-1">No bookings yet</p>
                <p className="text-sm text-gray-400 mb-6">Find a pro and book your first service.</p>
                <Link href="/browse" className="bg-black text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all">
                  Browse Pros
                </Link>
              </div>
            ) : (
              bookings.map(b => (
                <Link
                  key={b.id}
                  href={`/bookings/${b.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-4 hover:border-black transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src={b.provider?.user?.image || `https://i.pravatar.cc/60?u=${b.providerId}`}
                        alt={b.provider?.user?.name}
                        className="w-10 h-10 rounded-xl object-cover grayscale shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{b.provider?.user?.name}</p>
                        <p className="text-xs text-gray-400">{b.quote?.request?.category?.name ?? 'Service'}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_STYLES[b.status] ?? 'bg-gray-100 text-ink-sub'}`}>
                        {b.status.replace('_', ' ')}
                      </span>
                      <span className="font-bold text-sm">€{b.totalAmount?.toFixed(2)}</span>
                      {b.review && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Tab: Invoices */}
        {activeTab === 'Invoices' && (
          <div className="space-y-4">
            {completedBookings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-border-dim p-12 text-center">
                <div className="w-14 h-14 bg-canvas rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-7 h-7 text-gray-200" />
                </div>
                <p className="font-bold mb-1">No invoices yet</p>
                <p className="text-sm text-gray-400">Invoices appear here after a booking is completed.</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold">Total spent</h3>
                    <span className="text-2xl font-bold">€{totalSpent.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-400">{completedBookings.length} completed booking{completedBookings.length > 1 ? 's' : ''}</p>
                </div>

                <div className="space-y-3">
                  {completedBookings.map(b => {
                    const invoiceNo = `VP-${b.id.slice(0, 8).toUpperCase()}`;
                    const date = new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                    const serviceFee = (b.totalAmount * 0.88).toFixed(2);
                    const platformFee = (b.totalAmount * 0.12).toFixed(2);
                    return (
                      <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <p className="font-bold text-sm">{b.quote?.request?.category?.name ?? 'Service'}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Invoice #{invoiceNo}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> {date}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">€{b.totalAmount?.toFixed(2)}</p>
                            <span className="text-[10px] font-bold uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Paid</span>
                          </div>
                        </div>

                        <div className="bg-canvas rounded-xl p-3 text-xs space-y-1.5 mb-4">
                          <div className="flex justify-between text-ink-sub">
                            <span>Service</span>
                            <span>{b.provider?.user?.name}</span>
                          </div>
                          <div className="flex justify-between text-ink-sub">
                            <span>Service fee</span>
                            <span>€{serviceFee}</span>
                          </div>
                          <div className="flex justify-between text-ink-sub">
                            <span>Platform fee (12%)</span>
                            <span>€{platformFee}</span>
                          </div>
                          <div className="flex justify-between font-bold pt-1.5 border-t border-border-dim">
                            <span>Total</span>
                            <span>€{b.totalAmount?.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link
                            href={`/bookings/${b.id}`}
                            className="flex-1 text-center py-2 border border-border-dim rounded-xl text-xs font-bold hover:border-gray-400 transition-colors"
                          >
                            View booking
                          </Link>
                          <button
                            onClick={() => {
                              const rows = [
                                ['Invoice', invoiceNo],
                                ['Date', date],
                                ['Service', b.quote?.request?.category?.name ?? 'Service'],
                                ['Pro', b.provider?.user?.name ?? ''],
                                ['Service fee', `€${serviceFee}`],
                                ['Platform fee', `€${platformFee}`],
                                ['Total', `€${b.totalAmount?.toFixed(2)}`],
                              ];
                              const csv = rows.map(r => r.join(',')).join('\n');
                              const blob = new Blob([csv], { type: 'text/csv' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${invoiceNo}.csv`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" /> CSV
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Credits */}
        {activeTab === 'Credits' && (
          <div className="space-y-4">
            {/* Balance */}
            <div className="bg-black text-white rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Referral Credit</p>
                  <p className="text-3xl font-bold">€0.00</p>
                </div>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">Earn €10 credit for every friend you refer who completes their first booking.</p>
            </div>

            {/* Referral link */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold mb-1">Your referral link</h3>
              <p className="text-sm text-gray-400 mb-4">Share this link and track your earnings.</p>
              <div className="flex items-center gap-2 p-3 bg-canvas rounded-xl border border-gray-100 mb-3">
                <span className="text-xs text-ink-sub flex-1 truncate font-medium">{referralLink}</span>
                <button
                  onClick={() => navigator.clipboard?.writeText(referralLink)}
                  className="shrink-0 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors"
                >
                  Copy
                </button>
              </div>
              <button className="w-full flex items-center justify-center gap-2 py-3 border border-border-dim rounded-xl text-sm font-bold hover:border-gray-400 transition-colors">
                <Share2 className="w-4 h-4" /> Share with friends
              </button>
            </div>

            {/* How to earn */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold mb-4">How to earn credits</h3>
              <div className="space-y-3">
                {[
                  { icon: Share2,       text: 'Refer a friend',          sub: 'Earn €10 when they complete their first booking' },
                  { icon: Star,         text: 'Leave a review',          sub: 'Earn €2 after each completed booking review' },
                  { icon: CheckCircle2, text: 'Complete a job',          sub: 'Earn €5 loyalty credit on your 5th booking' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-canvas rounded-xl flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-ink-sub" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{item.text}</p>
                      <p className="text-xs text-gray-400">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: My Account */}
        {activeTab === 'My Account' && (
          <div className="space-y-4">

            {/* Profile */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-ink-dim" /> Profile
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-400">Name</span>
                  <span className="font-semibold">{user?.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-border-dim">
                  <span className="text-gray-400">Email</span>
                  <span className="font-semibold truncate max-w-[180px]">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-border-dim">
                  <span className="text-gray-400">Member since</span>
                  <span className="font-semibold">2024</span>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-5 pt-5 pb-2">
                <h3 className="font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-ink-dim" /> Settings
                </h3>
              </div>
              {[
                { label: 'Saved Addresses', sub: uniqueAddresses.length > 0 ? `${uniqueAddresses.length} saved` : 'None yet', href: '/dashboard' },
                { label: 'Favourite Pros', sub: 'Manage saved pros', href: '/browse' },
                { label: 'New Service Request', sub: 'Post a job for quotes', href: '/requests/new' },
              ].map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className="flex items-center justify-between px-5 py-4 border-t border-border-dim hover:bg-canvas transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
                </Link>
              ))}
            </div>

            {/* Support */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-5 pt-5 pb-2">
                <h3 className="font-bold flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-ink-dim" /> Support
                </h3>
              </div>
              {[
                { icon: MessageCircle, label: 'Chat with us', sub: 'Avg. reply time: under 1 hour', href: 'mailto:support@vilniuspro.lt' },
                { icon: Mail,          label: 'Email support', sub: 'support@vilniuspro.lt',          href: 'mailto:support@vilniuspro.lt' },
                { icon: HelpCircle,    label: 'Help Centre',   sub: 'FAQs and how-to guides',         href: '/' },
              ].map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className="flex items-center gap-4 px-5 py-4 border-t border-border-dim hover:bg-canvas transition-colors"
                >
                  <div className="w-9 h-9 bg-canvas rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-ink-sub" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-gray-400 truncate">{item.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
                </Link>
              ))}
            </div>

            {/* Log out */}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center justify-center gap-2 py-4 border border-border-dim rounded-2xl text-sm font-bold text-ink-sub hover:border-red-200 hover:text-danger transition-all"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>
        )}
      </main>
      <MobileNav />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-canvas"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>}>
      <AccountContent />
    </Suspense>
  );
}
