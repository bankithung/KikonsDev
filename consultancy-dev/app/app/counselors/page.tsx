'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, TrendingUp, Trophy, ChevronRight, Search, Mail, User as UserIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

interface Counselor {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  activeEnquiries: number;
  thisMonthConversions: number;
  conversionRate: number;
  avgResponseTime: string; // in hours
  status: 'Available' | 'Offline' | 'Busy';
}

export default function CounselorsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: counselors = [], isLoading } = useQuery<Counselor[]>({
    queryKey: ['counselors', 'analytics'],
    queryFn: apiClient.dashboard.getCounselorAnalytics,
  });

  const filteredCounselors = counselors.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-slate-400">Loading counselor data...</div>
      </div>
    );
  }

  const workloadData = filteredCounselors.map((c: Counselor) => ({
    name: c.name.split(' ')[0],
    enquiries: c.activeEnquiries,
  }));

  const totalEnquiries = counselors.reduce((sum: number, c: Counselor) => sum + c.activeEnquiries, 0);
  const avgConversionRate = counselors.length > 0
    ? (counselors.reduce((sum: number, c: Counselor) => sum + c.conversionRate, 0) / counselors.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-heading tracking-tight">Team Performance</h1>
          <p className="text-slate-500 mt-1 font-body">Track analytics and workload across your counseling team.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search team members..."
            className="pl-10 h-10 border-slate-200 focus:border-teal-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-teal-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active Enquiries</p>
                <h3 className="text-3xl font-bold text-slate-900">{totalEnquiries}</h3>
              </div>
              <div className="p-2 bg-teal-50 rounded-lg">
                <Users className="h-5 w-5 text-teal-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500 italic">
              Current load across all active counselors
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Avg Conversion</p>
                <h3 className="text-3xl font-bold text-slate-900">{avgConversionRate}%</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500 italic">
              Conversion rate tracking for current period
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active Members</p>
                <h3 className="text-3xl font-bold text-slate-900">{counselors.length}</h3>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500 italic">
              Team members currently in rotation
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detail List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Team Members</h2>
          <div className="grid grid-cols-1 gap-4">
            {filteredCounselors.map((counselor: Counselor) => (
              <Card key={counselor.id} className="border-slate-200 hover:border-teal-200 transition-all hover:shadow-md group">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                          {counselor.avatar ? (
                            <img src={counselor.avatar} alt={counselor.name} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${counselor.status === 'Available' ? 'bg-green-500' :
                          counselor.status === 'Busy' ? 'bg-yellow-500' : 'bg-slate-300'
                          }`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors uppercase text-sm tracking-wide">
                          {counselor.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <Mail className="h-3 w-3" />
                          {counselor.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 md:gap-8 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100 flex-wrap sm:flex-nowrap">
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Enquiries</p>
                        <p className="text-xs font-bold text-slate-700">{counselor.activeEnquiries}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Conv. Rate</p>
                        <p className="text-xs font-bold text-teal-600">{counselor.conversionRate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Avg Response</p>
                        <p className="text-xs font-bold text-slate-700">{counselor.avgResponseTime}h</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">This Mo.</p>
                        <p className="text-xs font-bold text-blue-600">{counselor.thisMonthConversions}</p>
                      </div>
                      <div className="text-center min-w-[60px]">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Status</p>
                        <p className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${counselor.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                          }`}>{counselor.status}</p>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" className="hidden sm:flex group-hover:bg-teal-50 text-slate-400 group-hover:text-teal-600" asChild>
                      <Link href={`/app/counselors/${counselor.id}`}>
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredCounselors.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <Search className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No team members found matching your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Enquiry Load</h2>
          <Card className="border-slate-200 shadow-sm sticky top-6">
            <CardContent className="p-6">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workloadData} layout="vertical" margin={{ left: -10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} width={80} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelClassName="font-bold text-slate-900 border-b border-slate-100 mb-2 pb-1"
                    />
                    <Bar dataKey="enquiries" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-teal-600" />
                  Performance Insights
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Peak Performance</span>
                    <span className="font-bold text-slate-900">
                      {counselors.length > 0
                        ? [...counselors].sort((a, b) => b.conversionRate - a.conversionRate)[0].name
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Wait Time (Avg)</span>
                    <span className="font-bold text-slate-900">
                      {(counselors.reduce((sum, c) => sum + parseFloat(c.avgResponseTime), 0) / (counselors.length || 1)).toFixed(1)} Hours
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Top Growth</span>
                    <span className="font-bold text-teal-600">
                      {counselors.reduce((max, c) => Math.max(max, c.thisMonthConversions), 0)} Conv.
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
