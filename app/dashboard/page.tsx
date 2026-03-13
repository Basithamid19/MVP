'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Star,
  Loader2,
  LayoutDashboard,
  Search,
  Settings,
  LogOut,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role === 'ADMIN') {
        router.push('/admin/dashboard');
        return;
      }
      if (role === 'PROVIDER') {
        router.push('/provider/dashboard');
        return;
      }
      const fetchData = async () => {
        try {
          const [reqRes, bookRes] = await Promise.all([
            fetch('/api/requests'),
            fetch('/api/bookings')
          ]);
          const reqData = await reqRes.json();
          const bookData = await bookRes.json();
          setRequests(Array.isArray(reqData) ? reqData : []);
          setBookings(Array.isArray(bookData) ? bookData : []);
        } catch (error) {
          console.error('Failed to fetch dashboard data', error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [status, router]);

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const role = (session?.user as any)?.role;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <span className="font-bold text-xl tracking-tight hidden lg:block">VilniusPro</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-8">
          <Link href="/dashboard" className="flex items-center gap-3 p-3 bg-black text-white rounded-2xl font-bold">
            <LayoutDashboard className="w-5 h-5" />
            <span className="hidden lg:block">Dashboard</span>
          </Link>
          <Link href="/browse" className="flex items-center gap-3 p-3 text-gray-400 hover:text-black hover:bg-gray-50 rounded-2xl font-bold transition-all">
            <Search className="w-5 h-5" />
            <span className="hidden lg:block">Find Pros</span>
          </Link>
          <Link href="/messages" className="flex items-center gap-3 p-3 text-gray-400 hover:text-black hover:bg-gray-50 rounded-2xl font-bold transition-all">
            <MessageSquare className="w-5 h-5" />
            <span className="hidden lg:block">Messages</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl font-bold transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Sveiki, {session?.user?.name?.split(' ')[0]}!</h1>
              <p className="text-gray-500">Manage your {role === 'PROVIDER' ? 'business' : 'home services'} from one place.</p>
            </div>
            {role === 'CUSTOMER' && (
              <Link href="/browse" className="bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all">
                New Request
              </Link>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Active Bookings */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Upcoming Bookings</h2>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{bookings.filter(b => b.status === 'SCHEDULED').length} Active</span>
                </div>
                
                <div className="space-y-4">
                  {bookings.filter(b => b.status === 'SCHEDULED').length > 0 ? (
                    bookings.filter(b => b.status === 'SCHEDULED').map((booking) => (
                      <div key={booking.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-black transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                            <img src={role === 'PROVIDER' ? booking.customer.user.image : booking.provider.user.image || `https://i.pravatar.cc/150?u=${booking.id}`} alt="User" />
                          </div>
                          <div>
                            <div className="font-bold text-lg mb-1">{role === 'PROVIDER' ? booking.customer.user.name : booking.provider.user.name}</div>
                            <div className="flex items-center gap-4 text-sm text-gray-400 font-medium">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(booking.scheduledAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold mb-1">€{booking.totalAmount.toFixed(2)}</div>
                          <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">Scheduled</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-12 rounded-[32px] border border-dashed border-gray-200 text-center">
                      <p className="text-gray-400 font-medium">No upcoming bookings.</p>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Recent Requests</h2>
                  <Link href="/requests" className="text-xs font-bold text-black border-b border-black pb-0.5">View all</Link>
                </div>
                <div className="space-y-4">
                  {requests.map((req) => (
                    <div key={req.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                              {req.category.name}
                            </span>
                            {req.isUrgent && (
                              <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                                Urgent
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-lg mb-1">{req.description}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                            <MapPin className="w-4 h-4" />
                            {req.address}
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest ${
                          req.status === 'QUOTED' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
                        }`}>
                          {req.status}
                        </div>
                      </div>
                      
                      {req.quotes.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {req.quotes.slice(0, 3).map((q: any, i: number) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />
                              ))}
                            </div>
                            <span className="text-sm font-bold text-black">{req.quotes.length} quotes received</span>
                          </div>
                          <Link href={`/requests/${req.id}`} className="flex items-center gap-1 text-sm font-bold text-black hover:gap-2 transition-all">
                            Review Quotes <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-8">
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-6">Your Stats</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400 font-medium">Completed Jobs</div>
                    <div className="text-xl font-bold">12</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400 font-medium">Average Rating</div>
                    <div className="flex items-center gap-1 text-xl font-bold">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      4.9
                    </div>
                  </div>
                  {role === 'PROVIDER' && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400 font-medium">Total Earnings</div>
                      <div className="text-xl font-bold">€1,240.00</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-black text-white p-8 rounded-[40px] shadow-2xl">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Verification Status</h3>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                  {role === 'PROVIDER' 
                    ? "You are currently Tier 1 verified. Upload trade certificates to reach Tier 2."
                    : "Your account is secure. We verify all professionals for your safety."}
                </p>
                <button className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all">
                  {role === 'PROVIDER' ? 'Upgrade Tier' : 'Learn More'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
