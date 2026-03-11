'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  FileCheck, 
  BarChart3, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  Briefcase,
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const data = [
  { name: 'Mon', requests: 40, bookings: 24 },
  { name: 'Tue', requests: 30, bookings: 13 },
  { name: 'Wed', requests: 20, bookings: 98 },
  { name: 'Thu', requests: 27, bookings: 39 },
  { name: 'Fri', requests: 18, bookings: 48 },
  { name: 'Sat', requests: 23, bookings: 38 },
  { name: 'Sun', requests: 34, bookings: 43 },
];

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await fetch('/api/admin');
        const data = await res.json();
        setAdminData(data);
      } catch (error) {
        console.error('Failed to fetch admin data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleVerification = async (id: string, status: string, tier: string) => {
    try {
      await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId: id, status, tier }),
      });
      // Refresh data
      const res = await fetch('/api/admin');
      setAdminData(await res.json());
    } catch (error) {
      console.error('Failed to update verification', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Admin Command Center</h1>
            <p className="text-gray-500 font-medium">Monitoring VilniusPro marketplace health and safety.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold">System Online</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Requests', value: adminData.stats.totalRequests, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active Bookings', value: adminData.stats.totalBookings, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Completed Jobs', value: adminData.stats.completedBookings, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Total Providers', value: adminData.stats.totalProviders, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-3xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Verifications */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Pending Verifications</h2>
                <span className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-full">
                  {adminData.pendingVerifications.length} Action Required
                </span>
              </div>

              <div className="space-y-4">
                {adminData.pendingVerifications.length > 0 ? (
                  adminData.pendingVerifications.map((v: any) => (
                    <div key={v.id} className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl overflow-hidden">
                          <img src={v.provider.user.image || `https://i.pravatar.cc/150?u=${v.id}`} alt="User" />
                        </div>
                        <div>
                          <div className="font-bold">{v.provider.user.name}</div>
                          <div className="text-xs text-gray-400 font-medium">Document: {v.docType}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleVerification(v.id, 'APPROVED', 'TIER1_ID_VERIFIED')}
                          className="p-3 bg-green-100 text-green-600 rounded-2xl hover:bg-green-200 transition-colors"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleVerification(v.id, 'REJECTED', '')}
                          className="p-3 bg-red-100 text-red-600 rounded-2xl hover:bg-red-200 transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <a href={v.docUrl} target="_blank" className="p-3 bg-white text-gray-400 rounded-2xl border border-gray-100 hover:text-black transition-colors">
                          <ArrowUpRight className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileCheck className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 font-medium">All caught up! No pending verifications.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Analytics Chart */}
            <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Marketplace Activity</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-black rounded-full" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Requests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-200 rounded-full" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bookings</span>
                  </div>
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fontWeight: 600, fill: '#9ca3af' }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="requests" fill="#000" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="bookings" fill="#e5e7eb" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* Sidebar - Quick Actions & Alerts */}
          <div className="space-y-8">
            <section className="bg-black text-white p-8 rounded-[40px] shadow-2xl">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Growth Insights</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">Requests are up 24% this week in the &quot;Plumber&quot; category. Consider onboarding more pros in Antakalnis.</p>
              <button className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all">
                View Category Report
              </button>
            </section>

            <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <h3 className="font-bold text-lg mb-6">Recent Reports</h3>
              <div className="space-y-6">
                {[
                  { user: 'Asta A.', issue: 'Late arrival', time: '2h ago' },
                  { user: 'Marius S.', issue: 'Payment dispute', time: '5h ago' },
                ].map((report, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{report.user}</div>
                      <div className="text-xs text-gray-400 mb-1">{report.issue}</div>
                      <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{report.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 text-sm font-bold text-black border-b border-black pb-1 hover:opacity-70 transition-opacity">
                View All Tickets
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
