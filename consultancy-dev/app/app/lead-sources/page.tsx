'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, Users, Target, Plus, Edit, Trash2 } from 'lucide-react';

interface LeadSource {
  id: string;
  name: string;
  type: string;
  totalLeads: number;
  conversions: number;
  conversionRate: number;
  cost: number;
  roi: number;
}

export default function LeadSourcesPage() {
  const queryClient = useQueryClient();

  const { data: leadSources = [], isLoading } = useQuery<LeadSource[]>({
    queryKey: ['leadSources'],
    queryFn: apiClient.leadSources.list,
  });

  const deleteLeadSourceMutation = useMutation({
    mutationFn: apiClient.leadSources.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadSources'] });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this lead source?')) {
      deleteLeadSourceMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Loading lead sources...</div>
      </div>
    );
  }

  const pieData = leadSources.map((s: LeadSource) => ({ name: s.name, value: s.totalLeads }));
  const COLORS = ['#0d9488', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  const barData = leadSources.map((s: LeadSource) => ({ name: s.name, rate: s.conversionRate }));

  const totalLeads = leadSources.reduce((sum: number, s: LeadSource) => sum + s.totalLeads, 0);
  const avgConversion = leadSources.length > 0
    ? (leadSources.reduce((sum: number, s: LeadSource) => sum + s.conversionRate, 0) / leadSources.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Lead Source Tracking</h1>
          <p className="text-sm text-slate-600 mt-1 font-body">Analyze where your best students come from</p>
        </div>
        <Button className="h-9 bg-teal-600 hover:bg-teal-700 font-body">
          <Plus className="mr-2 h-4 w-4" /> Add Source
        </Button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-gradient-to-br from-teal-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 font-body">Total Leads</p>
                <h3 className="text-3xl font-bold text-slate-900 font-heading">{totalLeads}</h3>
              </div>
              <Users className="h-10 w-10 text-teal-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 font-body">Avg. Conversion</p>
                <h3 className="text-3xl font-bold text-slate-900 font-heading">{avgConversion}%</h3>
              </div>
              <Target className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 font-body">Best Source</p>
                <h3 className="text-lg font-bold text-slate-900 font-heading">Referrals</h3>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-slate-100">
            <CardTitle className="text-lg font-heading">Lead Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-slate-100">
            <CardTitle className="text-lg font-heading">Conversion Rates</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(value: any) => [`${value}%`, 'Conversion']} />
                  <Bar dataKey="rate" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sources Table */}
      <Card className="border-slate-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-slate-100">
          <CardTitle className="text-lg font-heading">All Lead Sources</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase hidden md:table-cell">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Leads</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Conversions</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase hidden lg:table-cell">Cost</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase hidden lg:table-cell">ROI</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {leadSources.map((source: LeadSource) => (
                <tr key={source.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900 font-body">{source.name}</p>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${source.type === 'Paid' ? 'bg-orange-100 text-orange-700' :
                      source.type === 'Organic' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                      {source.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-900 font-body">{source.totalLeads}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-green-600 font-body">{source.conversions}</p>
                    <p className="text-xs text-slate-500 font-body">({source.conversionRate}%)</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700 font-body hidden lg:table-cell">
                    {source.cost > 0 ? `₹${source.cost.toLocaleString()}` : 'Free'}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-teal-600 font-body hidden lg:table-cell">
                    {source.roi > 0 ? `${source.roi}x` : '-'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-teal-50 hover:text-teal-600">
                        <Edit size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(source.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
