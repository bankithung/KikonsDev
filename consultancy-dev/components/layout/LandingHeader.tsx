'use client';

import Link from "next/link";
import { useState } from "react";
import {
    Menu,
    X,
    BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LandingHeader() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                        <BarChart3 className="text-white h-5 w-5" />
                    </div>
                    <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
                        Consultancy<span className="text-teal-600">Dev</span>
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/#product" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Product</Link>
                    <Link href="/#solutions" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Solutions</Link>
                    <Link href="/#pricing" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Pricing</Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Link href="/login" className="hidden md:inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 h-9 px-4 py-2 text-slate-600 hover:text-slate-900">
                        Sign In
                    </Link>
                    <Link href="/signup" className="hidden md:inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-teal-600 text-white hover:bg-teal-700 h-9 px-4 py-2 shadow-sm">
                        Sign Up
                    </Link>
                    <button
                        className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-slate-200 bg-white overflow-hidden"
                    >
                        <div className="px-4 py-6 space-y-4 flex flex-col">
                            <Link
                                href="/#product"
                                className="text-base font-medium text-slate-600 hover:text-teal-600 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Product
                            </Link>
                            <Link
                                href="/#solutions"
                                className="text-base font-medium text-slate-600 hover:text-teal-600 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Solutions
                            </Link>
                            <Link
                                href="/#pricing"
                                className="text-base font-medium text-slate-600 hover:text-teal-600 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Pricing
                            </Link>
                            <hr className="border-slate-100" />
                            <Link
                                href="/login"
                                className="text-base font-medium text-slate-600 hover:text-teal-600 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className="text-base font-medium text-teal-600 hover:text-teal-700 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Sign Up
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
