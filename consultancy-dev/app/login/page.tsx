'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Role } from '@/lib/types';
import { AlertCircle, BarChart3, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const loginSchema = z.object({
    username: z.string().min(1, 'Username or email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading, error: authError, clearError } = useAuthStore();
    const [localError, setLocalError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setLocalError(null);
        clearError();

        try {
            await login(data.username, data.password);
            router.push('/app/dashboard');
        } catch (err) {
            setLocalError('Invalid username/email or password');
        }
    };

    const handleQuickLogin = (role: Role) => {
        if (role === 'DEV_ADMIN') {
            setValue('username', 'dev_admin');
            setValue('password', 'DevAdmin@2025');
        } else if (role === 'COMPANY_ADMIN') {
            setValue('username', 'testadmin');
            setValue('password', 'TestPass@123');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
            <div className="w-full max-w-md space-y-8">
                {/* Back to Home Button */}
                <Link
                    href="/"
                    className="inline-flex items-center text-sm text-slate-600 hover:text-teal-600 transition-colors font-body"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Home
                </Link>

                <div className="text-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 font-heading">
                        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                            <BarChart3 className="text-white h-5 w-5" />
                        </div>
                        Consultancy<span className="text-teal-600">Dev</span>
                    </Link>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 font-heading">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 font-body">
                        Don't have an account?{' '}
                        <Link href="/signup" className="font-medium text-teal-600 hover:text-teal-500 transition-colors">
                            Sign up here
                        </Link>
                    </p>
                </div>

                <Card className="border-slate-200 shadow-xl bg-white">
                    <CardContent className="pt-8 px-8 pb-8">
                        <form onSubmit={handleSubmit((data) => onSubmit(data as any))} className="space-y-6">
                            {(localError || authError) && (
                                <div className="flex items-center gap-2 p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertCircle size={18} />
                                    <p>{localError || authError}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-slate-700 font-medium font-body">Username or Email</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="dev_admin or email@example.com"
                                    {...register('username')}
                                    disabled={isLoading}
                                    className="h-11 border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                                />
                                {errors.username && (
                                    <p className="text-sm text-red-600 font-body">{errors.username.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-slate-700 font-medium font-body">Password</Label>
                                    <Link href="#" className="text-sm font-medium text-teal-600 hover:text-teal-500 transition-colors font-body">
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register('password')}
                                    disabled={isLoading}
                                    className="h-11 border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-600 font-body">{errors.password.message}</p>
                                )}
                            </div>



                            <Button type="submit" className="w-full h-11 font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all hover:translate-y-px font-body" disabled={isLoading}>
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </Button>
                        </form>

                        {/* Dev Only Controls */}
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <p className="text-xs text-center text-slate-400 uppercase tracking-wider font-bold mb-4 font-body">
                                Developer Quick Login
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                <Button variant="outline" size="sm" className="text-xs h-8 border-slate-200 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 transition-colors font-body" onClick={() => handleQuickLogin('DEV_ADMIN')} disabled={isLoading}>
                                    Dev Admin
                                </Button>
                                <Button variant="outline" size="sm" className="text-xs h-8 border-slate-200 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 transition-colors font-body" onClick={() => handleQuickLogin('COMPANY_ADMIN')} disabled={isLoading}>
                                    Manager
                                </Button>
                                <Button variant="outline" size="sm" className="text-xs h-8 border-slate-200 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 transition-colors font-body" onClick={() => handleQuickLogin('EMPLOYEE')} disabled={isLoading}>
                                    Employee
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
