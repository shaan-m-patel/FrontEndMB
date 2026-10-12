import { NextResponse } from 'next/server';
import { backendRequest } from '../../../lib/backend.mjs';
import { registrationPayload } from '../../../lib/cards.mjs';

export const runtime = 'nodejs';

export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: 'Invalid registration request' }, { status: 400 });
    }

    const payload = registrationPayload(body);
    if (!payload.name || !payload.email || !payload.password) {
        return NextResponse.json({ message: 'Name, email, and password are required' }, { status: 400 });
    }

    try {
        const result = await backendRequest('/register', { method: 'POST', body: payload });
        if (!result.ok) {
            return NextResponse.json({ message: 'Registration failed' }, { status: result.status || 400 });
        }
        return NextResponse.json({ message: 'Registration successful' });
    } catch {
        return NextResponse.json({ message: 'Registration failed' }, { status: 502 });
    }
}
