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
import { AlertCircle, BarChart3, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
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
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
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

    return (
        <div className="min-h-screen w-full flex">
            {/* Left Side - Visual & Branding */}
            <div className="hidden lg:flex w-[70%] bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
                <style jsx global>{`
                    @keyframes wave-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                    @keyframes wave-float-alt { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(15px); } }
                    .anim-wave-1 { animation: wave-float 6s ease-in-out infinite; }
                    .anim-wave-2 { animation: wave-float-alt 8s ease-in-out infinite; }
                `}</style>

                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-teal-900/40"></div>

                {/* Animated Wave Partition */}
                <div className="absolute top-[-10%] right-[-1px] bottom-[-10%] w-[120px] pointer-events-none z-20 h-[120%]">
                    <svg className="absolute top-0 right-0 h-full w-full text-teal-800/30 fill-current anim-wave-2" viewBox="0 0 100 800" preserveAspectRatio="none"><path d="M50 0 C 130 200, 10 400, 80 800 L 100 800 L 100 0 Z" /></svg>
                    <svg className="absolute top-0 right-0 h-full w-full text-white fill-current anim-wave-1" viewBox="0 0 100 800" preserveAspectRatio="none"><path d="M60 0 C 110 250, 20 550, 70 800 L 100 800 L 100 0 Z" /></svg>
                </div>

                {/* Logo Area */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <BarChart3 className="text-white h-6 w-6" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">Consultancy<span className="text-teal-400">Dev</span></span>
                </div>

                {/* Quote / Value Prop */}
                <div className="relative z-10 max-w-lg">
                    <blockquote className="space-y-6">
                        <div className="text-3xl font-medium leading-tight text-slate-100">
                            "Streamline your entire consultancy workflow with the most advanced management platform built for education."
                        </div>
                        <footer className="flex items-center gap-4 pt-4">
                            <div className="text-sm font-medium text-slate-400 italic">
                                "Yet to be trusted"
                            </div>
                        </footer>
                    </blockquote>
                </div>

                <div className="relative z-10 text-xs text-slate-400">
                    © 2026 ConsultancyDev Inc. Developed and managed in Nagaland.
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-[30%] bg-white flex items-center justify-center p-8">
                <div className="w-full max-w-[400px] space-y-8">
                    <div className="space-y-2 text-center lg:text-left">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
                        <p className="text-slate-500">
                            Enter your credentials to access your dashboard.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit((data) => onSubmit(data as any))} className="space-y-5">
                        {(localError || authError) && (
                            <div className="flex items-center gap-3 p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={18} className="shrink-0" />
                                <p>{localError || authError}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-sm font-medium text-slate-700">Email or Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="name@company.com"
                                    {...register('username')}
                                    disabled={isLoading}
                                    className="h-11 border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 focus:ring-teal-500 transition-all font-medium"
                                />
                                {errors.username && (
                                    <p className="text-sm text-red-500">{errors.username.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                                    <Link
                                        href="#"
                                        className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('password')}
                                        disabled={isLoading}
                                        className="h-11 border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 focus:ring-teal-500 pr-10 transition-all font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-500">{errors.password.message}</p>
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-200/50 transition-all hover:-translate-y-0.5"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing in...' : 'Sign in to Dashboard'}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-slate-500 font-medium">
                                    New to the platform?
                                </span>
                            </div>
                        </div>

                        <div className="text-center">
                            <Link
                                href="/signup"
                                className="inline-flex items-center text-sm font-semibold text-slate-900 hover:text-teal-600 transition-colors"
                            >
                                Require a new company account? <span className="ml-1 text-teal-600">Sign up</span>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
