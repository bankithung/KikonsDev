'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/store/toastStore';
import {
    User,
    Mail,
    Phone,
    Building,
    Shield,
    Calendar,
    MapPin,
    Briefcase,
    Edit2,
    Save,
    X,
    Loader2,
    Key,
    Eye,
    EyeOff,
    Clock,
    CheckCircle2,
    ChevronRight,
    FileText,
    MessageSquare,
    GraduationCap,
    TrendingUp,
    Target,
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';

export default function ProfilePage() {
    const { user, checkAuth } = useAuthStore();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        gender: '',
        dob: '',
        parents_name: '',
        religion: '',
        state_from: '',
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    // Fetch stats
    const { data: enquiries = [] } = useQuery({
        queryKey: ['enquiries'],
        queryFn: apiClient.enquiries.list,
    });

    const { data: registrations = [] } = useQuery({
        queryKey: ['registrations'],
        queryFn: apiClient.registrations.list,
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: apiClient.tasks.list,
    });

    const myStats = useMemo(() => {
        const userId = user?.id;
        return {
            enquiries: enquiries.filter((e: any) => e.created_by === userId).length,
            registrations: registrations.filter((r: any) => r.created_by === userId).length,
            tasks: tasks.filter((t: any) => t.assigned_to === userId).length,
            completedTasks: tasks.filter((t: any) => t.assigned_to === userId && t.status === 'Done').length,
        };
    }, [enquiries, registrations, tasks, user?.id]);

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                phone_number: user.phone_number || '',
                gender: user.gender || '',
                dob: user.dob || '',
                parents_name: user.parents_name || '',
                religion: user.religion || '',
                state_from: user.state_from || '',
            });
        }
    }, [user]);

    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => apiClient.users.update(String(user?.id), data),
        onSuccess: async () => {
            await checkAuth();
            setIsEditing(false);
            toast.success('Profile updated');
        },
        onError: () => toast.error('Update failed')
    });

    const changePasswordMutation = useMutation({
        mutationFn: (data: any) => apiClient.users.update(String(user?.id), { password: data.new_password }),
        onSuccess: () => {
            setIsPasswordModalOpen(false);
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            toast.success('Password changed');
        },
        onError: () => toast.error('Password change failed')
    });

    const handleSubmit = () => updateProfileMutation.mutate(formData);

    const handlePasswordChange = () => {
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('Passwords do not match');
            return;
        }
        if (passwordData.new_password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        changePasswordMutation.mutate(passwordData);
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
    const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const InfoItem = ({ label, value, icon: Icon }: { label: string; value: string | undefined; icon?: any }) => (
        <div className="flex items-start gap-3 py-2">
            {Icon && <Icon size={14} className="text-slate-400 mt-0.5 shrink-0" />}
            <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">{label}</p>
                <p className="text-sm text-slate-800 truncate">{value || '—'}</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            {/* Action Button */}
            <div className="flex justify-end">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="h-8 text-xs gap-1.5"
                >
                    <Key size={12} /> Change Password
                </Button>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column - Profile Card */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Avatar Card */}
                    <Card className="border-slate-200 overflow-hidden">
                        <div className="h-16 bg-gradient-to-br from-slate-800 to-slate-900" />
                        <CardContent className="pt-0 pb-4 px-4 -mt-8">
                            <div className="flex flex-col items-center text-center">
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={fullName}
                                        className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-sm"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center border-4 border-white shadow-sm">
                                        <span className="text-lg font-bold text-white">{initials}</span>
                                    </div>
                                )}
                                <h2 className="mt-2 text-base font-semibold text-slate-900">{fullName}</h2>
                                <p className="text-xs text-slate-500">@{user.username}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                                        {user.role.replace('_', ' ')}
                                    </span>
                                    {user.is_active && (
                                        <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                            Active
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Card */}
                    <Card className="border-slate-200">
                        <CardContent className="p-4">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Contact</h3>
                            <div className="space-y-1">
                                <InfoItem label="Email" value={user.email} icon={Mail} />
                                <InfoItem label="Phone" value={user.phone_number} icon={Phone} />
                                <InfoItem label="Location" value={user.assigned_location || user.assigned_district} icon={MapPin} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="border-slate-200">
                        <CardContent className="p-4">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Performance</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="text-center p-2 bg-slate-50 rounded-lg">
                                    <p className="text-lg font-bold text-slate-800">{myStats.enquiries}</p>
                                    <p className="text-[10px] text-slate-500">Enquiries</p>
                                </div>
                                <div className="text-center p-2 bg-slate-50 rounded-lg">
                                    <p className="text-lg font-bold text-slate-800">{myStats.registrations}</p>
                                    <p className="text-[10px] text-slate-500">Registrations</p>
                                </div>
                                <div className="text-center p-2 bg-slate-50 rounded-lg">
                                    <p className="text-lg font-bold text-slate-800">{myStats.tasks}</p>
                                    <p className="text-[10px] text-slate-500">Tasks</p>
                                </div>
                                <div className="text-center p-2 bg-slate-50 rounded-lg">
                                    <p className="text-lg font-bold text-slate-800">{myStats.completedTasks}</p>
                                    <p className="text-[10px] text-slate-500">Completed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Details */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Personal Information */}
                    <Card className="border-slate-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-slate-900">Personal Information</h3>
                                {!isEditing ? (
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-7 text-xs text-slate-600">
                                        <Edit2 size={12} className="mr-1" /> Edit
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 text-xs">
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSubmit}
                                            disabled={updateProfileMutation.isPending}
                                            className="h-7 text-xs bg-slate-900 hover:bg-slate-800"
                                        >
                                            {updateProfileMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                {[
                                    { key: 'first_name', label: 'First Name', icon: User },
                                    { key: 'last_name', label: 'Last Name', icon: User },
                                    { key: 'phone_number', label: 'Phone', icon: Phone },
                                    { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
                                    { key: 'dob', label: 'Date of Birth', type: 'date', icon: Calendar },
                                    { key: 'parents_name', label: "Parent's Name" },
                                    { key: 'religion', label: 'Religion' },
                                    { key: 'state_from', label: 'State From', icon: MapPin },
                                ].map((field) => (
                                    <div key={field.key} className="space-y-1">
                                        <Label className="text-[10px] uppercase tracking-wide text-slate-400">{field.label}</Label>
                                        {isEditing ? (
                                            field.type === 'select' ? (
                                                <select
                                                    value={(formData as any)[field.key]}
                                                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                                    className="w-full h-8 px-2 text-sm rounded border border-slate-200 bg-white"
                                                >
                                                    <option value="">Select</option>
                                                    {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                            ) : (
                                                <Input
                                                    type={field.type || 'text'}
                                                    value={(formData as any)[field.key]}
                                                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                                    className="h-8 text-sm"
                                                />
                                            )
                                        ) : (
                                            <p className="text-sm text-slate-800 py-1">
                                                {field.type === 'date' && (formData as any)[field.key]
                                                    ? format(new Date((formData as any)[field.key]), 'MMM d, yyyy')
                                                    : (formData as any)[field.key] || '—'}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Work Information */}
                    <Card className="border-slate-200">
                        <CardContent className="p-4">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4">Work Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                <InfoItem label="Role" value={user.role.replace('_', ' ')} icon={Shield} />
                                <InfoItem label="Company ID" value={String(user.company_id)} icon={Building} />
                                {user.date_of_joining && (
                                    <InfoItem
                                        label="Date of Joining"
                                        value={format(new Date(user.date_of_joining), 'MMMM d, yyyy')}
                                        icon={Calendar}
                                    />
                                )}
                                {user.salary && (
                                    <InfoItem label="Salary" value={`₹${Number(user.salary).toLocaleString()}`} icon={Briefcase} />
                                )}
                                {user.assigned_state && (
                                    <InfoItem label="Assigned State" value={user.assigned_state} icon={MapPin} />
                                )}
                                {user.assigned_district && (
                                    <InfoItem label="Assigned District" value={user.assigned_district} icon={MapPin} />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-slate-200">
                        <CardContent className="p-4">
                            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                    { href: '/app/my-students', label: 'My Students', icon: Users },
                                    { href: '/app/tasks', label: 'My Tasks', icon: Target },
                                    { href: '/app/follow-ups', label: 'Follow-ups', icon: Clock },
                                    { href: '/app/documents', label: 'Documents', icon: FileText },
                                ].map((action) => (
                                    <Link
                                        key={action.href}
                                        href={action.href}
                                        className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-xs text-slate-600"
                                    >
                                        <action.icon size={14} className="text-slate-400" />
                                        {action.label}
                                        <ChevronRight size={12} className="ml-auto text-slate-300" />
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Password Modal */}
            <Dialog.Root open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
                    <Dialog.Content className="fixed left-[50%] top-[50%] w-[90vw] max-w-[380px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white shadow-xl z-50 outline-none">
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <Dialog.Title className="text-sm font-semibold text-slate-900">Change Password</Dialog.Title>
                            <Dialog.Close className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                                <X size={14} />
                            </Dialog.Close>
                        </div>

                        <div className="p-4 space-y-3">
                            {['current_password', 'new_password', 'confirm_password'].map((field, i) => (
                                <div key={field} className="space-y-1">
                                    <Label className="text-xs text-slate-600">
                                        {field === 'current_password' ? 'Current Password' : field === 'new_password' ? 'New Password' : 'Confirm Password'}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword[field.split('_')[0] as keyof typeof showPassword] ? 'text' : 'password'}
                                            value={(passwordData as any)[field]}
                                            onChange={(e) => setPasswordData({ ...passwordData, [field]: e.target.value })}
                                            className="h-9 text-sm pr-9"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword({ ...showPassword, [field.split('_')[0]]: !showPassword[field.split('_')[0] as keyof typeof showPassword] })}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                        >
                                            {showPassword[field.split('_')[0] as keyof typeof showPassword] ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="px-4 py-3 bg-slate-50 border-t flex justify-end gap-2 rounded-b-lg">
                            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)} className="h-8 text-xs">
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePasswordChange}
                                disabled={changePasswordMutation.isPending || !passwordData.new_password}
                                className="h-8 text-xs bg-slate-900 hover:bg-slate-800"
                            >
                                {changePasswordMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Change Password'}
                            </Button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
