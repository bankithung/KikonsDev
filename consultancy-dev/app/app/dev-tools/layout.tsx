'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DevToolsLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (user && user.role !== 'DEV_ADMIN') {
            router.push('/app/dashboard');
        }
    }, [user, router]);

    if (!user || user.role !== 'DEV_ADMIN') return null;

    return <div className="p-4 border-4 border-dashed border-red-100 rounded-lg">{children}</div>;
}

