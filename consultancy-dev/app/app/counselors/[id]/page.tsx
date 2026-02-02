'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackButton } from '@/components/ui/back-button';
import { ArrowLeft, User as UserIcon, Mail, Phone, MapPin, Briefcase, FileText, Bell, CheckSquare, DollarSign, Activity as ActivityIcon, Calendar, BadgeDollarSign, TrendingUp, Clock, CheckCircle, Ban, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// Helper Components (matching student profile)
const SidebarDetail = ({ icon: Icon, value, label }: { icon: any, value: string | null | undefined, label?: string }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 text-sm">
            <Icon size={16} className="text-slate-400 mt-0.5 shrink-0" />
            <div className="flex flex-col">
                <span className="text-slate-700 font-medium leading-tight break-all">{value}</span>
                {label && <span className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</span>}
            </div>
        </div>
    );
};

const DetailRow = ({ label, value, icon: Icon, className = "" }: { label: string, value: React.ReactNode, icon?: any, className?: string }) => (
    <div className={`flex flex-col min-w-0 ${className}`}>
        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-1.5 mb-0.5 shrink-0">
            {Icon && <Icon size={10} className="text-slate-400 shrink-0" />}
            <span className="truncate">{label}</span>
        </div>
        <div className="text-sm font-medium text-slate-800 leading-snug break-words" title={typeof value === 'string' ? value : ''}>
            {value || <span className="text-slate-300 italic text-xs">N/A</span>}
        </div>
    </div>
);

const SectionHeader = ({ title, icon: Icon }: { title: string, icon?: any }) => (
    <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-slate-500" />}
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">{title}</h3>
    </div>
);

export default function EmployeeProfilePage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const id = params.id as string;
    const [activeTab, setActiveTab] = useState('overview');
    const [togglingStatus, setTogglingStatus] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Fetch employee basic info
    const { data: employee, isLoading: loadingEmployee } = useQuery({
        queryKey: ['user', id],
        queryFn: async () => {
            const users = await apiClient.users.list();
            return users.find((u: any) => u.id === id);
        },
        enabled: !!id,
    });

    // Fetch employee stats
    const { data: stats } = useQuery({
        queryKey: ['user', id, 'stats'],
        queryFn: async () => {
            const axios = (await import('axios')).default;
            const res = await axios.get(`http://127.0.0.1:8000/api/users/${id}/stats/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
            });
            return res.data;
        },
        enabled: !!id,
    });

    // Fetch activity logs
    const { data: activityLogs } = useQuery({
        queryKey: ['user', id, 'activity-logs'],
        queryFn: async () => {
            const axios = (await import('axios')).default;
            const res = await axios.get(`http://127.0.0.1:8000/api/users/${id}/activity-logs/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
            });
            return res.data;
        },
        enabled: !!id && activeTab === 'activity',
    });

    // Fetch earnings
    const { data: earnings = [] } = useQuery({
        queryKey: ['user', id, 'earnings'],
        queryFn: async () => {
            const axios = (await import('axios')).default;
            const res = await axios.get(`http://127.0.0.1:8000/api/users/${id}/earnings/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
            });
            return res.data;
        },
        enabled: !!id && activeTab === 'earnings',
    });

    // Fetch entries
    const { data: entries } = useQuery({
        queryKey: ['user', id, 'entries'],
        queryFn: async () => {
            const axios = (await import('axios')).default;
            const res = await axios.get(`http://127.0.0.1:8000/api/users/${id}/entries/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
            });
            return res.data;
        },
        enabled: !!id && activeTab === 'entries',
    });

    // Fetch followups
    const { data: followUps = [] } = useQuery({
        queryKey: ['user', id, 'followups'],
        queryFn: async () => {
            const data = await apiClient.followUps.list();
            return data;
        },
        select: (data) => {
            const filtered = data.filter((f: any) => {
                const assignee = f.assignedTo || f.assigned_to;
                const assigneeId = typeof assignee === 'object' ? assignee?.id : assignee;
                return assigneeId == id;
            });
            return filtered;
        },
        enabled: !!id && activeTab === 'followups',
    });

    // Fetch tasks
    const { data: tasks = [] } = useQuery({
        queryKey: ['user', id, 'tasks'],
        queryFn: async () => {
            const data = await apiClient.tasks.list();
            return data;
        },
        select: (data) => {
            const list = Array.isArray(data) ? data : (data as any).results || [];
            const filtered = list.filter((t: any) => {
                const assignee = t.assignedTo || t.assigned_to;
                const assigneeId = typeof assignee === 'object' ? assignee?.id : assignee;
                return assigneeId == id;
            });
            return filtered;
        },
        enabled: !!id && activeTab === 'tasks',
    });

    if (loadingEmployee) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="p-8 text-center text-slate-500">Employee not found</div>
        );
    }

    const handleToggleStatus = () => {
        setIsConfirmOpen(true);
    };

    const confirmToggleStatus = async () => {
        setTogglingStatus(true);
        setIsConfirmOpen(false);
        try {
            const axios = (await import('axios')).default;
            await axios.post(`http://127.0.0.1:8000/api/users/${id}/toggle-status/`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
            });
            await queryClient.invalidateQueries({ queryKey: ['user', id] });
        } catch (error) {
            console.error('Failed to toggle status:', error);
            alert('Failed to update status');
        } finally {
            setTogglingStatus(false);
        }
    };

    const employeeName = employee.first_name && employee.last_name
        ? `${employee.first_name} ${employee.last_name}`
        : employee.username;

    const totalEarnings = Array.isArray(earnings) ? earnings.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) : 0;

    // Performance milestones for timeline
    const milestones = [
        { label: 'Joined', date: employee.date_of_joining, status: 'Completed', active: true },
        { label: 'Active', date: employee.is_active ? new Date().toISOString() : null, status: employee.is_active ? 'Active' : 'Pending', active: employee.is_active },
        { label: 'Performance', date: stats?.totalEnquiries ? new Date().toISOString() : null, status: stats?.totalEnquiries ? 'Tracking' : 'Pending', active: !!stats?.totalEnquiries }
    ];

    return (
        <div className="max-w-[1600px] mx-auto px-4 py-1 lg:px-6 lg:py-2 bg-slate-50/30 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                <BackButton />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">

                {/* SIDEBAR */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-4">

                    {/* Profile Card */}
                    <Card className="border border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex flex-col items-center text-center">
                            <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center text-white text-3xl font-bold shadow-inner mb-4 ring-2 ring-white/20">
                                {employeeName.charAt(0).toUpperCase()}
                            </div>
                            <h1 className="text-xl font-bold text-white leading-tight">{employeeName}</h1>
                            <span className="mt-2 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-teal-500/20 text-teal-100 border-teal-500/30">
                                {employee.role}
                            </span>
                        </CardHeader>
                        <CardContent className="p-5 space-y-6">
                            {/* Contact Info */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <SidebarDetail icon={Phone} value={employee.phone_number} label="Mobile" />
                                <SidebarDetail icon={Mail} value={employee.email} label="Email" />
                                <SidebarDetail icon={MapPin} value={employee.assigned_district || employee.assigned_state} label="Location" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Performance Highlights */}
                    {stats && (
                        <Card className="border border-slate-200 shadow-sm">
                            <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100">
                                <SectionHeader title="Performance Highlights" icon={TrendingUp} />
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Total Enquiries</span>
                                        <span className="text-sm font-bold text-teal-600">{stats.totalEnquiries}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Registrations</span>
                                        <span className="text-sm font-bold text-green-600">{stats.totalRegistrations}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-600">Total Earnings</span>
                                        <span className="text-sm font-bold text-purple-600">₹{(stats.totalEarnings || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="border-t border-slate-100 pt-3 mt-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-slate-600">Active Tasks</span>
                                            <span className="text-sm font-bold text-orange-600">{stats.activeTasks}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-600">Active Follow-ups</span>
                                            <span className="text-sm font-bold text-yellow-600">{stats.activeFollowups}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Recent Activity */}
                    <Card className="border border-slate-200 shadow-sm">
                        <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100">
                            <SectionHeader title="Recent Activity" icon={ActivityIcon} />
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-3">
                                {(activityLogs?.results || activityLogs || []).slice(0, 5).map((log: any) => (
                                    <div key={log.id} className="flex gap-2 items-start">
                                        <div className="mt-1.5">
                                            {log.action_type === 'LOGIN' ? <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> :
                                                log.action_type === 'LOGOUT' ? <div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> :
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-900 font-medium truncate">{log.description}</p>
                                            <p className="text-[10px] text-slate-500">
                                                {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!activityLogs?.results && !activityLogs?.length) && (
                                    <p className="text-xs text-slate-400 text-center py-4">No recent activity</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* MAIN CONTENT */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-4">

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="bg-white border border-slate-200 rounded-lg mb-4 shadow-sm overflow-x-auto">
                            <TabsList className="h-10 bg-white w-max min-w-full justify-start gap-2 sm:gap-6 px-2">
                                {['Overview', 'Entries', 'Follow-ups', 'Tasks', 'Earnings', 'Activity'].map((tab) => (
                                    <TabsTrigger
                                        key={tab.toLowerCase().replace('-', '')}
                                        value={tab.toLowerCase().replace('-', '')}
                                        className="h-10 rounded-none border-b-2 border-transparent px-2 sm:px-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 data-[state=active]:border-teal-600 data-[state=active]:text-teal-600 data-[state=active]:shadow-none transition-all whitespace-nowrap"
                                    >
                                        {tab}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-4 focus-visible:outline-none mt-0">

                            {/* Performance Summary Banner */}
                            {stats && (
                                <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-sm">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 mb-1">Enquiries</p>
                                            <p className="text-2xl font-bold text-teal-600">{stats.totalEnquiries}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 mb-1">Registrations</p>
                                            <p className="text-2xl font-bold text-green-600">{stats.totalRegistrations}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 mb-1">Earnings</p>
                                            <p className="text-2xl font-bold text-purple-600">₹{(stats.totalEarnings || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 mb-1">Active F-ups</p>
                                            <p className="text-2xl font-bold text-yellow-600">{stats.activeFollowups}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 mb-1">Done F-ups</p>
                                            <p className="text-2xl font-bold text-teal-600">{stats.completedFollowups}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 mb-1">Active Tasks</p>
                                            <p className="text-2xl font-bold text-orange-600">{stats.activeTasks}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 mb-1">Done Tasks</p>
                                            <p className="text-2xl font-bold text-emerald-600">{stats.completedTasks}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Unified Employee Details Card */}
                            <Card className="border border-slate-200 shadow-sm">
                                <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <UserIcon size={14} className="text-slate-500" />
                                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Employee Details</h3>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {/* Personal Information Section */}
                                    <div className="p-5 border-b border-slate-100">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="h-1.5 w-1.5 rounded-full bg-teal-500"></div>
                                            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Personal Information</h4>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                                            <DetailRow label="Full Name" value={employeeName} />
                                            <DetailRow label="Gender" value={employee.gender} />
                                            <DetailRow label="Date of Birth" value={employee.dob ? format(new Date(employee.dob), 'dd MMM yyyy') : null} icon={Calendar} />
                                            <DetailRow label="Religion" value={employee.religion} />
                                            <DetailRow label="State of Origin" value={employee.state_from} icon={MapPin} />
                                            <DetailRow label="Father's / Mother's Name" value={employee.parents_name} />
                                            <DetailRow label="Email" value={employee.email} icon={Mail} />
                                            <DetailRow label="Phone" value={employee.phone_number} icon={Phone} />
                                        </div>
                                    </div>

                                    {/* Employment Details Section */}
                                    <div className="p-5 border-b border-slate-100">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                                            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Employment Details</h4>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                                            <DetailRow label="Employee ID" value={`#${employee.id}`} />
                                            <DetailRow label="System Role" value={employee.role} icon={Briefcase} />
                                            <DetailRow label="Date of Joining" value={employee.date_of_joining ? format(new Date(employee.date_of_joining), 'dd MMM yyyy') : null} icon={Calendar} />
                                            <DetailRow label="Salary (Annual CTC)" value={employee.salary ? `₹${parseFloat(employee.salary).toLocaleString()}` : null} icon={BadgeDollarSign} />
                                            <DetailRow label="Username" value={`@${employee.username}`} />
                                            <DetailRow
                                                label="Account Status"
                                                value={
                                                    <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${employee.is_active
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {employee.is_active ? '✓ Active' : '✗ Suspended'}
                                                    </span>
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Location & Assignment Section */}
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                                            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Location & Assignment</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                                            <DetailRow label="Assigned State" value={employee.assigned_state} icon={MapPin} />
                                            <DetailRow label="Assigned District" value={employee.assigned_district} />
                                            <DetailRow label="Specific Location / Branch" value={employee.assigned_location} />
                                        </div>
                                        {(employee.assigned_state || employee.assigned_district || employee.assigned_location) && (
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Complete Assignment Address</p>
                                                <p className="text-sm font-medium text-slate-800">
                                                    {[employee.assigned_location, employee.assigned_district, employee.assigned_state].filter(Boolean).join(', ') || 'Not assigned'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Account Actions */}
                            {(currentUser?.role === 'COMPANY_ADMIN' || currentUser?.role === 'DEV_ADMIN') && currentUser?.id !== id && (
                                <Card className="border border-slate-200 shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-700">Account Management</h4>
                                                <p className="text-xs text-slate-500">Manage employee account status</p>
                                            </div>
                                            <Button
                                                variant={employee.is_active ? "destructive" : "default"}
                                                onClick={handleToggleStatus}
                                                disabled={togglingStatus}
                                                size="sm"
                                            >
                                                {togglingStatus ? 'Updating...' : employee.is_active ? 'Suspend Account' : 'Activate Account'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* Entries Tab */}
                        <TabsContent value="entries" className="space-y-4 focus-visible:outline-none mt-0">
                            {entries && (
                                <>
                                    <Card className="border border-slate-200 shadow-sm">
                                        <CardHeader className="py-3 px-4 border-b border-slate-100">
                                            <CardTitle className="text-sm font-bold">Enquiries Created ({entries.enquiries?.length || 0})</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <div className="space-y-2">
                                                {entries.enquiries?.slice(0, 10).map((enq: any) => (
                                                    <div key={enq.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-sm text-slate-900">{enq.candidate_name}</p>
                                                            <p className="text-xs text-slate-600">{enq.course_interested}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-slate-500 mb-1">{format(new Date(enq.date), 'dd MMM yyyy')}</p>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${enq.status === 'Converted' ? 'bg-green-100 text-green-700' :
                                                                enq.status === 'New' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-slate-100 text-slate-700'
                                                                }`}>
                                                                {enq.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!entries.enquiries || entries.enquiries.length === 0) && (
                                                    <div className="text-center py-8 text-xs text-slate-400">No enquiries found</div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="border border-slate-200 shadow-sm">
                                        <CardHeader className="py-3 px-4 border-b border-slate-100">
                                            <CardTitle className="text-sm font-bold">Registrations Created ({entries.registrations?.length || 0})</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <div className="space-y-2">
                                                {entries.registrations?.slice(0, 10).map((reg: any) => (
                                                    <div key={reg.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-sm text-slate-900">{reg.student_name}</p>
                                                            <p className="text-xs text-slate-600">{reg.registration_no}</p>
                                                        </div>
                                                        <p className="text-xs text-slate-500">{format(new Date(reg.created_at), 'dd MMM yyyy')}</p>
                                                    </div>
                                                ))}
                                                {(!entries.registrations || entries.registrations.length === 0) && (
                                                    <div className="text-center py-8 text-xs text-slate-400">No registrations found</div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </TabsContent>

                        {/* Follow-ups Tab */}
                        <TabsContent value="followups" className="space-y-4 focus-visible:outline-none mt-0">
                            <Card className="border border-slate-200 shadow-sm">
                                <CardHeader className="py-3 px-4 border-b border-slate-100">
                                    <CardTitle className="text-sm font-bold">Follow-ups ({followUps.length})</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="space-y-2">
                                        {followUps.map((f: any) => (
                                            <div key={f.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm text-slate-900">{f.studentName}</p>
                                                    <p className="text-xs text-slate-600">{f.type} - {f.notes}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-500 mb-1">{format(new Date(f.scheduledFor), 'dd MMM HH:mm')}</p>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${f.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                        f.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {f.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {followUps.length === 0 && (
                                            <div className="text-center py-8 text-xs text-slate-400">No follow-ups assigned</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tasks Tab */}
                        <TabsContent value="tasks" className="space-y-4 focus-visible:outline-none mt-0">
                            <Card className="border border-slate-200 shadow-sm">
                                <CardHeader className="py-3 px-4 border-b border-slate-100">
                                    <CardTitle className="text-sm font-bold">Tasks ({(tasks?.results?.length || tasks?.length || 0)})</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="space-y-2">
                                        {(tasks?.results || tasks || []).map((t: any) => (
                                            <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm text-slate-900">{t.title}</p>
                                                    <p className="text-xs text-slate-600">Due: {t.due_date}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.status === 'Done' ? 'bg-green-100 text-green-700' :
                                                    t.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {t.status}
                                                </span>
                                            </div>
                                        ))}
                                        {(!tasks?.results && !tasks?.length) && (
                                            <div className="text-center py-8 text-xs text-slate-400">No tasks assigned</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Earnings Tab */}
                        <TabsContent value="earnings" className="space-y-4 focus-visible:outline-none mt-0">
                            <Card className="border border-slate-200 shadow-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                                <CardContent className="p-6">
                                    <p className="text-sm opacity-80 mb-1">Total Earnings</p>
                                    <p className="text-4xl font-bold">₹{totalEarnings.toLocaleString()}</p>
                                </CardContent>
                            </Card>
                            <Card className="border border-slate-200 shadow-sm">
                                <CardHeader className="py-3 px-4 border-b border-slate-100">
                                    <CardTitle className="text-sm font-bold">Earnings History</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="space-y-2">
                                        {earnings.map((e: any) => (
                                            <div key={e.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm text-slate-900">{e.description}</p>
                                                    <p className="text-xs text-slate-600">{format(new Date(e.date), 'dd MMM yyyy')}</p>
                                                </div>
                                                <p className="text-lg font-bold text-green-600">₹{parseFloat(e.amount).toLocaleString()}</p>
                                            </div>
                                        ))}
                                        {earnings.length === 0 && (
                                            <div className="text-center py-8 text-xs text-slate-400">No earnings recorded</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Activity Tab */}
                        <TabsContent value="activity" className="space-y-4 focus-visible:outline-none mt-0">
                            <Card className="border border-slate-200 shadow-sm">
                                <CardHeader className="py-3 px-4 border-b border-slate-100">
                                    <CardTitle className="text-sm font-bold">Activity Log</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="space-y-2">
                                        {(activityLogs?.results || activityLogs || []).map((log: any) => (
                                            <div key={log.id} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="mt-1.5">
                                                    {log.action_type === 'LOGIN' ? <div className="w-2 h-2 rounded-full bg-green-500" /> :
                                                        log.action_type === 'LOGOUT' ? <div className="w-2 h-2 rounded-full bg-slate-400" /> :
                                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    }
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm text-slate-900">{log.description}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {format(new Date(log.timestamp), 'dd MMM yyyy HH:mm:ss')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {(!activityLogs?.results && !activityLogs?.length) && (
                                            <div className="text-center py-8 text-xs text-slate-400">No activity logs found</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <ConfirmDialog
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmToggleStatus}
                title={employee.is_active ? 'Suspend Account?' : 'Activate Account?'}
                description={
                    employee.is_active
                        ? `Are you sure you want to suspend ${employeeName}'s account? They will lose all access to the system immediately.`
                        : `Are you sure you want to activate ${employeeName}'s account? Their access will be restored.`
                }
                confirmText={employee.is_active ? 'Suspend Account' : 'Activate Account'}
                confirmVariant={employee.is_active ? 'destructive' : 'success'}
                icon={employee.is_active ? <Ban className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                isLoading={togglingStatus}
            />
        </div>
    );
}
