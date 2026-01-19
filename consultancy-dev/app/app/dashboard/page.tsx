'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    MessageSquare,
    UserPlus,
    GraduationCap,
    CreditCard,
    FileText,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Clock,
    AlertCircle,
    TrendingUp,
    ChevronRight,
    Users,
    Target,
    Zap,
    Phone,
    Mail,
    Calendar,
    Bell,
    CheckCircle2,
    Circle,
    AlertTriangle,
    Star,
    User,
    Briefcase,
    Wifi
} from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';

// ========================
// ADMIN DASHBOARD
// ========================
function AdminDashboard() {
    const { onlineCount, isConnected } = useOnlineUsers();
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: apiClient.dashboard.getStats,
    });

    const { data: activity } = useQuery({
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
            const tasks = await apiClient.followUps.list();
            return tasks.filter((t: any) => t.status === 'Pending').slice(0, 4).map((t: any) => ({
                id: t.id,
                task: `Follow up with ${t.studentName}`,
                type: t.type,
                due: new Date(t.scheduledFor) > new Date() ? 'Today' : 'Overdue',
                priority: t.priority,
                time: t.scheduledFor
            }));
        },
    });

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

    const { data: approvalRequests = [] } = useQuery({
        queryKey: ['approval-requests'],
        queryFn: apiClient.approvalRequests.list,
    });

    const pendingPaymentsCount = payments.filter((p: any) => p.status === 'Pending').length;
    const pendingDocTransfersCount = documentTransfers.filter((d: any) => d.status === 'Pending' || d.status === 'Out').length;
    const pendingFollowUpsCount = followUps.filter((f: any) => f.status === 'Pending').length;
    const pendingApprovalCount = approvalRequests.filter((r: any) => r.status === 'PENDING').length;

    const conversionRate = stats?.enquiries?.value && stats?.registrations?.value
        ? Math.round((stats.registrations.value / stats.enquiries.value) * 100)
        : 0;

    const pipelineData = [
        { name: 'Enquiries', value: stats?.enquiries?.value || 0, color: '#3b82f6' },
        { name: 'Registered', value: stats?.registrations?.value || 0, color: '#10b981' },
        { name: 'Enrolled', value: stats?.enrollments?.value || 0, color: '#8b5cf6' },
    ];

    if (statsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-500">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <CompactStatCard title="Enquiries" value={stats?.enquiries?.value || 0} icon={MessageSquare} trend={stats?.enquiries?.trend || 0} color="blue" />
                <CompactStatCard title="Registrations" value={stats?.registrations?.value || 0} icon={UserPlus} trend={stats?.registrations?.trend || 0} color="emerald" />
                <CompactStatCard title="Enrollments" value={stats?.enrollments?.value || 0} icon={GraduationCap} trend={stats?.enrollments?.trend || 0} color="purple" />
                <CompactStatCard title="Earnings" value={`₹${((stats?.totalEarnings?.value || 0) / 1000).toFixed(0)}k`} icon={CreditCard} trend={stats?.totalEarnings?.trend || 0} color="amber" />
                {/* Online Employees - Real-time from WebSocket */}
                <Card className="border-slate-200 relative overflow-hidden">
                    <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Online Now</span>
                            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", isConnected ? "bg-green-50" : "bg-slate-50")}>
                                <Wifi size={12} className={isConnected ? "text-green-600" : "text-slate-400"} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-slate-900">{onlineCount}</span>
                            <span className="text-[10px] text-slate-400">employees</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isConnected ? "bg-green-500" : "bg-slate-300")} />
                            <span className="text-[10px] text-slate-500">{isConnected ? 'Live' : 'Connecting...'}</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* Left Column - Charts */}
                <div className="xl:col-span-8 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="lg:col-span-2 border-slate-200">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-slate-800">Weekly Overview</h3>
                                    <div className="flex items-center bg-slate-100 rounded-full p-0.5">
                                        {[{ key: '7days', label: '7D' }, { key: '30days', label: '30D' }, { key: 'month', label: 'MTD' }].map((item) => (
                                            <button key={item.key} onClick={() => setWeeklyFilter(item.key as any)} className={cn("px-2.5 py-1 text-[10px] font-medium rounded-full transition-all", weeklyFilter === item.key ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>{item.label}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="h-[180px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} tick={{ fill: '#64748b' }} />
                                            <YAxis tickLine={false} axisLine={false} fontSize={10} tick={{ fill: '#64748b' }} />
                                            <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }} />
                                            <Bar dataKey="enquiries" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Enquiries" />
                                            <Bar dataKey="registrations" fill="#10b981" radius={[3, 3, 0, 0]} name="Registrations" />
                                            <Bar dataKey="enrollments" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Enrollments" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex items-center justify-center gap-4 mt-2">
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-blue-500" /><span className="text-[10px] text-slate-500">Enquiries</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-emerald-500" /><span className="text-[10px] text-slate-500">Registrations</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-purple-500" /><span className="text-[10px] text-slate-500">Enrollments</span></div>
                                </div>
                            </div>
                        </Card>

                        {/* Quick Actions Card */}
                        <Card className="border-slate-200">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-slate-800">Quick Actions</span>
                                    <Zap size={14} className="text-amber-500" />
                                </div>
                                <div className="space-y-2">
                                    <Link href="/app/enquiries/new" className="flex items-center justify-between p-2.5 rounded-lg border bg-teal-50 border-teal-200 hover:bg-teal-100 transition-colors group">
                                        <div className="flex items-center gap-2.5">
                                            <Plus size={16} className="text-teal-600" />
                                            <span className="text-xs font-medium text-slate-700">New Enquiry</span>
                                        </div>
                                        <ChevronRight size={12} className="text-slate-400 group-hover:text-slate-600" />
                                    </Link>
                                    <Link href="/app/registrations/new" className="flex items-center justify-between p-2.5 rounded-lg border bg-emerald-50 border-emerald-200 hover:bg-emerald-100 transition-colors group">
                                        <div className="flex items-center gap-2.5">
                                            <UserPlus size={16} className="text-emerald-600" />
                                            <span className="text-xs font-medium text-slate-700">Register Student</span>
                                        </div>
                                        <ChevronRight size={12} className="text-slate-400 group-hover:text-slate-600" />
                                    </Link>
                                    <Link href="/app/counselors" className="flex items-center justify-between p-2.5 rounded-lg border bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors group">
                                        <div className="flex items-center gap-2.5">
                                            <Users size={16} className="text-blue-600" />
                                            <span className="text-xs font-medium text-slate-700">Team Members</span>
                                        </div>
                                        <ChevronRight size={12} className="text-slate-400 group-hover:text-slate-600" />
                                    </Link>
                                    <Link href="/app/approval-requests" className="flex items-center justify-between p-2.5 rounded-lg border bg-purple-50 border-purple-200 hover:bg-purple-100 transition-colors group">
                                        <div className="flex items-center gap-2.5">
                                            <CheckCircle2 size={16} className="text-purple-600" />
                                            <span className="text-xs font-medium text-slate-700">Approval Requests</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {pendingApprovalCount > 0 && (
                                                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-purple-600 text-white">{pendingApprovalCount}</span>
                                            )}
                                            <ChevronRight size={12} className="text-slate-400 group-hover:text-slate-600" />
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card className="border-slate-200">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-slate-800">Revenue Trend</h3>
                                    <span className="text-[10px] text-slate-400">Net earnings over time</span>
                                </div>
                                <div className="flex items-center bg-slate-100 rounded-full p-0.5">
                                    {(['days', 'weeks', 'months', 'years'] as const).map((filter) => (
                                        <button key={filter} onClick={() => setRevenueFilter(filter)} className={cn("px-2 py-1 text-[10px] font-medium rounded-full transition-all capitalize", revenueFilter === filter ? "bg-white text-teal-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}>{filter}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-[160px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={10} tick={{ fill: '#64748b' }} />
                                        <YAxis tickLine={false} axisLine={false} fontSize={10} tick={{ fill: '#64748b' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px' }} formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                                        <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card className="border-slate-200">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-slate-800">Recent Enquiries</h3>
                                    <Link href="/app/enquiries" className="text-[10px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5">View all <ChevronRight size={12} /></Link>
                                </div>
                                <div className="space-y-2">
                                    {recentEnquiries.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-6">No recent enquiries</p>
                                    ) : (
                                        recentEnquiries.slice(0, 4).map((enq: any, i: number) => (
                                            <Link key={enq.id || i} href={enq.enrollmentId ? `/app/student-profile/enrollment/${enq.enrollmentId}` : `/app/enquiries/${enq.id}`} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs shrink-0">{enq.name?.charAt(0) || '?'}</div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-slate-800 truncate">{enq.name}</p>
                                                        <p className="text-[10px] text-slate-500 truncate">{enq.course}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium", enq.status === 'New' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700')}>{enq.status}</span>
                                                    <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-500" />
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>
                        </Card>

                        <Card className="border-slate-200">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-slate-800">Upcoming Tasks</h3>
                                    <Link href="/app/tasks" className="text-[10px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5">View all <ChevronRight size={12} /></Link>
                                </div>
                                <div className="space-y-2">
                                    {upcomingTasks.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-6">No upcoming tasks</p>
                                    ) : (
                                        upcomingTasks.slice(0, 4).map((task: any, i: number) => (
                                            <Link key={task.id || i} href="/app/tasks" className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", task.type === 'Call' ? 'bg-blue-50 text-blue-600' : task.type === 'Email' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600')}>
                                                        {task.type === 'Call' ? <Phone size={14} /> : task.type === 'Email' ? <Mail size={14} /> : <MessageSquare size={14} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-slate-800 truncate">{task.task}</p>
                                                        <p className={cn("text-[10px] flex items-center gap-1", task.due === 'Overdue' ? 'text-red-600' : 'text-slate-500')}><Clock size={10} /> {task.due}</p>
                                                    </div>
                                                </div>
                                                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-slate-300')} />
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="xl:col-span-4 space-y-4">
                    <Card className="border-slate-200">
                        <div className="p-4">
                            <h3 className="text-sm font-semibold text-slate-800 mb-3">Action Required</h3>
                            <div className="space-y-2">
                                <ActionItem href="/app/payments" icon={CreditCard} label="Pending Payments" count={pendingPaymentsCount} color="amber" />
                                <ActionItem href="/app/documents" icon={FileText} label="Doc Transfers" count={pendingDocTransfersCount} color="purple" />
                                <ActionItem href="/app/follow-ups" icon={MessageSquare} label="Follow-ups" count={pendingFollowUpsCount} color="blue" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-slate-200">
                        <div className="p-4">
                            <h3 className="text-sm font-semibold text-slate-800 mb-3">Recent Activity</h3>
                            <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar">
                                {activity?.length ? activity.slice(0, 6).map((item: any) => (
                                    <div key={item.id} className="flex items-start gap-2.5 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                        <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shrink-0"><Activity size={12} /></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">{item.text}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{item.time}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-xs text-slate-400 text-center py-4">No recent activity</p>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="border-slate-200 bg-gradient-to-br from-teal-600 to-teal-700">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-white/90">This Month</h3>
                                <Calendar size={14} className="text-white/60" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/10 rounded-lg p-2.5">
                                    <p className="text-[10px] text-white/60 mb-0.5">New Students</p>
                                    <p className="text-lg font-bold text-white">{stats?.registrations?.value || 0}</p>
                                </div>
                                <div className="bg-white/10 rounded-lg p-2.5">
                                    <p className="text-[10px] text-white/60 mb-0.5">Revenue</p>
                                    <p className="text-lg font-bold text-white">₹{((stats?.totalEarnings?.value || 0) / 1000).toFixed(0)}k</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// ========================
// EMPLOYEE DASHBOARD
// ========================
function EmployeeDashboard() {
    const { user } = useAuthStore();
    const userId = user?.id;

    // Fetch employee's enquiries (created by them)
    const { data: allEnquiries = [] } = useQuery({
        queryKey: ['enquiries'],
        queryFn: apiClient.enquiries.list,
    });

    // Fetch employee's registrations
    const { data: allRegistrations = [] } = useQuery({
        queryKey: ['registrations'],
        queryFn: apiClient.registrations.list,
    });

    // Fetch employee's enrollments
    const { data: allEnrollments = [] } = useQuery({
        queryKey: ['enrollments'],
        queryFn: apiClient.enrollments.list,
    });

    // Fetch follow-ups assigned to employee
    const { data: allFollowUps = [] } = useQuery({
        queryKey: ['followUps'],
        queryFn: apiClient.followUps.list,
    });

    // Fetch tasks assigned to employee
    const { data: allTasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: apiClient.tasks.list,
    });

    // Fetch documents held by employee
    const { data: allDocuments = [] } = useQuery({
        queryKey: ['documents'],
        queryFn: apiClient.documents.list,
    });

    // Fetch employee's approval requests
    const { data: myRequests = [] } = useQuery({
        queryKey: ['my-requests'],
        queryFn: apiClient.approvalRequests.myRequests,
    });

    // Filter data for current employee
    const myEnquiries = allEnquiries.filter((e: any) => e.created_by === userId);
    const myRegistrations = allRegistrations.filter((r: any) => r.created_by === userId);
    const myEnrollments = allEnrollments.filter((e: any) => e.created_by === userId);
    const myFollowUps = allFollowUps.filter((f: any) => f.assignedTo === userId);
    const myTasks = allTasks.filter((t: any) => t.assigned_to === userId || t.assignedTo === userId);
    const myDocuments = allDocuments.filter((d: any) => d.current_holder === userId);

    // Calculate stats
    const pendingFollowUps = myFollowUps.filter((f: any) => f.status === 'Pending');
    const overdueFollowUps = pendingFollowUps.filter((f: any) => new Date(f.scheduledFor) < new Date());
    const todayFollowUps = pendingFollowUps.filter((f: any) => isToday(new Date(f.scheduledFor)));
    const pendingTasks = myTasks.filter((t: any) => t.status !== 'Done' && t.status !== 'Completed');
    const thisMonthEnquiries = myEnquiries.filter((e: any) => {
        const date = new Date(e.date || e.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    // Conversion stats
    const convertedEnquiries = myEnquiries.filter((e: any) => e.status === 'Converted').length;
    const conversionRate = myEnquiries.length > 0 ? Math.round((convertedEnquiries / myEnquiries.length) * 100) : 0;

    // Recent students (enquiries + registrations + enrollments)
    const recentStudents = [
        ...myEnquiries.map((e: any) => ({ ...e, _type: 'enquiry', _name: e.candidateName || e.name, _id: e.id })),
        ...myRegistrations.map((r: any) => ({ ...r, _type: 'registration', _name: r.studentName || r.candidateName, _id: r.id })),
        ...myEnrollments.map((e: any) => ({ ...e, _type: 'enrollment', _name: e.studentName || e.candidateName, _id: e.id }))
    ]
        .sort((a: any, b: any) => new Date(b.created_at || b.date || b.registrationDate).getTime() - new Date(a.created_at || a.date || a.registrationDate).getTime())
        .slice(0, 6);

    return (
        <div className="space-y-4">
            {/* Urgent Alerts - Prominent Overdue Follow-ups */}
            {overdueFollowUps.length > 0 && (
                <Card className="border-red-200 bg-gradient-to-r from-red-50 to-red-100 shadow-sm">
                    <Link href="/app/follow-ups" className="block p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                    <AlertTriangle size={24} className="text-red-600 animate-pulse" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-red-800">{overdueFollowUps.length} Overdue Follow-ups!</p>
                                    <p className="text-xs text-red-600">Needs immediate attention - Click to view</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-red-400" />
                        </div>
                    </Link>
                </Card>
            )}

            {/* Today's Follow-ups Alert */}
            {todayFollowUps.length > 0 && overdueFollowUps.length === 0 && (
                <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100">
                    <Link href="/app/follow-ups" className="block p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <Clock size={18} className="text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">{todayFollowUps.length} Follow-ups Today</p>
                                    <p className="text-xs text-amber-600">Scheduled for today</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-amber-400" />
                        </div>
                    </Link>
                </Card>
            )}

            {/* My Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <EmployeeStatCard title="My Enquiries" value={myEnquiries.length} thisMonth={thisMonthEnquiries.length} icon={MessageSquare} color="blue" />
                <EmployeeStatCard title="My Registrations" value={myRegistrations.length} icon={UserPlus} color="emerald" />
                <EmployeeStatCard title="My Enrollments" value={myEnrollments.length} icon={GraduationCap} color="purple" />
                <EmployeeStatCard title="Conversion Rate" value={`${conversionRate}%`} icon={Target} color="teal" />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* Left Column */}
                <div className="xl:col-span-8 space-y-4">
                    {/* Today's Tasks & Follow-ups */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Pending Follow-ups */}
                        <Card className="border-slate-200">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-slate-800">Follow-ups</h3>
                                        <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingFollowUps.length}</span>
                                    </div>
                                    <Link href="/app/follow-ups" className="text-[10px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5">View all <ChevronRight size={12} /></Link>
                                </div>
                                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                                    {pendingFollowUps.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                                            <CheckCircle2 size={24} className="mb-2 text-emerald-500" />
                                            <p className="text-xs">All caught up!</p>
                                        </div>
                                    ) : (
                                        pendingFollowUps.slice(0, 5).map((followUp: any) => {
                                            const isOverdue = isPast(new Date(followUp.scheduledFor));
                                            const isTodays = isToday(new Date(followUp.scheduledFor));
                                            return (
                                                <Link key={followUp.id} href={`/app/follow-ups/${followUp.id}`} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", followUp.type === 'Call' ? 'bg-blue-50 text-blue-600' : followUp.type === 'Email' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600')}>
                                                            {followUp.type === 'Call' ? <Phone size={14} /> : followUp.type === 'Email' ? <Mail size={14} /> : <MessageSquare size={14} />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-slate-800 truncate">{followUp.studentName}</p>
                                                            <p className={cn("text-[10px]", isOverdue ? 'text-red-600 font-medium' : isTodays ? 'text-amber-600' : 'text-slate-500')}>
                                                                {format(new Date(followUp.scheduledFor), 'MMM d, h:mm a')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                                                </Link>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* My Tasks */}
                        <Card className="border-slate-200">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-slate-800">My Tasks</h3>
                                        <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingTasks.length}</span>
                                    </div>
                                    <Link href="/app/tasks" className="text-[10px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5">View all <ChevronRight size={12} /></Link>
                                </div>
                                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                                    {pendingTasks.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                                            <CheckCircle2 size={24} className="mb-2 text-emerald-500" />
                                            <p className="text-xs">No pending tasks!</p>
                                        </div>
                                    ) : (
                                        pendingTasks.slice(0, 5).map((task: any) => (
                                            <Link key={task.id} href="/app/tasks" className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={cn("w-1.5 h-8 rounded-full shrink-0", task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-slate-300')} />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-slate-800 truncate">{task.title}</p>
                                                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                            <Clock size={10} /> {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No due date'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0", task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600')}>{task.status}</span>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* My Recent Students */}
                        <Card className="border-slate-200">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-slate-800">My Recent Students</h3>
                                    <Link href="/app/my-students" className="text-[10px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5">View all <ChevronRight size={12} /></Link>
                                </div>
                                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                                    {recentStudents.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                                            <p className="text-xs">No students yet</p>
                                        </div>
                                    ) : (
                                        recentStudents.slice(0, 5).map((student: any, i: number) => {
                                            const studentName = student._name || student.studentName || student.candidateName || 'Unknown';
                                            const studentType = student._type;
                                            const href = `/app/student-profile/${studentType}/${student._id}`;
                                            const typeLabel = studentType === 'enquiry' ? 'Enquiry' : studentType === 'enrollment' ? 'Enrolled' : 'Registered';
                                            const typeColor = studentType === 'enquiry' ? 'bg-blue-100 text-blue-700' : studentType === 'enrollment' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700';
                                            const avatarColor = studentType === 'enquiry' ? 'from-blue-400 to-blue-600' : studentType === 'enrollment' ? 'from-purple-400 to-purple-600' : 'from-teal-400 to-teal-600';

                                            return (
                                                <Link key={`${studentType}-${student._id}`} href={href} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold text-[10px] shrink-0", avatarColor)}>
                                                            {studentName?.charAt(0) || '?'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-slate-800 truncate">{studentName}</p>
                                                            <p className="text-[10px] text-slate-500 truncate">{student.registrationNo || student.enrollmentNo || student.mobile || student.email}</p>
                                                        </div>
                                                    </div>
                                                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0", typeColor)}>
                                                        {typeLabel}
                                                    </span>
                                                </Link>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* My Recent Requests */}
                        <Card className="border-slate-200">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-slate-800">My Requests</h3>
                                        <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                            {myRequests.filter((r: any) => r.status === 'PENDING').length}
                                        </span>
                                    </div>
                                    <Link href="/app/my-requests" className="text-[10px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5">View all <ChevronRight size={12} /></Link>
                                </div>
                                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                                    {myRequests.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                                            <p className="text-xs">No recent requests</p>
                                        </div>
                                    ) : (
                                        myRequests.slice(0, 5).map((req: any) => (
                                            <div key={req.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={cn("w-1.5 h-8 rounded-full", req.status === 'PENDING' ? 'bg-amber-500' : req.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-red-500')} />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-slate-700 truncate">{req.request_type} - {req.student_name || 'Student'}</p>
                                                        <p className="text-[10px] text-slate-500">{format(new Date(req.created_at), 'MMM d, yyyy')}</p>
                                                    </div>
                                                </div>
                                                <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium",
                                                    req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                            'bg-red-100 text-red-700'
                                                )}>{req.status}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="xl:col-span-4 space-y-4">
                    {/* Quick Actions */}
                    <Card className="border-slate-200">
                        <div className="p-4">
                            <h3 className="text-sm font-semibold text-slate-800 mb-3">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <Link href="/app/enquiries/new" className="flex flex-col items-center justify-center p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                                    <MessageSquare size={18} className="text-blue-600 mb-1" />
                                    <span className="text-[10px] font-medium text-blue-700">Add Enquiry</span>
                                </Link>
                                <Link href="/app/registrations/new" className="flex flex-col items-center justify-center p-3 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
                                    <UserPlus size={18} className="text-emerald-600 mb-1" />
                                    <span className="text-[10px] font-medium text-emerald-700">Register</span>
                                </Link>
                                <Link href="/app/follow-ups" className="flex flex-col items-center justify-center p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                                    <Phone size={18} className="text-purple-600 mb-1" />
                                    <span className="text-[10px] font-medium text-purple-700">Follow-ups</span>
                                </Link>
                                <Link href="/app/tasks" className="flex flex-col items-center justify-center p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
                                    <CheckCircle2 size={18} className="text-amber-600 mb-1" />
                                    <span className="text-[10px] font-medium text-amber-700">Tasks</span>
                                </Link>
                            </div>
                        </div>
                    </Card>

                    {/* Documents I Hold */}
                    {myDocuments.length > 0 && (
                        <Card className="border-slate-200">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-slate-800">Documents I Hold</h3>
                                        <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{myDocuments.length}</span>
                                    </div>
                                    <Link href="/app/documents" className="text-[10px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5">View all <ChevronRight size={12} /></Link>
                                </div>
                                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                    {myDocuments.slice(0, 4).map((doc: any) => (
                                        <div key={doc.id} className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg">
                                            <FileText size={14} className="text-slate-500 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-slate-700 truncate">{doc.fileName || doc.name}</p>
                                                <p className="text-[10px] text-slate-500">{doc.studentName || 'Unknown'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}



                    {/* Performance Card */}
                    <Card className="border-slate-200 bg-gradient-to-br from-slate-800 to-slate-900">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-white/90">My Performance</h3>
                                <Star size={14} className="text-amber-400" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-white/60">Total Enquiries</span>
                                    <span className="text-sm font-bold text-white">{myEnquiries.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-white/60">Conversions</span>
                                    <span className="text-sm font-bold text-emerald-400">{convertedEnquiries}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-white/60">This Month</span>
                                    <span className="text-sm font-bold text-blue-400">{thisMonthEnquiries.length}</span>
                                </div>
                                <div className="pt-2 border-t border-white/10">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[11px] text-white/60">Conversion Rate</span>
                                        <span className="text-sm font-bold text-white">{conversionRate}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" style={{ width: `${Math.min(conversionRate, 100)}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// ========================
// MAIN PAGE COMPONENT
// ========================
export default function DashboardPage() {
    const { user, isCompanyAdmin, isDevAdmin } = useAuthStore();

    // Determine if user is admin (DEV_ADMIN, COMPANY_ADMIN, or MANAGER)
    const isAdmin = isDevAdmin() || isCompanyAdmin() || user?.role === 'MANAGER';

    if (isAdmin) {
        return <AdminDashboard />;
    }

    return <EmployeeDashboard />;
}

// ========================
// SHARED COMPONENTS
// ========================
function CompactStatCard({ title, value, icon: Icon, trend, color }: { title: string; value: string | number; icon: any; trend: number; color: 'blue' | 'emerald' | 'purple' | 'amber'; }) {
    const colorStyles = {
        blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
        emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
        purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
        amber: { bg: 'bg-amber-50', icon: 'text-amber-600' },
    };
    const styles = colorStyles[color];

    return (
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-slate-500 mb-1 truncate">{title}</p>
                        <h3 className="text-xl font-bold text-slate-900">{value}</h3>
                    </div>
                    <div className={cn("p-2 rounded-lg shrink-0", styles.bg)}>
                        <Icon size={18} className={styles.icon} />
                    </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                    {trend >= 0 ? <ArrowUpRight size={12} className="text-emerald-500" /> : <ArrowDownRight size={12} className="text-red-500" />}
                    <span className={cn("text-[10px] font-semibold", trend >= 0 ? 'text-emerald-600' : 'text-red-500')}>{trend >= 0 ? '+' : ''}{trend}%</span>
                    <span className="text-[10px] text-slate-400">vs last month</span>
                </div>
            </CardContent>
        </Card>
    );
}

function EmployeeStatCard({ title, value, thisMonth, icon: Icon, color }: { title: string; value: string | number; thisMonth?: number; icon: any; color: 'blue' | 'emerald' | 'purple' | 'teal'; }) {
    const colorStyles = {
        blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
        emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
        purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
        teal: { bg: 'bg-teal-50', icon: 'text-teal-600' },
    };
    const styles = colorStyles[color];

    return (
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-slate-500 mb-1 truncate">{title}</p>
                        <h3 className="text-xl font-bold text-slate-900">{value}</h3>
                    </div>
                    <div className={cn("p-2 rounded-lg shrink-0", styles.bg)}>
                        <Icon size={18} className={styles.icon} />
                    </div>
                </div>
                {thisMonth !== undefined && (
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-teal-600 font-medium">+{thisMonth} this month</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ActionItem({ href, icon: Icon, label, count, color }: { href: string; icon: any; label: string; count: number; color: 'amber' | 'purple' | 'blue'; }) {
    const colorStyles = {
        amber: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
        purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
        blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    };
    const iconColors = { amber: 'text-amber-600', purple: 'text-purple-600', blue: 'text-blue-600' };

    return (
        <Link href={href} className={cn("flex items-center justify-between p-2.5 rounded-lg border transition-colors group", colorStyles[color])}>
            <div className="flex items-center gap-2.5">
                <Icon size={16} className={iconColors[color]} />
                <span className="text-xs font-medium text-slate-700">{label}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={count > 0 ? { backgroundColor: color === 'amber' ? '#d97706' : color === 'purple' ? '#9333ea' : '#2563eb', color: 'white' } : { backgroundColor: '#e2e8f0', color: '#64748b' }}>{count}</span>
                <ChevronRight size={12} className="text-slate-400 group-hover:text-slate-600" />
            </div>
        </Link>
    );
}
