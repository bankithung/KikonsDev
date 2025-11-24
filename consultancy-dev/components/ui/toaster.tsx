'use client';

import { useToastStore } from '@/store/toastStore';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const icons = {
    default: <Info className="w-5 h-5 text-slate-500" />,
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
};

const styles = {
    default: 'bg-white border-slate-200',
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
};

export function Toaster() {
    const { toasts, dismissToast } = useToastStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((t) => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        layout
                        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-lg border ${styles[t.type || 'default']} backdrop-blur-sm`}
                    >
                        <div className="shrink-0 mt-0.5">{icons[t.type || 'default']}</div>
                        <div className="flex-1 min-w-0">
                            {t.title && <h3 className="text-sm font-semibold text-slate-900">{t.title}</h3>}
                            {t.description && <p className="text-sm text-slate-600 mt-1">{t.description}</p>}
                        </div>
                        <button
                            onClick={() => dismissToast(t.id)}
                            className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
