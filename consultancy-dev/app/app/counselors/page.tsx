'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, AlertTriangle, Trophy, Eye, ChevronRight } from 'lucide-react';
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
  status: 'Available' | 'Busy' | 'Offline';
}

export default function CounselorsPage() {
  const { data: counselors = [], isLoading } = useQuery<Counselor[]>({
    queryKey: ['counselors', 'analytics'],
    queryFn: apiClient.dashboard.getCounselorAnalytics,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Loading counselor analytics...</div>
      </div>
    );
  }

  const workloadData = counselors.map((c: Counselor) => ({
    name: c.name.split(' ')[0],
    enquiries: c.activeEnquiries,
  }));

  const totalEnquiries = counselors.reduce((sum: number, c: Counselor) => sum + c.activeEnquiries, 0);
  const avgConversionRate = counselors.length > 0
    ? (counselors.reduce((sum: number, c: Counselor) => sum + c.conversionRate, 0) / counselors.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Counselor Management</h1>
        <p className="text-sm text-slate-600 mt-1 font-body">Monitor team performance and workload distribution</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 font-body">Total Active Enquiries</p>
                <h3 className="text-3xl font-bold text-slate-900 font-heading">{totalEnquiries}</h3>
              </div>
              <Users className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 font-body">Avg. Conversion Rate</p>
                <h3 className="text-3xl font-bold text-slate-900 font-heading">{avgConversionRate}%</h3>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 font-body">Team Members</p>
                <h3 className="text-3xl font-bold text-slate-900 font-heading">{counselors.length}</h3>
              </div>
              <Trophy className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workload Chart */}
      <Card className="border-slate-200">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-slate-100">
          <CardTitle className="text-lg font-semibold font-heading">Workload Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                  formatter={(value: any) => [`${value} enquiries`, '']}
                />
                <Bar dataKey="enquiries" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Counselor Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {counselors.map((counselor: Counselor) => (
          <Card key={counselor.id} className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <img src={counselor.avatar} alt={counselor.name} className="w-14 h-14 rounded-full ring-2 ring-slate-100" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 font-heading">{counselor.name}</h3>
                  <p className="text-sm text-slate-500 font-body">{counselor.email}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-2 ${counselor.status === 'Available' ? 'bg-green-100 text-green-700' :
                    counselor.status === 'Busy' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                    {counselor.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 font-body">Active Enquiries</span>
                  <span className="text-lg font-bold text-slate-900 font-heading">{counselor.activeEnquiries}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 font-body">This Month</span>
                  <span className="text-sm font-semibold text-green-600 font-body">{counselor.thisMonthConversions} conversions</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 font-body">Conversion Rate</span>
                  <span className="text-sm font-semibold text-teal-600 font-body">{counselor.conversionRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 font-body">Avg Response</span>
                  <span className="text-sm font-semibold text-slate-900 font-body">{counselor.avgResponseTime}h</span>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-6 h-10 font-body" asChild>
                <Link href={`/app/counselors/${counselor.id}`}>
                  View Details <ChevronRight size={16} className="ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
