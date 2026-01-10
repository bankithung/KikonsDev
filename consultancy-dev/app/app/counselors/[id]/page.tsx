'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User as UserIcon, Mail, Phone, Users, FileText, Bell, CheckSquare, DollarSign, Activity, Ban, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

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
            return users.find((u: any) => u.id === parseInt(id));
        },
        enabled: !!id,
    });

    // Fetch employee stats
    const { data: stats, isLoading: loadingStats, error: statsError } = useQuery({
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

    // Log stats when they change
    if (statsError) {
        console.error('[ERROR] Stats fetch failed:', statsError);
    }
    if (stats) {
        console.log('[SUCCESS] Stats loaded:', stats);
    }

    // Fetch activity logs
    const { data: activityLogs } = useQuery({
        queryKey: ['user', id, 'activity-logs'],
        queryFn: async () => {
            const axios = (await import('axios')).default;
            const res = await axios.get(`http://127.0.0.1:8000/api/users/${id}/activity-logs/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
            });
            console.log('[DEBUG] Activity Logs:', res.data);
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
            console.log('[DEBUG] Earnings:', res.data);
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
            console.log('[DEBUG] Followups Raw:', data);
            return data;
        },
        select: (data) => {
            if (data.length > 0) {
                console.log('[DEBUG] First Followup Structure:', JSON.stringify(data[0], null, 2));
            }
            const filtered = data.filter((f: any) => {
                const assignee = f.assignedTo || f.assigned_to;
                const assigneeId = typeof assignee === 'object' ? assignee?.id : assignee;
                return assigneeId == id;
            });
            console.log('[DEBUG] Followups Filtered:', filtered);
            return filtered;
        }
    });

    // Fetch tasks
    const { data: tasks = [] } = useQuery({
        queryKey: ['user', id, 'tasks'],
        queryFn: async () => {
            const data = await apiClient.tasks.list();
            console.log('[DEBUG] Tasks Raw:', data);
            return data;
        },
        select: (data) => {
            // Handle paginated response if apiClient passes it through (though apiClient usually maps array)
            const list = Array.isArray(data) ? data : (data as any).results || [];
            if (list.length > 0) {
                console.log('[DEBUG] First Task Structure:', JSON.stringify(list[0], null, 2));
            }
            const filtered = list.filter((t: any) => {
                const assignee = t.assignedTo || t.assigned_to;
                const assigneeId = typeof assignee === 'object' ? assignee?.id : assignee;
                // Use loose equality (==) to handle string/number mismatch
                return assigneeId == id;
            });
            console.log('[DEBUG] Tasks Filtered:', filtered);
            return filtered;
        },
        enabled: !!id && activeTab === 'tasks',
    });

    if (loadingEmployee) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-slate-500">Loading employee profile...</div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-slate-500">Employee not found</p>
                <Button onClick={() => router.push('/app/counselors')}>Back to Counselors</Button>
            </div>
        );
    }

    // Toggle Status Handlers
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

    const totalEarnings = Array.isArray(earnings) ? earnings.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0) : 0;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/app/counselors')}
                    className="gap-2"
                >
                    <ArrowLeft size={16} />
                    Back
                </Button>
                <h1 className="text-2xl font-bold text-slate-900 font-heading">Employee Profile</h1>
            </div>

            {/* Profile Card */}
            <Card className="border-2">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-3xl font-bold shrink-0">
                            {employee.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 font-heading flex items-center gap-3">
                                        {employee.username}
                                        {!employee.is_active && (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-600 border border-red-200">
                                                SUSPENDED
                                            </span>
                                        )}
                                        {employee.is_active && (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-600 border border-green-200">
                                                ACTIVE
                                            </span>
                                        )}
                                    </h2>
                                    <p className="text-slate-600 mb-4">{employee.role}</p>
                                </div>

                                {(currentUser?.role === 'COMPANY_ADMIN' || currentUser?.role === 'DEV_ADMIN') && currentUser?.id !== parseInt(id) && (
                                    <Button
                                        variant={employee.is_active ? "destructive" : "default"}
                                        onClick={handleToggleStatus}
                                        disabled={togglingStatus}
                                    >
                                        {togglingStatus ? 'Updating...' : employee.is_active ? 'Suspend Account' : 'Activate Account'}
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <span>{employee.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <UserIcon className="h-4 w-4 text-slate-400" />
                                    <span>ID: {employee.id}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Users className="h-4 w-4 text-slate-400" />
                                    <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold">{employee.role}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-white">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <p className="text-xs text-slate-600">Enquiries</p>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{stats.totalEnquiries}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-white">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Users className="h-4 w-4 text-green-600" />
                                <p className="text-xs text-slate-600">Registrations</p>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{stats.totalRegistrations}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-white">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="h-4 w-4 text-purple-600" />
                                <p className="text-xs text-slate-600">Earnings</p>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">₹{stats?.totalEarnings?.toLocaleString() || 0}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-yellow-50 to-white">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Bell className="h-4 w-4 text-yellow-600" />
                                <p className="text-xs text-slate-600">Active F-ups</p>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{stats.activeFollowups}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-teal-50 to-white">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckSquare className="h-4 w-4 text-teal-600" />
                                <p className="text-xs text-slate-600">Done F-ups</p>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{stats.completedFollowups}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-50 to-white">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckSquare className="h-4 w-4 text-orange-600" />
                                <p className="text-xs text-slate-600">Active Tasks</p>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{stats.activeTasks}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-white">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckSquare className="h-4 w-4 text-green-600" />
                                <p className="text-xs text-slate-600">Done Tasks</p>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{stats.completedTasks}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="entries">Entries</TabsTrigger>
                    <TabsTrigger value="followups">Follow-ups</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="earnings">Earnings</TabsTrigger>
                    <TabsTrigger value="logs">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold mb-4">Quick Summary</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-2">Performance</h4>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex justify-between">
                                            <span className="text-slate-600">Total Enquiries Created:</span>
                                            <span className="font-semibold">{stats?.totalEnquiries || 0}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-slate-600">Total Registrations:</span>
                                            <span className="font-semibold">{stats?.totalRegistrations || 0}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-slate-600">Total Earnings:</span>
                                            <span className="font-semibold text-green-600">₹{stats?.totalEarnings?.toLocaleString() || 0}</span>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-2">Current Workload</h4>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex justify-between">
                                            <span className="text-slate-600">Active Follow-ups:</span>
                                            <span className="font-semibold">{stats?.activeFollowups || 0}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-slate-600">Completed Follow-ups:</span>
                                            <span className="font-semibold">{stats?.completedFollowups || 0}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span className="text-slate-600">Active Tasks:</span>
                                            <span className="font-semibold">{stats?.activeTasks || 0}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="entries" className="space-y-4">
                    {entries && (
                        <>
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold mb-4">Enquiries Created ({entries.enquiries?.length || 0})</h3>
                                    <div className="space-y-2">
                                        {entries.enquiries?.slice(0, 10).map((enq: any) => (
                                            <div key={enq.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                                <div>
                                                    <p className="font-semibold">{enq.candidate_name}</p>
                                                    <p className="text-xs text-slate-500">{enq.course_interested}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-500">{format(new Date(enq.date), 'MMM dd,yyyy')}</p>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${enq.status === 'Converted' ? 'bg-green-100 text-green-700' :
                                                        enq.status === 'New' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {enq.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-bold mb-4">Registrations Created ({entries.registrations?.length || 0})</h3>
                                    <div className="space-y-2">
                                        {entries.registrations?.slice(0, 10).map((reg: any) => (
                                            <div key={reg.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                                <div>
                                                    <p className="font-semibold">{reg.student_name}</p>
                                                    <p className="text-xs text-slate-500">{reg.registration_no}</p>
                                                </div>
                                                <p className="text-xs text-slate-500">{format(new Date(reg.created_at), 'MMM dd, yyyy')}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="followups" className="space-y-4">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold mb-4">Follow-ups ({followUps.length})</h3>
                            <div className="space-y-2">
                                {followUps.map((f: any) => (
                                    <div key={f.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <p className="font-semibold">{f.studentName}</p>
                                            <p className="text-xs text-slate-500">{f.type} - {f.notes}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">{format(new Date(f.scheduledFor), 'MMM dd, HH:mm')}</p>
                                            <span className={`text-xs px-2 py-1 rounded-full ${f.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                f.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                {f.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tasks" className="space-y-4">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold mb-4">Tasks ({(tasks?.results?.length || tasks?.length || 0)})</h3>
                            <div className="space-y-2">
                                {(tasks?.results || tasks || []).map((t: any) => (
                                    <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <p className="font-semibold">{t.title}</p>
                                            <p className="text-xs text-slate-500">Due: {t.due_date}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${t.status === 'Done' ? 'bg-green-100 text-green-700' :
                                            t.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                            {t.status}
                                        </span>
                                    </div>
                                ))}
                                {(!tasks?.results && !tasks?.length) && (
                                    <p className="text-slate-500 text-sm">No tasks assigned.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="earnings" className="space-y-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Earnings History</h3>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">Total Earned</p>
                                    <p className="text-2xl font-bold text-green-600">₹{totalEarnings.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {earnings.map((e: any) => (
                                    <div key={e.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <p className="font-semibold">{e.description}</p>
                                            <p className="text-xs text-slate-500">{format(new Date(e.date), 'MMM dd, yyyy')}</p>
                                        </div>
                                        <p className="font-bold text-green-600">₹{parseFloat(e.amount).toLocaleString()}</p>
                                    </div>
                                ))}
                                {earnings.length === 0 && (
                                    <p className="text-slate-500 text-sm">No earnings recorded.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold mb-4">Activity Log</h3>
                            <div className="space-y-4">
                                {(activityLogs?.results || activityLogs || []).map((log: any) => (
                                    <div key={log.id} className="flex gap-4 items-start p-3 bg-slate-50 rounded-lg">
                                        <div className="mt-1">
                                            {log.action_type === 'LOGIN' ? <div className="w-2 h-2 rounded-full bg-green-500" /> :
                                                log.action_type === 'LOGOUT' ? <div className="w-2 h-2 rounded-full bg-slate-400" /> :
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-semibold">{log.description}</p>
                                            <p className="text-xs text-slate-500">
                                                {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!activityLogs?.results && !activityLogs?.length) && (
                                    <p className="text-slate-500 text-sm">No activity logs found.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ConfirmDialog
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmToggleStatus}
                title={employee.is_active ? 'Suspend Account?' : 'Activate Account?'}
                description={
                    employee.is_active
                        ? `Are you sure you want to suspend ${employee.username}'s account? They will lose all access to the system immediately.`
                        : `Are you sure you want to activate ${employee.username}'s account? Their access will be restored.`
                }
                confirmText={employee.is_active ? 'Suspend Account' : 'Activate Account'}
                confirmVariant={employee.is_active ? 'destructive' : 'success'}
                icon={employee.is_active ? <Ban className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                isLoading={togglingStatus}
            />
        </div>
    );
}
