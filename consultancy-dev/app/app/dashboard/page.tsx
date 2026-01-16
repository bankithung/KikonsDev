'use client';

import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    MessageSquare,
    UserPlus,
    GraduationCap,
    CreditCard,
    FileText,
    Plus,
    Upload,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    TrendingUp,
    Clock,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: apiClient.dashboard.getStats,
    });

    const { data: activity, isLoading: activityLoading } = useQuery({
        queryKey: ['dashboard-activity'],
        queryFn: apiClient.dashboard.getActivity,
    });

    const [weeklyFilter, setWeeklyFilter] = useState<'7days' | '30days' | 'month'>('7days');

    const { data: weeklyData = [] } = useQuery({
        queryKey: ['dashboard-weekly', weeklyFilter],
        queryFn: () => apiClient.dashboard.getWeeklyData(weeklyFilter),
    });

    const [revenueFilter, setRevenueFilter] = useState<'days' | 'weeks' | 'months' | 'years'>('months');

    const { data: revenueData = [] } = useQuery({
        queryKey: ['dashboard-revenue', revenueFilter],
        queryFn: () => apiClient.dashboard.getRevenueData(revenueFilter),
    });

    const { data: recentEnquiries = [] } = useQuery({
        queryKey: ['dashboard-recent-enquiries'],
        queryFn: apiClient.dashboard.getRecentEnquiries,
    });

    const { data: upcomingTasks = [] } = useQuery({
        queryKey: ['dashboard-upcoming-tasks'],
        queryFn: async () => {
            // Fetch from follow-ups or tasks endpoint
            const tasks = await apiClient.followUps.list();
            return tasks.filter((t: any) => t.status === 'Pending').slice(0, 3).map((t: any) => ({
                id: t.id,
                task: `Follow up with ${t.studentName}`,
                due: new Date(t.scheduledFor) > new Date() ? 'Today' : 'Overdue',
                priority: t.priority
            }));
        },
    });

    // Action Items Counts
    const { data: payments = [] } = useQuery({
        queryKey: ['dashboard-pending-payments'],
        queryFn: apiClient.payments.list,
    });

    const { data: documentTransfers = [] } = useQuery({
        queryKey: ['dashboard-doc-transfers'],
        queryFn: apiClient.documents.list,
    });

    const { data: followUps = [] } = useQuery({
        queryKey: ['dashboard-follow-ups'],
        queryFn: apiClient.followUps.list,
    });

    const pendingPaymentsCount = payments.filter((p: any) => p.status === 'Pending').length;
    const pendingDocTransfersCount = documentTransfers.filter((d: any) => d.status === 'Pending' || d.status === 'Out').length;
    const pendingFollowUpsCount = followUps.filter((f: any) => f.status === 'Pending').length;

    if (statsLoading) {
        return <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-slate-500">Loading dashboard...</div></div>;
    }

    // Calculate conversion rate from stats
    const conversionRate = stats?.enquiries?.value && stats?.registrations?.value
        ? Math.round((stats.registrations.value / stats.enquiries.value) * 100)
        : 0;

    return (
        <div className="space-y-2">
            {/* Header - Compact */}
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
                <div className="flex gap-2">
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 h-8 text-xs px-3" asChild>
                        <Link href="/app/enquiries/new">
                            <Plus size={14} className="mr-1.5" /> New Enquiry
                        </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs px-3" asChild>
                        <Link href="/app/registrations/new">
                            <UserPlus size={14} className="mr-1.5" /> Register
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Grid - Fully Responsive */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatsCard
                    title="Total Enquiries"
                    value={stats?.enquiries?.value || 0}
                    icon={MessageSquare}
                    trend={`${(stats?.enquiries?.trend || 0) > 0 ? '+' : ''}${stats?.enquiries?.trend || 0}%`}
                    trendUp={(stats?.enquiries?.trend || 0) >= 0}
                    subtitle="This month"
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                />
                <StatsCard
                    title="Registrations"
                    value={stats?.registrations?.value || 0}
                    icon={UserPlus}
                    trend={`${(stats?.registrations?.trend || 0) > 0 ? '+' : ''}${stats?.registrations?.trend || 0}%`}
                    trendUp={(stats?.registrations?.trend || 0) >= 0}
                    subtitle="Active students"
                    iconBg="bg-green-50"
                    iconColor="text-green-600"
                />
                <StatsCard
                    title="Enrollments"
                    value={stats?.enrollments?.value || 0}
                    icon={GraduationCap}
                    trend={`${(stats?.enrollments?.trend || 0) > 0 ? '+' : ''}${stats?.enrollments?.trend || 0}%`}
                    trendUp={(stats?.enrollments?.trend || 0) >= 0}
                    subtitle="Programs active"
                    iconBg="bg-purple-50"
                    iconColor="text-purple-600"
                />
                <StatsCard
                    title="Total Earnings"
                    value={`₹${(stats?.totalEarnings?.value || 0).toLocaleString()}`}
                    icon={CreditCard}
                    trend={`${(stats?.totalEarnings?.trend || 0) > 0 ? '+' : ''}${stats?.totalEarnings?.trend || 0}%`}
                    trendUp={(stats?.totalEarnings?.trend || 0) >= 0}
                    subtitle="Revenue (Net)"
                    iconBg="bg-yellow-50"
                    iconColor="text-yellow-600"
                />
            </div>

            {/* Main Content Grid - Responsive 2 Column -> 1 Column on Mobile */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: Charts (Takes 2 columns on desktop) */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Weekly Activity Chart */}
                    <Card className="border-slate-200">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <CardTitle className="text-lg font-semibold text-slate-900">Weekly Overview</CardTitle>
                                {/* Animated Filter Toggle */}
                                <div className="flex items-center bg-slate-100 rounded-full p-1 gap-0.5">
                                    {[
                                        { key: '7days', label: '7 Days' },
                                        { key: '30days', label: '30 Days' },
                                        { key: 'month', label: 'This Month' }
                                    ].map((item) => (
                                        <button
                                            key={item.key}
                                            onClick={() => setWeeklyFilter(item.key as '7days' | '30days' | 'month')}
                                            className={cn(
                                                "px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-300 whitespace-nowrap",
                                                weeklyFilter === item.key
                                                    ? "bg-white text-teal-700 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[280px] sm:h-[320px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weeklyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="name"
                                            tickLine={false}
                                            axisLine={false}
                                            fontSize={12}
                                            stroke="#64748b"
                                            tick={{ fill: '#64748b' }}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            fontSize={12}
                                            stroke="#64748b"
                                            tick={{ fill: '#64748b' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                borderColor: '#e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Bar dataKey="enquiries" fill="#0d9488" radius={[4, 4, 0, 0]} name="Enquiries" />
                                        <Bar dataKey="registrations" fill="#10b981" radius={[4, 4, 0, 0]} name="Registrations" />
                                        <Bar dataKey="enrollments" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Enrollments" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Revenue Trend */}
                    <Card className="border-slate-200">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <CardTitle className="text-lg font-semibold text-slate-900">Revenue Trend</CardTitle>
                                {/* Animated Filter Toggle */}
                                <div className="flex items-center bg-slate-100 rounded-full p-1 gap-0.5">
                                    {(['days', 'weeks', 'months', 'years'] as const).map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setRevenueFilter(filter)}
                                            className={cn(
                                                "px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-300 capitalize",
                                                revenueFilter === filter
                                                    ? "bg-white text-teal-700 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[240px] sm:h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="label"
                                            tickLine={false}
                                            axisLine={false}
                                            fontSize={12}
                                            tick={{ fill: '#64748b' }}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            fontSize={12}
                                            tick={{ fill: '#64748b' }}
                                            tickFormatter={(value) => `₹${value / 1000}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                borderColor: '#e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}
                                            formatter={(value: any) => [`₹${value}`, 'Revenue']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#0d9488"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Sidebar: Activity & Actions */}
                <div className="space-y-6">
                    {/* Recent Activity */}
                    <Card className="border-slate-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {activity?.map((item: any) => (
                                    <div key={item.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                        <div className="bg-teal-50 p-2 rounded-lg text-teal-600 shrink-0">
                                            <Activity size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                {item.text}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {item.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {!activity?.length && (
                                    <p className="text-sm text-slate-500 text-center py-8">No recent activity</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending Actions */}
                    <Card className="border-slate-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-semibold text-slate-900">Action Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <Link href="/app/payments" className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg">
                                            <CreditCard size={18} className="text-yellow-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-yellow-900">Verify Payments</p>
                                            <p className="text-xs text-yellow-700">{pendingPaymentsCount} pending verification{pendingPaymentsCount !== 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight size={16} className="text-yellow-600" />
                                </Link>

                                <Link href="/app/documents" className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg">
                                            <FileText size={18} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-purple-900">Doc Transfers</p>
                                            <p className="text-xs text-purple-700">{pendingDocTransfersCount} awaiting approval</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight size={16} className="text-purple-600" />
                                </Link>

                                <Link href="/app/follow-ups" className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg">
                                            <MessageSquare size={18} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-blue-900">Follow-ups</p>
                                            <p className="text-xs text-blue-700">{pendingFollowUpsCount} lead{pendingFollowUpsCount !== 1 ? 's' : ''} need attention</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight size={16} className="text-blue-600" />
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bottom Section: Quick Links / Recent Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                <Card className="border-slate-200 flex flex-col h-full">
                    <CardHeader className="pb-4 shrink-0">
                        <CardTitle className="text-lg font-semibold text-slate-900">Recent Enquiries</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                            {recentEnquiries.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">No recent enquiries</p>
                            ) : (
                                recentEnquiries.map((enq: any, i: number) => (
                                    <Link key={enq.id || i} href={enq.enrollmentId ? `/app/student-profile/enrollment/${enq.enrollmentId}` : `/app/enquiries/${enq.id}`} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm">
                                                {enq.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{enq.name}</p>
                                                <p className="text-xs text-slate-500">{enq.course} • {enq.time}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${enq.status === 'New' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                                            {enq.status}
                                        </span>
                                    </Link>
                                ))
                            )}
                        </div>
                        <Button variant="ghost" className="w-full mt-auto pt-4 text-teal-600 hover:text-teal-700 hover:bg-teal-50 font-medium" asChild>
                            <Link href="/app/enquiries">View All Enquiries</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 flex flex-col h-full">
                    <CardHeader className="pb-4 shrink-0">
                        <CardTitle className="text-lg font-semibold text-slate-900">Upcoming Tasks</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                            {upcomingTasks.length > 0 ? upcomingTasks.map((task: any, i: number) => (
                                <Link key={task.id || i} href="/app/tasks" className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("h-2 w-2 rounded-full",
                                            task.priority === 'High' ? 'bg-red-500' :
                                                task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                                        )}></div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{task.task}</p>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Clock size={12} /> {task.due}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <p className="text-sm text-slate-500 text-center py-4">No upcoming tasks</p>
                            )}
                        </div>
                        <Button variant="ghost" className="w-full mt-auto pt-4 text-teal-600 hover:text-teal-700 hover:bg-teal-50 font-medium" asChild>
                            <Link href="/app/tasks">View All Tasks</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, trend, trendUp, warning, subtitle, iconBg, iconColor }: any) {
    return (
        <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
                        <h3 className="text-3xl font-bold text-slate-900 mb-1">{value}</h3>
                        <p className="text-xs text-slate-500">{subtitle}</p>
                    </div>
                    <div className={cn("p-3 rounded-xl shrink-0", iconBg)}>
                        <Icon size={24} className={iconColor} />
                    </div>
                </div>
                <div className="mt-4 flex items-center text-xs border-t border-slate-100 pt-4">
                    {warning ? (
                        <span className="text-yellow-600 font-semibold flex items-center gap-1">
                            <AlertCircle size={14} />
                            {trend}
                        </span>
                    ) : (
                        <span className={cn("font-semibold flex items-center gap-1", trendUp ? "text-green-600" : "text-red-600")}>
                            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {trend}
                        </span>
                    )}
                    <span className="text-slate-400 ml-2">vs last month</span>
                </div>
            </CardContent>
        </Card>
    )
}
