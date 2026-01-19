'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import {
    Building2,
    Mail,
    Phone,
    Globe,
    MapPin,
    DollarSign,
    Clock,
    Save,
    X,
    Loader2,
    Settings,
    Palette,
    Bell,
    Shield,
    Check,
    Sun,
    Moon,
    Monitor,
    Eye,
    Trash2,
    CreditCard,
    FileText,
    UserPlus,
    Calendar,
    AlertCircle,
    BellOff,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    actionUrl?: string;
}

export default function SettingsPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'company' | 'preferences' | 'notifications'>('company');

    // Theme state (would be persisted in localStorage in real implementation)
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
    const [compactMode, setCompactMode] = useState(false);
    const [animationsEnabled, setAnimationsEnabled] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Form State
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [address, setAddress] = useState('');
    const [currency, setCurrency] = useState('INR (₹)');
    const [timezone, setTimezone] = useState('Asia/Kolkata (GMT+5:30)');

    const { data: company, isLoading: isCompanyLoading } = useQuery({
        queryKey: ['company', 'current'],
        queryFn: apiClient.companies.getCurrent,
        enabled: !!user,
    });

    const { data: notifications = [], isLoading: isNotificationsLoading } = useQuery<Notification[]>({
        queryKey: ['notifications'],
        queryFn: apiClient.notifications.list,
    });

    useEffect(() => {
        if (company) {
            setCompanyName(company.name || '');
            setEmail(company.email || '');
            setPhone(company.phone || '');
            setWebsite(company.website || '');
            setAddress(company.address || '');
            setCurrency(company.currency || 'INR (₹)');
            setTimezone(company.timezone || 'Asia/Kolkata (GMT+5:30)');
        }
    }, [company]);

    const updateSettingsMutation = useMutation({
        mutationFn: (data: any) => apiClient.companies.update(company?.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company'] });
            toast.success('Settings saved successfully!');
        },
        onError: (error) => {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings. Please try again.');
        }
    });

    const markAsReadMutation = useMutation({
        mutationFn: apiClient.notifications.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: apiClient.notifications.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Notification deleted');
        },
    });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!company?.id) return;

        updateSettingsMutation.mutate({
            name: companyName,
            email,
            phone,
            website,
            address,
            currency,
            timezone
        });
    };

    const handleSavePreferences = () => {
        // In a real app, this would save to localStorage or backend
        toast.success('Preferences saved!');
    };

    const markAllRead = () => {
        notifications.forEach((n: Notification) => {
            if (!n.read) markAsReadMutation.mutate(n.id);
        });
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'payment': return <CreditCard size={14} className="text-green-600" />;
            case 'document': return <FileText size={14} className="text-blue-600" />;
            case 'follow-up': return <Bell size={14} className="text-amber-600" />;
            case 'enrollment': return <UserPlus size={14} className="text-purple-600" />;
            case 'appointment': return <Calendar size={14} className="text-teal-600" />;
            case 'Success': return <CheckCircle2 size={14} className="text-green-600" />;
            case 'Warning': return <AlertCircle size={14} className="text-amber-600" />;
            case 'Error': return <AlertCircle size={14} className="text-red-600" />;
            default: return <Bell size={14} className="text-slate-400" />;
        }
    };

    const CURRENCIES = [
        { value: 'INR (₹)', label: 'INR', flag: '🇮🇳' },
        { value: 'USD ($)', label: 'USD', flag: '🇺🇸' },
        { value: 'EUR (€)', label: 'EUR', flag: '🇪🇺' },
        { value: 'GBP (£)', label: 'GBP', flag: '🇬🇧' },
        { value: 'AED (د.إ)', label: 'AED', flag: '🇦🇪' },
    ];

    const TIMEZONES = [
        { value: 'Asia/Kolkata (GMT+5:30)', label: 'Asia/Kolkata', offset: 'GMT+5:30' },
        { value: 'UTC', label: 'UTC', offset: 'GMT+0:00' },
        { value: 'America/New_York', label: 'New York', offset: 'GMT-5:00' },
        { value: 'Europe/London', label: 'London', offset: 'GMT+0:00' },
        { value: 'Asia/Dubai', label: 'Dubai', offset: 'GMT+4:00' },
    ];

    const TABS = [
        { id: 'company', label: 'Company Profile', icon: Building2 },
        { id: 'preferences', label: 'Preferences', icon: Palette },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.filter(n => !n.read).length },
    ];

    const unreadCount = notifications.filter(n => !n.read).length;

    if (isCompanyLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                    <span className="text-sm text-slate-500">Loading settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">

            {/* Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Left Sidebar - Tabs */}
                <Card className="border-slate-200 lg:col-span-1 h-fit">
                    <CardContent className="p-2">
                        <nav className="space-y-1">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                                        activeTab === tab.id
                                            ? 'bg-teal-50 text-teal-700'
                                            : 'text-slate-600 hover:bg-slate-50'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <tab.icon size={16} />
                                        {tab.label}
                                    </div>
                                    {tab.badge && tab.badge > 0 && (
                                        <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </CardContent>
                </Card>

                {/* Right Content */}
                <div className="lg:col-span-3 space-y-4">
                    {activeTab === 'company' && (
                        <form onSubmit={handleSave} className="space-y-4">
                            {/* Company Info Card */}
                            <Card className="border-slate-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-teal-50 rounded-lg">
                                            <Building2 size={16} className="text-teal-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900">Company Information</h3>
                                            <p className="text-[11px] text-slate-500">Basic details about your company</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-slate-600">Company Name</Label>
                                            <div className="relative">
                                                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    value={companyName}
                                                    onChange={(e) => setCompanyName(e.target.value)}
                                                    className="h-9 pl-9 text-sm"
                                                    placeholder="Enter company name"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-slate-600">Contact Email</Label>
                                            <div className="relative">
                                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    type="email"
                                                    className="h-9 pl-9 text-sm"
                                                    placeholder="contact@company.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-slate-600">Phone Number</Label>
                                            <div className="relative">
                                                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="h-9 pl-9 text-sm"
                                                    placeholder="+91 12345 67890"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-slate-600">Website</Label>
                                            <div className="relative">
                                                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    value={website}
                                                    onChange={(e) => setWebsite(e.target.value)}
                                                    className="h-9 pl-9 text-sm"
                                                    placeholder="https://www.company.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="col-span-full space-y-1.5">
                                            <Label className="text-xs font-medium text-slate-600">Address</Label>
                                            <div className="relative">
                                                <MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
                                                <textarea
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    className="w-full min-h-[80px] pl-9 py-2 pr-3 text-sm rounded-md border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none"
                                                    placeholder="Enter full address"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Regional Settings Card */}
                            <Card className="border-slate-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Globe size={16} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900">Regional Settings</h3>
                                            <p className="text-[11px] text-slate-500">Currency and timezone preferences</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-slate-600">Default Currency</Label>
                                            <div className="grid grid-cols-5 gap-2">
                                                {CURRENCIES.map((c) => (
                                                    <button
                                                        key={c.value}
                                                        type="button"
                                                        onClick={() => setCurrency(c.value)}
                                                        className={cn(
                                                            "p-2 rounded-lg border text-center transition-all",
                                                            currency === c.value
                                                                ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                                                                : 'border-slate-200 hover:border-slate-300'
                                                        )}
                                                    >
                                                        <div className="text-lg">{c.flag}</div>
                                                        <div className="text-[10px] font-medium text-slate-600 mt-0.5">{c.label}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-slate-600">Time Zone</Label>
                                            <div className="space-y-2">
                                                {TIMEZONES.map((tz) => (
                                                    <button
                                                        key={tz.value}
                                                        type="button"
                                                        onClick={() => setTimezone(tz.value)}
                                                        className={cn(
                                                            "w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-left",
                                                            timezone === tz.value
                                                                ? 'border-teal-500 bg-teal-50'
                                                                : 'border-slate-200 hover:border-slate-300'
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={14} className="text-slate-400" />
                                                            <span className="text-xs font-medium text-slate-700">{tz.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-slate-500">{tz.offset}</span>
                                                            {timezone === tz.value && (
                                                                <Check size={14} className="text-teal-600" />
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" className="h-9 px-4 text-xs">
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateSettingsMutation.isPending}
                                    className="h-9 px-4 text-xs bg-teal-600 hover:bg-teal-700"
                                >
                                    {updateSettingsMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-3 h-3 mr-1" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="space-y-4">
                            {/* Theme Card */}
                            <Card className="border-slate-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-purple-50 rounded-lg">
                                            <Palette size={16} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900">Appearance</h3>
                                            <p className="text-[11px] text-slate-500">Customize your visual experience</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Theme Selection */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-medium text-slate-600">Theme</Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { id: 'light', label: 'Light', icon: Sun, desc: 'Bright and clear' },
                                                    { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
                                                    { id: 'system', label: 'System', icon: Monitor, desc: 'Match device' },
                                                ].map((t) => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setTheme(t.id as any)}
                                                        className={cn(
                                                            "p-3 rounded-lg border text-left transition-all",
                                                            theme === t.id
                                                                ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                                                                : 'border-slate-200 hover:border-slate-300'
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <t.icon size={16} className={theme === t.id ? 'text-teal-600' : 'text-slate-500'} />
                                                            <span className="text-sm font-medium text-slate-800">{t.label}</span>
                                                            {theme === t.id && <Check size={14} className="text-teal-600 ml-auto" />}
                                                        </div>
                                                        <p className="text-[10px] text-slate-500">{t.desc}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Toggle Options */}
                                        <div className="space-y-3 pt-2">
                                            {[
                                                { id: 'compact', label: 'Compact Mode', desc: 'Reduce spacing for more content', value: compactMode, setValue: setCompactMode },
                                                { id: 'animations', label: 'Animations', desc: 'Enable smooth transitions', value: animationsEnabled, setValue: setAnimationsEnabled },
                                                { id: 'sidebar', label: 'Collapsed Sidebar', desc: 'Start with minimal sidebar', value: sidebarCollapsed, setValue: setSidebarCollapsed },
                                            ].map((option) => (
                                                <div key={option.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">{option.label}</p>
                                                        <p className="text-[10px] text-slate-500">{option.desc}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => option.setValue(!option.value)}
                                                        className={cn(
                                                            "w-10 h-6 rounded-full transition-colors relative",
                                                            option.value ? 'bg-teal-600' : 'bg-slate-300'
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
                                                                option.value ? 'translate-x-5' : 'translate-x-1'
                                                            )}
                                                        />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Save Button */}
                            <div className="flex justify-end">
                                <Button onClick={handleSavePreferences} className="h-9 px-4 text-xs bg-teal-600 hover:bg-teal-700">
                                    <Save className="w-3 h-3 mr-1" />
                                    Save Preferences
                                </Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-4">
                            {/* Header with actions */}
                            <Card className="border-slate-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-amber-50 rounded-lg">
                                                <Bell size={16} className="text-amber-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900">Recent Notifications</h3>
                                                <p className="text-[11px] text-slate-500">
                                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} • {notifications.length} total
                                                </p>
                                            </div>
                                        </div>
                                        {unreadCount > 0 && (
                                            <Button onClick={markAllRead} variant="outline" size="sm" className="h-8 text-xs">
                                                <Check size={12} className="mr-1" /> Mark All Read
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Notifications List */}
                            {isNotificationsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <Card className="border-slate-200">
                                    <CardContent className="py-12 text-center">
                                        <BellOff size={40} className="mx-auto text-slate-300 mb-3" />
                                        <p className="text-sm text-slate-500">No notifications</p>
                                        <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-2">
                                    {notifications.slice(0, 10).map((notification) => (
                                        <Card
                                            key={notification.id}
                                            className={cn(
                                                "border transition-all",
                                                !notification.read
                                                    ? 'border-teal-200 bg-teal-50/30'
                                                    : 'border-slate-200 bg-white'
                                            )}
                                        >
                                            <CardContent className="p-3">
                                                <div className="flex items-start gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                                        !notification.read ? 'bg-teal-100' : 'bg-slate-100'
                                                    )}>
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h4 className="text-sm font-medium text-slate-900 truncate">{notification.title}</h4>
                                                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                                {format(new Date(notification.timestamp), 'MMM d, HH:mm')}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notification.message}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            {!notification.read && (
                                                                <button
                                                                    onClick={() => markAsReadMutation.mutate(notification.id)}
                                                                    className="text-[10px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                                                                >
                                                                    <Check size={10} /> Mark read
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => deleteMutation.mutate(notification.id)}
                                                                className="text-[10px] text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                                                            >
                                                                <Trash2 size={10} /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {notifications.length > 10 && (
                                        <p className="text-center text-xs text-slate-500 py-2">
                                            Showing 10 of {notifications.length} notifications
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
