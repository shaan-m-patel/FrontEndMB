import { NextResponse } from 'next/server';
import { backendRequest } from '../../../lib/backend.mjs';
import { sanitizeProfile, sanitizeProfileUpdate } from '../../../lib/cards.mjs';
import { requireUser } from '../../../lib/routeAuth';

export const runtime = 'nodejs';

export async function GET() {
    const { session, error } = await requireUser();
    if (error) {
        return error;
    }

    try {
        const result = await backendRequest('/user-profile', {
            searchParams: { email: session.email },
        });
        if (!result.ok) {
            return NextResponse.json({ message: 'Failed to fetch user profile' }, { status: result.status || 502 });
        }
        if (result.data?.email && result.data.email !== session.email) {
            return NextResponse.json({ message: 'Failed to fetch user profile' }, { status: 403 });
        }
        return NextResponse.json(sanitizeProfile({ ...result.data, email: session.email }));
    } catch {
        return NextResponse.json({ message: 'Failed to fetch user profile' }, { status: 502 });
    }
}

export async function POST(request) {
    const { session, error } = await requireUser();
    if (error) {
        return error;
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: 'Invalid profile update' }, { status: 400 });
    }

    const update = sanitizeProfileUpdate(body);
    update.email = session.email;

    try {
        const result = await backendRequest('/update-profile', { method: 'POST', body: update });
        if (!result.ok) {
            return NextResponse.json({ message: 'Failed to update profile' }, { status: result.status || 400 });
        }
        return NextResponse.json({ message: 'Profile updated' });
    } catch {
        return NextResponse.json({ message: 'Failed to update profile' }, { status: 502 });
    }
}
