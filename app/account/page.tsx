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

const TABS = ['Bookings', 'My Account'] as const;
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
  const [showInvoices, setShowInvoices] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  const tabParam = searchParams.get('tab');
  const initialTab: Tab = tabParam === 'settings' ? 'My Account' : 'Bookings';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => {
    const t = searchParams.get('tab');
    setActiveTab(t === 'settings' ? 'My Account' : 'Bookings');
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
  const activeBookings = bookings.filter(b => b.status !== 'CANCELED');
  const totalSpent = completedBookings.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);
  const reviewsGiven = completedBookings.filter(b => b.review).length;
  const uniqueAddresses = [...new Set(bookings.map(b => b.quote?.request?.address).filter(Boolean))] as string[];
  const referralLink = `https://mvpvilnius.vercel.app?ref=${(user as any)?.id?.slice(0, 8)}`;

  return (
    <div className="min-h-screen bg-canvas pb-24 md:pb-20">
      {/* Header */}
      <header className="bg-white border-b border-border-dim sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => router.back()} className="hidden md:flex p-2 hover:bg-surface-alt rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold flex-1 text-lg">{activeTab === 'My Account' ? 'My Account' : 'Bookings'}</h1>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 text-sm font-medium text-ink-dim hover:text-danger transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Profile summary card — always visible */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-canvas rounded-2xl flex items-center justify-center overflow-hidden border border-border-dim shrink-0">
              {user?.image
                ? <img src={user.image} alt={user.name ?? ''} className="w-full h-full object-cover" />
                : <User className="w-7 h-7 text-ink-dim" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate">{user?.name}</h2>
              <p className="text-sm text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 bg-canvas rounded-2xl">
              <p className="text-xl font-bold">{activeBookings.length}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Bookings</p>
            </div>
            <div className="text-center p-3 bg-canvas rounded-2xl">
              <p className="text-xl font-bold">€{totalSpent.toFixed(0)}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Spent</p>
            </div>
            <div className="text-center p-3 bg-canvas rounded-2xl">
              <p className="text-xl font-bold">{reviewsGiven}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Reviews</p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-white rounded-2xl border border-gray-100">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab ? 'bg-brand text-white shadow-sm' : 'text-gray-400 hover:text-ink'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── TAB: BOOKINGS ──────────────────────────────────────── */}
        {activeTab === 'Bookings' && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-border-dim p-12 text-center">
                <div className="w-14 h-14 bg-canvas rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-7 h-7 text-gray-200" />
                </div>
                <p className="font-bold mb-1">No bookings yet</p>
                <p className="text-sm text-gray-400 mb-6">Find a pro and book your first service.</p>
                <Link href="/browse" className="bg-brand text-white px-6 py-3 rounded-2xl text-sm font-bold hover:opacity-90 transition-all">
                  Browse Pros
                </Link>
              </div>
            ) : (
              <>
                {/* Ongoing */}
                {bookings.filter(b => b.status !== 'COMPLETED' && b.status !== 'CANCELED').length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-ink-dim uppercase tracking-widest px-1 mb-2">Ongoing</p>
                    <div className="space-y-2">
                      {bookings.filter(b => b.status !== 'COMPLETED' && b.status !== 'CANCELED').map(b => (
                        <BookingCard key={b.id} b={b} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed */}
                {completedBookings.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-ink-dim uppercase tracking-widest px-1 mb-2 mt-4">Completed</p>
                    <div className="space-y-2">
                      {completedBookings.map(b => (
                        <BookingCard key={b.id} b={b} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Cancelled */}
                {bookings.filter(b => b.status === 'CANCELED').length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-ink-dim uppercase tracking-widest px-1 mb-2 mt-4">Cancelled</p>
                    <div className="space-y-2">
                      {bookings.filter(b => b.status === 'CANCELED').map(b => (
                        <BookingCard key={b.id} b={b} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TAB: MY ACCOUNT ───────────────────────────────────── */}
        {activeTab === 'My Account' && (
          <div className="space-y-4">

            {/* Profile */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-ink-dim">
                Profile
              </h3>
              <div className="space-y-0 text-sm divide-y divide-border-dim">
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-400">Name</span>
                  <span className="font-semibold">{user?.name}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-400">Email</span>
                  <span className="font-semibold truncate max-w-[200px]">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-400">Account type</span>
                  <span className="font-semibold capitalize">{(user as any)?.role?.toLowerCase() ?? 'customer'}</span>
                </div>
              </div>
            </div>

            {/* Invoices (collapsible) */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <button
                onClick={() => setShowInvoices(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-canvas transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-canvas rounded-xl flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-ink-sub" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Invoices</p>
                    <p className="text-xs text-gray-400">{completedBookings.length} completed booking{completedBookings.length !== 1 ? 's' : ''} · €{totalSpent.toFixed(2)} total</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-ink-dim transition-transform ${showInvoices ? 'rotate-90' : ''}`} />
              </button>

              {showInvoices && (
                <div className="border-t border-border-dim">
                  {completedBookings.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-gray-400">No invoices yet.</p>
                  ) : (
                    <div className="p-4 space-y-3">
                      {completedBookings.map(b => {
                        const invoiceNo = `VP-${b.id.slice(0, 8).toUpperCase()}`;
                        const date = new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                        const serviceFee = (b.totalAmount * 0.88).toFixed(2);
                        const platformFee = (b.totalAmount * 0.12).toFixed(2);
                        return (
                          <div key={b.id} className="bg-canvas rounded-2xl p-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <p className="font-bold text-sm">{b.quote?.request?.category?.name ?? 'Service'}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Invoice #{invoiceNo}</p>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" /> {date}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold">€{b.totalAmount?.toFixed(2)}</p>
                                <span className="text-[10px] font-bold uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Paid</span>
                              </div>
                            </div>
                            <div className="bg-white rounded-xl p-3 text-xs space-y-1.5 mb-3">
                              <div className="flex justify-between text-ink-sub"><span>Provider</span><span>{b.provider?.user?.name}</span></div>
                              <div className="flex justify-between text-ink-sub"><span>Service fee</span><span>€{serviceFee}</span></div>
                              <div className="flex justify-between text-ink-sub"><span>Platform fee (12%)</span><span>€{platformFee}</span></div>
                              <div className="flex justify-between font-bold pt-1.5 border-t border-border-dim"><span>Total</span><span>€{b.totalAmount?.toFixed(2)}</span></div>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/bookings/${b.id}`} className="flex-1 text-center py-2 border border-border-dim rounded-xl text-xs font-bold hover:border-gray-400 transition-colors">
                                View booking
                              </Link>
                              <button
                                onClick={() => {
                                  const rows = [
                                    ['Invoice', invoiceNo], ['Date', date],
                                    ['Service', b.quote?.request?.category?.name ?? 'Service'],
                                    ['Pro', b.provider?.user?.name ?? ''],
                                    ['Service fee', `€${serviceFee}`],
                                    ['Platform fee', `€${platformFee}`],
                                    ['Total', `€${b.totalAmount?.toFixed(2)}`],
                                  ];
                                  const csv = rows.map(r => r.join(',')).join('\n');
                                  const blob = new Blob([csv], { type: 'text/csv' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a'); a.href = url;
                                  a.download = `${invoiceNo}.csv`; a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" /> CSV
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Credits / Referral (collapsible) */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <button
                onClick={() => setShowCredits(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-canvas transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-canvas rounded-xl flex items-center justify-center">
                    <Gift className="w-4 h-4 text-ink-sub" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Credits & Referrals</p>
                    <p className="text-xs text-gray-400">€0.00 available · Refer friends to earn</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-ink-dim transition-transform ${showCredits ? 'rotate-90' : ''}`} />
              </button>

              {showCredits && (
                <div className="border-t border-border-dim p-4 space-y-3">
                  <div className="bg-brand rounded-2xl p-4 text-white">
                    <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Referral Credit</p>
                    <p className="text-3xl font-bold mb-1">€0.00</p>
                    <p className="text-sm text-white/70">Earn €10 for every friend who completes their first booking.</p>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-canvas rounded-xl border border-border-dim">
                    <span className="text-xs text-ink-sub flex-1 truncate font-medium">{referralLink}</span>
                    <button
                      onClick={() => navigator.clipboard?.writeText(referralLink)}
                      className="shrink-0 px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-bold hover:opacity-90"
                    >
                      Copy
                    </button>
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 py-3 border border-border-dim rounded-xl text-sm font-bold hover:bg-canvas transition-colors">
                    <Share2 className="w-4 h-4" /> Share with friends
                  </button>
                  <div className="space-y-3 pt-1">
                    {[
                      { icon: Share2,       text: 'Refer a friend',  sub: 'Earn €10 when they complete their first booking' },
                      { icon: Star,         text: 'Leave a review',  sub: 'Earn €2 after each completed booking review' },
                      { icon: CheckCircle2, text: 'Complete a job',  sub: 'Earn €5 loyalty credit on your 5th booking' },
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
              )}
            </div>

            {/* Settings */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-5 pt-5 pb-1">
                <p className="text-xs font-bold text-ink-dim uppercase tracking-widest">Settings</p>
              </div>
              {[
                { icon: Shield,    label: 'Saved Addresses',     sub: uniqueAddresses.length > 0 ? `${uniqueAddresses.length} saved` : 'None yet', href: '/dashboard' },
                { icon: User,      label: 'Favourite Pros',      sub: 'Manage bookmarked pros',              href: '/browse' },
                { icon: FileText,  label: 'New Service Request', sub: 'Post a job and get quotes',           href: '/requests/new' },
              ].map((item, i) => (
                <Link key={i} href={item.href} className="flex items-center gap-4 px-5 py-4 border-t border-border-dim hover:bg-canvas transition-colors">
                  <div className="w-9 h-9 bg-canvas rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-ink-sub" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
                </Link>
              ))}
            </div>

            {/* Support */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-5 pt-5 pb-1">
                <p className="text-xs font-bold text-ink-dim uppercase tracking-widest">Support</p>
              </div>
              {[
                { icon: MessageCircle, label: 'Chat with us',  sub: 'Avg. reply under 1 hour',   href: 'mailto:support@vilniuspro.lt' },
                { icon: Mail,          label: 'Email us',      sub: 'support@vilniuspro.lt',      href: 'mailto:support@vilniuspro.lt' },
                { icon: HelpCircle,    label: 'Help Centre',   sub: 'FAQs and how-to guides',    href: '/' },
                { icon: LifeBuoy,      label: 'Dispute a booking', sub: 'Report an issue with a job', href: '/dashboard' },
              ].map((item, i) => (
                <Link key={i} href={item.href} className="flex items-center gap-4 px-5 py-4 border-t border-border-dim hover:bg-canvas transition-colors">
                  <div className="w-9 h-9 bg-canvas rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-ink-sub" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
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

function BookingCard({ b }: { b: any }) {
  return (
    <Link
      href={`/bookings/${b.id}`}
      className="flex items-start gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:border-brand/30 transition-all"
    >
      <img
        src={b.provider?.user?.image || `https://i.pravatar.cc/60?u=${b.providerId}`}
        alt={b.provider?.user?.name}
        className="w-11 h-11 rounded-xl object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{b.provider?.user?.name}</p>
        <p className="text-xs text-gray-400">{b.quote?.request?.category?.name ?? 'Service'}</p>
        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />
          {new Date(b.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_STYLES[b.status] ?? 'bg-gray-100 text-ink-sub'}`}>
          {b.status.replace('_', ' ')}
        </span>
        <span className="font-bold text-sm">€{b.totalAmount?.toFixed(2)}</span>
        {b.review && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
      </div>
    </Link>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-canvas"><div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>}>
      <AccountContent />
    </Suspense>
  );
}
