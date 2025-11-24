'use client';

import Link from "next/link";
import {
    CheckCircle2,
    BarChart3,
    Users,
    Banknote,
    ChevronRight
} from "lucide-react";
import { FEATURES, PRICING_PLANS } from '@/lib/mockData';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { InteractiveDashboardPreview } from "@/components/InteractiveDashboardPreview";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { LandingFooter } from "@/components/layout/LandingFooter";

export default function LandingPage() {

    return (
        <div className="min-h-screen bg-white flex flex-col text-slate-900 selection:bg-teal-100">
            <LandingHeader />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative pt-10 pb-12 lg:pt-16 lg:pb-16 overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <div className="inline-flex items-center rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <span className="flex h-2 w-2 rounded-full bg-teal-600 mr-2"></span>
                            New: Multi-tenant Architecture v2.0
                        </div>

                        <h1 className="mx-auto max-w-5xl font-heading text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl mb-4 leading-[1.15] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                            <span className="block sm:whitespace-nowrap">Modernize Student Consulting,</span>
                            <span className="block sm:whitespace-nowrap"><span className="bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 inline-block text-transparent bg-clip-text relative">Transform</span> Student Success</span>
                        </h1>

                        <p className="mx-auto max-w-2xl text-xl text-slate-600 mb-6 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                            The all-in-one platform for educational consultancies. 11 powerful features to streamline enquiries, registrations, documents, payments, and more with enterprise-grade security.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 relative z-20">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-lg hover:shadow-teal-200/50 transition-all" asChild>
                                <Link href="/signup">
                                    Start 14 Day Free Trial
                                </Link>
                            </Button>
                        </div>

                        {/* Clean Multi-Device Mockup - Overlapping Layout */}
                        <div className="-mt-32 relative mx-auto max-w-[1400px] px-4">
                            {/* Devices Container - Centered & Clustered */}
                            <div className="relative mx-auto w-full h-[500px] sm:h-[650px] md:h-[800px] flex items-end justify-center">

                                {/* Laptop - Center (Main Backdrop) */}
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-12 sm:bottom-20 md:bottom-24 w-[400px] sm:w-[550px] md:w-[750px] lg:w-[900px] z-10 animate-in fade-in slide-in-from-bottom duration-1000 delay-100">
                                    <div className="relative">
                                        {/* Shadow */}
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[360px] sm:w-[500px] md:w-[700px] lg:w-[850px] h-8 bg-black/30 blur-3xl rounded-full"></div>

                                        <InteractiveDashboardPreview />

                                        {/* Laptop Base */}
                                        <div className="h-1.5 sm:h-2.5 bg-gradient-to-b from-slate-300 to-slate-400 rounded-b-lg mx-auto w-[90%] mt-0.5"></div>
                                        <div className="h-3 sm:h-4 bg-gradient-to-b from-slate-400 to-slate-500 mx-auto w-[110%] -mt-0.5 rounded-b-xl shadow-2xl"></div>
                                    </div>
                                </div>

                                {/* Tablet - Front Right (Overlapping Laptop) */}
                                <div className="absolute right-0 sm:right-8 md:right-16 lg:right-24 -bottom-4 sm:bottom-0 w-40 sm:w-60 md:w-80 lg:w-[350px] z-30 animate-in fade-in slide-in-from-right duration-1000 delay-300 hidden sm:block">
                                    <div className="relative">
                                        {/* Shadow */}
                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-36 sm:w-52 md:w-72 lg:w-[320px] h-6 bg-black/25 blur-2xl rounded-full"></div>

                                        <div className="relative rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-2 sm:p-3 shadow-2xl hover:scale-105 transition-transform duration-500">
                                            <div className="rounded-lg sm:rounded-xl bg-white overflow-hidden aspect-[3/4] border-2 sm:border-4 border-slate-800">
                                                <div className="h-full bg-slate-50 p-3 sm:p-5">
                                                    <div className="mb-3 sm:mb-5">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-5 h-5 sm:w-8 sm:h-8 bg-teal-600 rounded flex items-center justify-center">
                                                                <span className="text-[4px] sm:text-[6px] font-bold text-white">C</span>
                                                            </div>
                                                            <span className="text-[6px] sm:text-[8px] font-bold text-slate-900">ConsultancyDev</span>
                                                        </div>
                                                        <h3 className="text-[8px] sm:text-[10px] font-bold text-slate-900 mb-0.5">Dashboard</h3>
                                                        <p className="text-[5px] sm:text-[7px] text-slate-500">Overview</p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-5">
                                                        <div className="bg-blue-50 rounded-lg p-2 sm:p-3 border border-blue-100">
                                                            <p className="text-[5px] sm:text-[7px] text-slate-600 mb-0.5">Enquiries</p>
                                                            <p className="text-[8px] sm:text-[12px] font-bold text-slate-900">247</p>
                                                        </div>
                                                        <div className="bg-green-50 rounded-lg p-2 sm:p-3 border border-green-100">
                                                            <p className="text-[5px] sm:text-[7px] text-slate-600 mb-0.5">Active</p>
                                                            <p className="text-[8px] sm:text-[12px] font-bold text-slate-900">89</p>
                                                        </div>
                                                        <div className="bg-purple-50 rounded-lg p-2 sm:p-3 border border-purple-100">
                                                            <p className="text-[5px] sm:text-[7px] text-slate-600 mb-0.5">Enroll</p>
                                                            <p className="text-[8px] sm:text-[12px] font-bold text-slate-900">34</p>
                                                        </div>
                                                        <div className="bg-yellow-50 rounded-lg p-2 sm:p-3 border border-yellow-100">
                                                            <p className="text-[5px] sm:text-[7px] text-slate-600 mb-0.5">Pending</p>
                                                            <p className="text-[8px] sm:text-[12px] font-bold text-slate-900">12</p>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white rounded-lg border border-slate-200 p-2 sm:p-3">
                                                        <p className="text-[6px] sm:text-[8px] font-bold text-slate-900 mb-2">Activity</p>
                                                        <div className="flex items-end gap-1 sm:gap-1.5 h-24 sm:h-32">
                                                            <div className="w-full bg-gradient-to-t from-teal-400 to-teal-200 rounded-t h-[45%]"></div>
                                                            <div className="w-full bg-gradient-to-t from-teal-500 to-teal-300 rounded-t h-[65%]"></div>
                                                            <div className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t h-[85%]"></div>
                                                            <div className="w-full bg-gradient-to-t from-teal-500 to-teal-300 rounded-t h-[55%]"></div>
                                                            <div className="w-full bg-gradient-to-t from-teal-400 to-teal-200 rounded-t h-[70%]"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Phone - Front Left (Overlapping Laptop) */}
                                <div className="absolute left-0 sm:left-8 md:left-16 lg:left-24 -bottom-2 sm:bottom-4 w-20 sm:w-32 md:w-44 lg:w-52 z-30 animate-in fade-in slide-in-from-left duration-1000 delay-500 hidden sm:block">
                                    <div className="relative">
                                        {/* Shadow */}
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 sm:w-28 md:w-40 lg:w-48 h-4 bg-black/25 blur-2xl rounded-full"></div>

                                        <div className="relative rounded-[1.5rem] sm:rounded-[2.5rem] bg-gradient-to-br from-slate-800 to-slate-900 p-1.5 sm:p-2.5 shadow-2xl hover:scale-105 transition-transform duration-500">
                                            <div className="rounded-[1.2rem] sm:rounded-[2.2rem] bg-white overflow-hidden aspect-[9/19.5] border-2 sm:border-4 border-slate-800 relative">
                                                {/* Phone Notch */}
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-3 sm:h-5 bg-slate-900 rounded-b-xl z-10"></div>

                                                {/* Phone Screen */}
                                                <div className="h-full bg-slate-50 pt-6 sm:pt-8 px-2.5 sm:px-4 pb-3">
                                                    <div className="mb-3 sm:mb-5">
                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                            <div className="w-4 h-4 sm:w-6 sm:h-6 bg-teal-600 rounded flex items-center justify-center">
                                                                <span className="text-[3px] sm:text-[5px] font-bold text-white">C</span>
                                                            </div>
                                                            <span className="text-[5px] sm:text-[7px] font-bold text-slate-900">Consultancy</span>
                                                        </div>
                                                        <h3 className="text-[6px] sm:text-[8px] font-bold text-slate-900 mb-0.5">Dashboard</h3>
                                                        <p className="text-[4px] sm:text-[6px] text-slate-500">Welcome back</p>
                                                    </div>

                                                    <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-5">
                                                        <div className="bg-blue-50 rounded-lg p-2 sm:p-2.5 border border-blue-100 flex justify-between items-center">
                                                            <div>
                                                                <p className="text-[4px] sm:text-[6px] text-slate-600">Enquiries</p>
                                                                <p className="text-[6px] sm:text-[9px] font-bold text-slate-900">247</p>
                                                            </div>
                                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-400"></div>
                                                        </div>
                                                        <div className="bg-green-50 rounded-lg p-2 sm:p-2.5 border border-green-100 flex justify-between items-center">
                                                            <div>
                                                                <p className="text-[4px] sm:text-[6px] text-slate-600">Registered</p>
                                                                <p className="text-[6px] sm:text-[9px] font-bold text-slate-900">89</p>
                                                            </div>
                                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400"></div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white rounded-lg border border-slate-200 p-2 sm:p-2.5">
                                                        <p className="text-[5px] sm:text-[7px] font-bold text-slate-900 mb-1.5">Growth</p>
                                                        <div className="flex items-end gap-0.5 sm:gap-1 h-16 sm:h-24">
                                                            <div className="w-full bg-teal-300 rounded-t h-[40%]"></div>
                                                            <div className="w-full bg-teal-400 rounded-t h-[60%]"></div>
                                                            <div className="w-full bg-teal-500 rounded-t h-[80%]"></div>
                                                            <div className="w-full bg-teal-400 rounded-t h-[50%]"></div>
                                                            <div className="w-full bg-teal-300 rounded-t h-[65%]"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Trusted By */}
                        <div className="mt-24 border-t border-slate-100 pt-12">
                            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">Trusted by forward-thinking consultancies</p>
                            <div className="flex justify-center items-center">
                                <span className="text-2xl font-bold text-teal-600">NexxtEducation</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid - Redesigned */}
                <section id="product" className="py-24 relative overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute inset-0 bg-slate-50/50"></div>
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                    <div className="absolute -top-[300px] -right-[300px] w-[600px] h-[600px] bg-teal-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                    <div className="absolute -bottom-[300px] -left-[300px] w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <div className="inline-flex items-center rounded-full border border-teal-100 bg-white px-3 py-1 text-sm font-medium text-teal-700 mb-4 shadow-sm">
                                <span className="flex h-2 w-2 rounded-full bg-teal-500 mr-2 animate-pulse"></span>
                                Product Capabilities
                            </div>
                            <h2 className="text-4xl font-heading font-bold text-slate-900 sm:text-5xl mb-6 tracking-tight">
                                Everything you need to <br />
                                <span className="text-teal-600">manage your consultancy.</span>
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Built specifically for the education consultancy workflow. We've automated the busy work so you can focus on what matters most—your students.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {FEATURES.map((feature, i) => (
                                <div
                                    key={feature.name}
                                    className={`group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-teal-100 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-900/5 hover:-translate-y-1 ${i === 0 ? 'lg:col-span-2' : ''}`}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                    <div className="relative z-10">
                                        <div className="h-14 w-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 text-slate-600 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 transition-all duration-300 shadow-sm">
                                            <feature.icon size={28} strokeWidth={1.5} />
                                        </div>

                                        <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-teal-700 transition-colors">
                                            {feature.title}
                                        </h3>

                                        <p className="text-slate-500 leading-relaxed mb-6">
                                            {feature.description}
                                        </p>

                                        <div className="flex items-center text-sm font-semibold text-teal-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                            Learn more <ChevronRight size={16} className="ml-1" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Deep Dive: Members */}
                <section id="solutions" className="py-24 lg:py-32 bg-white overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="lg:grid lg:grid-cols-2 lg:gap-20 items-center">
                            <div className="mb-12 lg:mb-0">
                                <div className="inline-flex items-center rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 mb-6">
                                    <Users className="mr-2 h-4 w-4" /> Student Management
                                </div>
                                <h2 className="text-3xl font-heading font-bold text-slate-900 sm:text-4xl mb-6 leading-tight">
                                    A 360° view of every student application.
                                </h2>
                                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                    From initial enquiry to final visa approval, track every step. Store documents, notes, and communication history in one secure profile.
                                </p>

                                <div className="space-y-6">
                                    {[
                                        'Centralized database for all enquiries and leads.',
                                        'Status tracking pipeline (New -> Interested -> Applied).',
                                        'Document checklist and verification system.'
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start">
                                            <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-green-100 text-green-600 mt-0.5">
                                                <CheckCircle2 size={14} />
                                            </div>
                                            <span className="ml-4 text-slate-700 font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-r from-teal-100 to-slate-100 rounded-[2.5rem] transform rotate-2 opacity-60"></div>
                                <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                                    <div className="p-2 border-b border-slate-100 bg-slate-50 flex gap-2 items-center">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                        <div className="ml-3 text-[9px] text-slate-400">Student Profile</div>
                                    </div>
                                    <div className="p-6 sm:p-8">
                                        <div className="flex items-center gap-6 mb-8">
                                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center text-teal-600 ring-4 ring-teal-50">
                                                <Users size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-1">Chubatemjen Jamir</h3>
                                                <p className="text-sm text-slate-600">MBBS Application • ID: REG-2025-001</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                <span className="text-xs text-slate-500 font-medium">Email</span>
                                                <span className="text-xs text-slate-900 font-medium">chubatemjen@email.com</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                <span className="text-xs text-slate-500 font-medium">Phone</span>
                                                <span className="text-xs text-slate-900 font-medium">+91 98765 43210</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                <span className="text-xs text-slate-500 font-medium">Status</span>
                                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">Applied</span>
                                            </div>
                                            <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-100">
                                                <p className="text-xs font-semibold text-teal-900 mb-2">Recent Activity</p>
                                                <p className="text-[10px] text-teal-700">Documents verified • 2 hours ago</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Deep Dive: Finances */}
                <section className="py-24 lg:py-32 bg-slate-50 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="lg:grid lg:grid-cols-2 lg:gap-20 items-center">
                            <div className="order-2 lg:order-1 relative">
                                <div className="absolute -inset-4 bg-gradient-to-l from-green-100 to-teal-100 rounded-[2.5rem] transform -rotate-2 opacity-60"></div>
                                <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                                    <div className="p-2 border-b border-slate-100 bg-slate-50 flex gap-2 items-center">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                        <div className="ml-3 text-[9px] text-slate-400">Financial Dashboard</div>
                                    </div>
                                    <div className="p-6 sm:p-8">
                                        {/* Header */}
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900">Revenue Overview</h3>
                                                <p className="text-[10px] text-slate-500 mt-1">Last 4 quarters</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500">Total</p>
                                                <p className="text-lg font-bold text-teal-600">₹8.5L</p>
                                            </div>
                                        </div>

                                        {/* Chart */}
                                        <div className="w-full space-y-4">
                                            <div className="flex justify-between items-end h-40 gap-3 sm:gap-4 px-2">
                                                <div className="w-1/4 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-lg h-[40%] relative group cursor-pointer hover:from-teal-300 hover:to-teal-100 transition-all">
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white px-2 py-1 rounded text-[8px] font-bold whitespace-nowrap">₹1.8L</div>
                                                </div>
                                                <div className="w-1/4 bg-gradient-to-t from-slate-300 to-slate-100 rounded-t-lg h-[60%] relative group cursor-pointer hover:from-teal-400 hover:to-teal-200 transition-all">
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white px-2 py-1 rounded text-[8px] font-bold whitespace-nowrap">₹2.2L</div>
                                                </div>
                                                <div className="w-1/4 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg h-[85%] shadow-xl shadow-teal-300/50 relative cursor-pointer">
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-teal-600 text-white px-2 py-1 rounded text-[8px] font-bold whitespace-nowrap shadow-lg">₹2.8L</div>
                                                </div>
                                                <div className="w-1/4 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-lg h-[50%] relative group cursor-pointer hover:from-teal-300 hover:to-teal-100 transition-all">
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white px-2 py-1 rounded text-[8px] font-bold whitespace-nowrap">₹1.7L</div>
                                                </div>
                                            </div>
                                            <div className="h-px w-full bg-slate-200"></div>
                                            <div className="flex justify-between text-[10px] text-slate-500 px-2 font-medium">
                                                <span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 lg:order-2 mb-12 lg:mb-0">
                                <div className="inline-flex items-center rounded-full border border-green-100 bg-green-50 px-3 py-1 text-sm font-medium text-green-700 mb-6">
                                    <Banknote className="mr-2 h-4 w-4" /> Financial Control
                                </div>
                                <h2 className="text-3xl font-heading font-bold text-slate-900 sm:text-4xl mb-6 leading-tight">
                                    Never miss a payment deadline.
                                </h2>
                                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                    Automated fee tracking, installment management, and instant receipt generation. Get a clear view of your cash flow.
                                </p>

                                <div className="space-y-6">
                                    {[
                                        'Automated fee reminders for students.',
                                        'Support for partial payments and installments.',
                                        'Exportable financial reports for accounting.'
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start">
                                            <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-teal-100 text-teal-600 mt-0.5">
                                                <CheckCircle2 size={14} />
                                            </div>
                                            <span className="ml-4 text-slate-700 font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section id="pricing" className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-3xl font-heading font-bold text-slate-900 sm:text-4xl mb-6">Transparent Pricing</h2>
                            <p className="text-lg text-slate-600">
                                Simple pricing that scales with your consultancy. All plans include core features.
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
                            {PRICING_PLANS.map((plan) => (
                                <Card key={plan.name} className={`flex flex-col border-2 ${plan.popular ? 'border-teal-600 shadow-2xl scale-105 z-10' : 'border-slate-100 hover:border-teal-200 hover:shadow-xl'} transition-all duration-300 rounded-2xl`}>
                                    <CardHeader className="p-8 pb-0">
                                        {plan.popular && (
                                            <div className="inline-block px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-bold tracking-wide uppercase mb-4 w-fit">
                                                Most Popular
                                            </div>
                                        )}
                                        <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
                                        <CardDescription className="text-base mt-2 text-slate-500">{plan.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 p-8">
                                        <div className="mb-8 flex items-baseline">
                                            <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                                            {plan.price !== 'Custom' && <span className="text-slate-500 ml-2">/mo</span>}
                                        </div>
                                        <ul className="space-y-4">
                                            {plan.features.map((feature) => (
                                                <li key={feature} className="flex items-start">
                                                    <CheckCircle2 className="h-5 w-5 text-teal-600 mr-3 shrink-0" />
                                                    <span className="text-sm text-slate-600 font-medium">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter className="p-8 pt-0">
                                        <Button className={`w-full h-12 text-base font-semibold rounded-xl ${plan.popular ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200'}`} asChild>
                                            <Link href="/signup">{plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}</Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 bg-teal-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                    <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                        <h2 className="text-3xl font-heading font-bold text-white sm:text-5xl mb-8 leading-tight">Ready to grow your consultancy?</h2>
                        <p className="text-xl text-teal-100 mb-10 max-w-2xl mx-auto font-medium">
                            Join over 150+ consultancies that trust Consultancy Dev for their operations.
                        </p>
                        <Button size="lg" variant="secondary" className="h-14 px-10 text-lg rounded-full font-bold text-teal-600 bg-white hover:bg-teal-50 shadow-2xl" asChild>
                            <Link href="/signup">Start 14 Day Free Trial</Link>
                        </Button>
                        <p className="mt-6 text-sm text-teal-200 font-medium">No credit card required • Cancel anytime</p>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
}
