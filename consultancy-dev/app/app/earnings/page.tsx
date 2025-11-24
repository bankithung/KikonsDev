'use client';

import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Users, Calendar, ArrowUpRight, ArrowDownRight, Building, CreditCard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { cn } from '@/lib/utils';

export default function EarningsPage() {
  const { user } = useAuthStore();
  const isDevAdmin = user?.role === 'DEV_ADMIN';
  return isDevAdmin ? <DevAdminEarnings /> : <CompanyAdminEarnings />;
}

// Dev Admin View - Subscription Revenue
function DevAdminEarnings() {
  const { data: earningsData, isLoading } = useQuery({
    queryKey: ['earnings-subscriptions'],
    queryFn: () => apiClient.earnings.subscriptions(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Loading earnings data...</div>
      </div>
    );
  }

  const totalRevenue = earningsData?.subscriptionsByPlan?.reduce((sum: number, plan: any) => sum + plan.revenue, 0) || 0;
  const totalSubscriptions = earningsData?.subscriptionsByPlan?.reduce((sum: number, p: any) => sum + p.value, 0) || 0;

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Platform Earnings</h1>
        <p className="text-sm text-slate-600 mt-1 font-body">Subscription revenue from all companies</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-gradient-to-br from-teal-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1 font-body">Monthly Revenue</p>
                <h3 className="text-3xl font-bold text-slate-900 font-heading">₹{(totalRevenue / 1000).toFixed(0)}K</h3>
              </div>
              <div className="bg-teal-100 p-3 rounded-xl">
                <DollarSign size={24} className="text-teal-600" />
              </div>
            </div>
            <div className="flex items-center text-xs font-body">
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <ArrowUpRight size={14} /> +{earningsData?.currentMonth?.growthRate || 0}%
              </span>
              <span className="text-slate-400 ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1 font-body">Active Companies</p>
                <h3 className="text-3xl font-bold text-slate-900 font-heading">{earningsData?.currentMonth?.activeCompanies || 0}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Building size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="flex items-center text-xs font-body">
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <ArrowUpRight size={14} /> +{earningsData?.currentMonth?.newSignups || 0} new
              </span>
              <span className="text-slate-400 ml-2">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1 font-body">Total Subscriptions</p>
                <h3 className="text-3xl font-bold text-slate-900 font-heading">{totalSubscriptions}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <CreditCard size={24} className="text-purple-600" />
              </div>
            </div>
            <div className="flex items-center text-xs font-body">
              <span className="text-slate-600">Across all plans</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1 font-body">Churn Rate</p>
                <h3 className="text-3xl font-bold text-slate-900 font-heading">{earningsData?.currentMonth?.churnRate || 0}%</h3>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <TrendingUp size={24} className="text-orange-600" />
              </div>
            </div>
            <div className="flex items-center text-xs font-body">
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <ArrowDownRight size={14} /> {earningsData?.currentMonth?.churnImprovement || 0}%
              </span>
              <span className="text-slate-400 ml-2">improvement</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-slate-100">
            <CardTitle className="text-lg font-semibold font-heading">Subscription Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningsData?.monthlyRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}K`} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }} formatter={(value: any) => [`₹${value.toLocaleString()}`, '']} />
                  <Legend />
                  <Bar dataKey="basic" fill="#0d9488" stackId="a" radius={[0, 0, 0, 0]} name="Small Plan" />
                  <Bar dataKey="medium" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} name="Medium Plan" />
                  <Bar dataKey="large" fill="#8b5cf6" stackId="a" radius={[4, 4, 0, 0]} name="Large Plan" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-slate-100">
            <CardTitle className="text-lg font-semibold font-heading">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px] flex flex-col justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={earningsData?.subscriptionsByPlan || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {(earningsData?.subscriptionsByPlan || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} companies`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2 font-body">
                {earningsData?.subscriptionsByPlan?.map((plan: any) => (
                  <div key={plan.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }}></div>
                      <span className="text-slate-600">{plan.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-900">{plan.value}</span>
                      <span className="text-slate-400 ml-1">({totalSubscriptions > 0 ? ((plan.value / totalSubscriptions) * 100).toFixed(0) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Company Admin View - Business Revenue
function CompanyAdminEarnings() {
  const { data: earningsData, isLoading } = useQuery({
    queryKey: ['earnings-business'],
    queryFn: () => apiClient.earnings.business(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Loading earnings data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Earnings & Statistics</h1>
        <p className="text-sm text-slate-600 mt-1 font-body">Comprehensive financial overview and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-gradient-to-br from-teal-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1 font-body">Total Revenue</p>
                <h3 className="text-3xl font-bold text-slate-900 font-heading">₹{((earningsData?.currentMonth?.revenue || 0) / 1000).toFixed(0)}K</h3>
              </div>
              <div className="bg-teal-100 p-3 rounded-xl">
                <DollarSign size={24} className="text-teal-600" />
              </div>
            </div>
            <div className="flex items-center text-xs font-body">
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <ArrowUpRight size={14} /> +{earningsData?.currentMonth?.revenueGrowth || 0}%
              </span>
              <span className="text-slate-400 ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1 font-body">Net Profit</p>
                <h3 className="text-3xl font-bold text-slate-900 font-heading">₹{((earningsData?.currentMonth?.profit || 0) / 1000).toFixed(0)}K</h3>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <TrendingUp size={24} className="text-green-600" />
              </div>
            </div>
            <div className="flex items-center text-xs font-body">
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <ArrowUpRight size={14} /> +{earningsData?.currentMonth?.profitGrowth || 0}%
              </span>
              <span className="text-slate-400 ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1 font-body">Active Students</p>
                <h3 className="text-3xl font-bold text-slate-900 font-heading">{earningsData?.currentMonth?.registrations || 0}</h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <Users size={24} className="text-purple-600" />
              </div>
            </div>
            <div className="flex items-center text-xs font-body">
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <ArrowUpRight size={14} /> +{earningsData?.currentMonth?.studentGrowth || 0}%
              </span>
              <span className="text-slate-400 ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1 font-body">Avg. Deal Size</p>
                <h3 className="text-3xl font-bold text-slate-900 font-heading">₹{earningsData?.currentMonth?.avgDealSize || 0}</h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Calendar size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="flex items-center text-xs font-body">
              <span className={cn("font-semibold flex items-center gap-1", (earningsData?.currentMonth?.dealSizeChange || 0) >= 0 ? "text-green-600" : "text-red-600")}>
                {(earningsData?.currentMonth?.dealSizeChange || 0) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(earningsData?.currentMonth?.dealSizeChange || 0)}%
              </span>
              <span className="text-slate-400 ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-slate-100">
            <CardTitle className="text-lg font-semibold font-heading">Revenue vs Profit Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsData?.monthlyEarnings || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}K`} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }} formatter={(value: any) => [`₹${value.toLocaleString()}`, '']} />
                  <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" name="Profit" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-slate-100">
            <CardTitle className="text-lg font-semibold font-heading">Revenue Sources</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[320px] flex flex-col justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={earningsData?.revenueBySource || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {(earningsData?.revenueBySource || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2 font-body">
                {earningsData?.revenueBySource?.map((source: any) => (
                  <div key={source.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }}></div>
                      <span className="text-slate-600">{source.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">₹{(source.value / 1000).toFixed(0)}K</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
