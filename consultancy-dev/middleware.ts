import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route access rules
const routeAccess: Record<string, string[]> = {
    '/app/dev-tools': ['DEV_ADMIN'],
    '/app/users': ['COMPANY_ADMIN', 'DEV_ADMIN'],
    '/app/counselors': ['COMPANY_ADMIN', 'DEV_ADMIN'],
    '/app/lead-sources': ['COMPANY_ADMIN', 'DEV_ADMIN'],
    '/app/earnings': ['COMPANY_ADMIN', 'DEV_ADMIN'],
    '/app/commissions': ['COMPANY_ADMIN'],
    '/app/settings': ['COMPANY_ADMIN', 'DEV_ADMIN'],
};

// Public routes that don't require authentication
const publicRoutes = ['/', '/signup', '/privacy', '/terms', '/contact', '/help'];

// Routes that require authentication but are accessible to all roles
const protectedRoutes = ['/app'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Redirect /login to /
    if (pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Allow public routes
    if (publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
        return NextResponse.next();
    }

    // Check if user is authenticated
    const token = request.cookies.get('auth-token')?.value ||
        request.headers.get('authorization')?.replace('Bearer ', '');

    // If no token and trying to access protected route, redirect to login
    if (!token && (pathname.startsWith('/app') || protectedRoutes.some(route => pathname.startsWith(route)))) {
        const loginUrl = new URL('/', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // For role-specific routes, check in client-side (we can't decode JWT server-side easily without additional library)
    // The actual role check will happen in page components using authStore

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
