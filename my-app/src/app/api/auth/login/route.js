import { NextResponse } from 'next/server';
import { backendRequest } from '../../../../lib/backend.mjs';
import {
    REMEMBER_MAX_AGE,
    SESSION_MAX_AGE,
    createSessionToken,
    sessionCookieOptions,
} from '../../../../lib/session.mjs';

export const runtime = 'nodejs';

export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: 'Invalid login request' }, { status: 400 });
    }

    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) {
        return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    let result;
    try {
        result = await backendRequest('/login', {
            method: 'POST',
            body: { email, password },
        });
    } catch {
        return NextResponse.json({ message: 'Login failed' }, { status: 502 });
    }

    const role = result.data?.role || result.data?.user?.role || result.data?.userRole;
    if (!result.ok || (role !== 'admin' && role !== 'user')) {
        return NextResponse.json({ message: 'Login failed' }, { status: 401 });
    }

    const sessionEmail = result.data?.email || result.data?.user?.email || email;
    const maxAge = body.rememberMe ? REMEMBER_MAX_AGE : SESSION_MAX_AGE;
    const token = await createSessionToken({
        email: sessionEmail,
        role,
        maxAgeSeconds: maxAge,
    });
    const response = NextResponse.json({ role });
    response.cookies.set('session', token, sessionCookieOptions(maxAge));
    return response;
}
