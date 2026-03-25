'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import CustomerLayout from '@/components/CustomerLayout';
import {
  Loader2, CheckCircle2, Clock,
  Gift, Share2, FileText, LogOut,
  ChevronRight, User, Receipt, Download, Star,
  LifeBuoy, Mail, MessageCircle, HelpCircle, Shield,
} from 'lucide-react';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvoices, setShowInvoices] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

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
  const uniqueAddresses = [...new Set(bookings.map(b => b.quote?.request?.address).filter(Boolean))] as string[];
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}?ref=${(user as any)?.id?.slice(0, 8)}`
    : `https://dispatch.app?ref=${(user as any)?.id?.slice(0, 8)}`;

  return (
    <CustomerLayout maxWidth="max-w-2xl">
      <div className="space-y-4">

        {/* Profile card */}
        <div className="bg-white rounded-panel border border-border-dim p-5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-canvas rounded-2xl flex items-center justify-center overflow-hidden border border-border-dim shrink-0">
              {user?.image
                ? <img src={user.image} alt={user.name ?? ''} className="w-full h-full object-cover" />
                : <User className="w-7 h-7 text-ink-dim" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate">{user?.name}</h2>
              <p className="text-sm text-ink-dim truncate">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 bg-canvas rounded-2xl">
              <p className="text-xl font-bold">{bookings.length}</p>
              <p className="text-[11px] text-ink-dim font-bold uppercase tracking-widest mt-0.5">Bookings</p>
            </div>
            <div className="text-center p-3 bg-canvas rounded-2xl">
              <p className="text-xl font-bold">€{totalSpent.toFixed(0)}</p>
              <p className="text-[11px] text-ink-dim font-bold uppercase tracking-widest mt-0.5">Spent</p>
            </div>
            <div className="text-center p-3 bg-canvas rounded-2xl">
              <p className="text-xl font-bold">{reviewsGiven}</p>
              <p className="text-[11px] text-ink-dim font-bold uppercase tracking-widest mt-0.5">Reviews</p>
            </div>
          </div>
        </div>

        {/* Profile info */}
        <div className="bg-white rounded-panel border border-border-dim p-5 shadow-sm">
          <p className="text-xs font-bold text-ink-dim uppercase tracking-widest mb-4">Profile</p>
          <div className="text-sm divide-y divide-border-dim">
            <div className="flex justify-between items-center py-3 first:pt-0">
              <span className="text-ink-dim">Name</span>
              <span className="font-semibold">{user?.name}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-ink-dim">Email</span>
              <span className="font-semibold truncate max-w-[200px]">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-ink-dim">Account type</span>
              <span className="font-semibold capitalize">{(user as any)?.role?.toLowerCase() ?? 'customer'}</span>
            </div>
          </div>
        </div>

        {/* Invoices (collapsible) */}
        <div className="bg-white rounded-panel border border-border-dim overflow-hidden shadow-sm">
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
                <p className="text-xs text-ink-dim">{completedBookings.length} invoice{completedBookings.length !== 1 ? 's' : ''} · €{totalSpent.toFixed(2)} total</p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 text-ink-dim transition-transform ${showInvoices ? 'rotate-90' : ''}`} />
          </button>
          {showInvoices && (
            <div className="border-t border-border-dim">
              {completedBookings.length === 0 ? (
                <p className="px-5 py-4 text-sm text-ink-dim">No invoices yet. They appear after a booking is completed.</p>
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
                            <p className="text-xs text-ink-dim mt-0.5">#{invoiceNo}</p>
                            <p className="text-xs text-ink-dim flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {date}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">€{b.totalAmount?.toFixed(2)}</p>
                            <span className="text-[10px] font-bold uppercase bg-trust-surface text-trust px-2 py-0.5 rounded-full">Paid</span>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-xs space-y-1.5 mb-3">
                          <div className="flex justify-between text-ink-sub"><span>Provider</span><span>{b.provider?.user?.name}</span></div>
                          <div className="flex justify-between text-ink-sub"><span>Service fee</span><span>€{serviceFee}</span></div>
                          <div className="flex justify-between text-ink-sub"><span>Platform fee (12%)</span><span>€{platformFee}</span></div>
                          <div className="flex justify-between font-bold pt-1.5 border-t border-border-dim"><span>Total</span><span>€{b.totalAmount?.toFixed(2)}</span></div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/bookings/${b.id}`} className="flex-1 text-center py-2 border border-border-dim rounded-xl text-xs font-bold hover:border-border transition-colors">View booking</Link>
                          <button
                            onClick={() => {
                              const rows = [['Invoice', invoiceNo], ['Date', date], ['Service', b.quote?.request?.category?.name ?? 'Service'], ['Pro', b.provider?.user?.name ?? ''], ['Service fee', `€${serviceFee}`], ['Platform fee', `€${platformFee}`], ['Total', `€${b.totalAmount?.toFixed(2)}`]];
                              const csv = rows.map(r => r.join(',')).join('\n');
                              const blob = new Blob([csv], { type: 'text/csv' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a'); a.href = url; a.download = `${invoiceNo}.csv`; a.click(); URL.revokeObjectURL(url);
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

        {/* Credits & Referrals (collapsible) */}
        <div className="bg-white rounded-panel border border-border-dim overflow-hidden shadow-sm">
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
                <p className="text-xs text-ink-dim">€0.00 available · Refer friends to earn</p>
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
                <button onClick={() => navigator.clipboard?.writeText(referralLink)} className="shrink-0 px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-bold hover:opacity-90">Copy</button>
              </div>
              <button className="w-full flex items-center justify-center gap-2 py-3 border border-border-dim rounded-xl text-sm font-bold hover:bg-canvas transition-colors">
                <Share2 className="w-4 h-4" /> Share with friends
              </button>
              <div className="space-y-3 pt-1">
                {[
                  { icon: Share2,       text: 'Refer a friend', sub: 'Earn €10 when they complete their first booking' },
                  { icon: Star,         text: 'Leave a review', sub: 'Earn €2 after each completed booking review' },
                  { icon: CheckCircle2, text: 'Complete a job', sub: 'Earn €5 loyalty credit on your 5th booking' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-canvas rounded-xl flex items-center justify-center shrink-0"><item.icon className="w-4 h-4 text-ink-sub" /></div>
                    <div>
                      <p className="font-bold text-sm">{item.text}</p>
                      <p className="text-xs text-ink-dim">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="bg-white rounded-panel border border-border-dim overflow-hidden shadow-sm">
          <div className="px-5 pt-5 pb-1">
            <p className="text-xs font-bold text-ink-dim uppercase tracking-widest">Settings</p>
          </div>
          {[
            { icon: Shield,   label: 'Saved Addresses',     sub: uniqueAddresses.length > 0 ? `${uniqueAddresses.length} saved` : 'None yet', href: '/account' },
            { icon: User,     label: 'Favourite Pros',      sub: 'Manage bookmarked pros',    href: '/browse' },
            { icon: FileText, label: 'New Service Request', sub: 'Post a job and get quotes', href: '/requests/new' },
          ].map((item, i) => (
            <Link key={i} href={item.href} className="flex items-center gap-4 px-5 py-4 border-t border-border-dim hover:bg-canvas transition-colors">
              <div className="w-9 h-9 bg-canvas rounded-xl flex items-center justify-center shrink-0"><item.icon className="w-4 h-4 text-ink-sub" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-ink-dim">{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
            </Link>
          ))}
        </div>

        {/* Support */}
        <div className="bg-white rounded-panel border border-border-dim overflow-hidden shadow-sm">
          <div className="px-5 pt-5 pb-1">
            <p className="text-xs font-bold text-ink-dim uppercase tracking-widest">Support</p>
          </div>
          {[
            { icon: MessageCircle, label: 'Chat with us',      sub: 'Avg. reply under 1 hour',    href: 'mailto:support@dispatch.com' },
            { icon: Mail,          label: 'Email us',           sub: 'support@dispatch.com',       href: 'mailto:support@dispatch.com' },
            { icon: HelpCircle,    label: 'Help Centre',        sub: 'FAQs and how-to guides',     href: '/account' },
            { icon: LifeBuoy,      label: 'Dispute a booking',  sub: 'Report an issue with a job', href: '/bookings' },
          ].map((item, i) => (
            <Link key={i} href={item.href} className="flex items-center gap-4 px-5 py-4 border-t border-border-dim hover:bg-canvas transition-colors">
              <div className="w-9 h-9 bg-canvas rounded-xl flex items-center justify-center shrink-0"><item.icon className="w-4 h-4 text-ink-sub" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-ink-dim">{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
            </Link>
          ))}
        </div>

        {/* Log out */}
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center justify-center gap-2 py-4 border border-border-dim rounded-panel text-sm font-bold text-ink-sub hover:border-danger-edge hover:text-danger transition-all"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>

      </div>
    </CustomerLayout>
  );
}
