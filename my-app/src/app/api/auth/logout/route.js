import { NextResponse } from 'next/server';
import { sessionCookieOptions } from '../../../../lib/session.mjs';

export async function POST() {
    const response = NextResponse.json({ ok: true });
    response.cookies.set('session', '', { ...sessionCookieOptions(0), maxAge: 0 });
    return response;
}
