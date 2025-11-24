'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';

export default function SettingsPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

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
        enabled: !!user, // Only fetch if user is logged in
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
            alert('Settings Saved!');
        },
        onError: (error) => {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings. Please try again.');
        }
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

    if (isCompanyLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-slate-500">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Settings</h1>
                <p className="text-sm text-slate-600 mt-1">Manage your company profile and preferences</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card className="border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Company Profile</CardTitle>
                        <CardDescription>Update your company details and contact information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">Company Name</Label>
                                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">Contact Email</Label>
                                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">Phone Number</Label>
                                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">Website</Label>
                                <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="h-11" />
                            </div>
                            <div className="col-span-full space-y-2">
                                <Label className="text-slate-700 font-medium">Address</Label>
                                <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-11" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Preferences</CardTitle>
                        <CardDescription>Configure your default settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">Default Currency</Label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                                >
                                    <option>INR (₹)</option>
                                    <option>USD ($)</option>
                                    <option>EUR (€)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">Time Zone</Label>
                                <select
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                                >
                                    <option>Asia/Kolkata (GMT+5:30)</option>
                                    <option>UTC</option>
                                    <option>America/New_York</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" className="h-11 px-6">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={updateSettingsMutation.isPending} className="h-11 px-6 bg-teal-600 hover:bg-teal-700">
                        {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
