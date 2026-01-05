'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Building, Shield } from 'lucide-react';

export default function ProfilePage() {
    const { user, checkAuth } = useAuthStore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                username: user.username || '',
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!user?.id) return;

            // Call API to update user
            await apiClient.users.update(String(user.id), {
                first_name: formData.first_name,
                last_name: formData.last_name,
                // email: formData.email, // Email usually restricted
            });

            // Refresh local user state
            await checkAuth();

            toast({
                title: "Profile Updated",
                description: "Your profile information has been updated successfully.",
                type: "success",
            });
        } catch (error) {
            console.error("Failed to update profile", error);
            toast({
                title: "Update Failed",
                description: "Could not update profile. Please try again.",
                type: "error",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return <div className="p-8 text-center">Loading profile...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
                <p className="text-slate-500 mt-2">Manage your personal information and account settings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Summary */}
                <Card className="md:col-span-1 border-slate-200 shadow-sm h-fit">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 relative group cursor-pointer">
                            <Avatar className="w-32 h-32 border-4 border-slate-50 shadow-md">
                                <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=0D9488&color=fff`} />
                                <AvatarFallback className="text-2xl bg-teal-100 text-teal-700">
                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            {/* <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium">Change</span>
                </div> */}
                        </div>
                        <CardTitle className="text-xl">{user.first_name} {user.last_name}</CardTitle>
                        <CardDescription className="font-medium text-teal-600">{user.role.replace('_', ' ')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-slate-600 p-3 bg-slate-50 rounded-md">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600 p-3 bg-slate-50 rounded-md">
                            <Building className="w-4 h-4 text-slate-400" />
                            <span className="truncate">Company ID: {user.company_id}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Edit Form */}
                <Card className="md:col-span-2 border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your personal details here.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="first_name"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="last_name"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            readOnly
                                            className="pl-10 bg-slate-50 text-slate-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400">Email cannot be changed directly. Contact admin.</p>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="username">Username</Label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="username"
                                            name="username"
                                            value={formData.username}
                                            readOnly
                                            className="pl-10 bg-slate-50 text-slate-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <Button type="button" variant="outline">Cancel</Button>
                                <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
