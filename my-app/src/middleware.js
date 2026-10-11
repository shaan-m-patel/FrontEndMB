import { NextResponse } from 'next/server';
import { readSessionToken } from './lib/session.mjs';

const ADMIN_PREFIXES = ['/admin', '/ManageMovie', '/ManageUser', '/promotions', '/api/admin'];

function isAdminPath(pathname) {
    return ADMIN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('session')?.value;
    let session = null;
    try {
        session = await readSessionToken(token);
    } catch {
        session = null;
    }

    const isApi = pathname.startsWith('/api/');
    if (!session) {
        if (isApi) {
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isAdminPath(pathname) && session.role !== 'admin') {
        if (isApi) {
            return NextResponse.json({ message: 'Administrator access required' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin',
        '/admin/:path*',
        '/ManageMovie',
        '/ManageMovie/:path*',
        '/ManageUser',
        '/ManageUser/:path*',
        '/promotions',
        '/promotions/:path*',
        '/profile',
        '/profile/:path*',
        '/orderHistory',
        '/orderHistory/:path*',
        '/CheckoutPage',
        '/CheckoutPage/:path*',
        '/OrderConfirmation',
        '/OrderConfirmation/:path*',
        '/OrderSummary',
        '/OrderSummary/:path*',
        '/tickets/:path*',
        '/api/admin/:path*',
        '/api/profile',
        '/api/profile/:path*',
        '/api/bookings',
        '/api/bookings/:path*',
        '/api/checkout/:path*',
        '/api/promotions/:path*',
    ],
};
