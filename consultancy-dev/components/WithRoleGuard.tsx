'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface WithRoleGuardProps {
    allowedRoles: string[];
    redirectTo?: string;
    children: React.ReactNode;
}

export function WithRoleGuard({ allowedRoles, redirectTo = '/app/dashboard', children }: WithRoleGuardProps) {
    const router = useRouter();
    const { user, isAuthenticated, hasRole, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated || !user) {
                router.push('/login');
                return;
            }

            if (!hasRole(allowedRoles)) {
                router.push(redirectTo);
                return;
            }
        }
    }, [isAuthenticated, user, hasRole, isLoading, allowedRoles, redirectTo, router]);

    // Show loading state while checking auth
    if (isLoading || !isAuthenticated || !hasRole(allowedRoles)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return <>{children}</>;
}

// Helper HOC for easier use
export function withRoleGuard<P extends object>(
    Component: React.ComponentType<P>,
    allowedRoles: string[],
    redirectTo?: string
) {
    return function GuardedComponent(props: P) {
        return (
            <WithRoleGuard allowedRoles={allowedRoles} redirectTo={redirectTo}>
                <Component {...props} />
            </WithRoleGuard>
        );
    };
}
