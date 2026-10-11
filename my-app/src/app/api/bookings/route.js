import { NextResponse } from 'next/server';
import { backendRequest } from '../../../lib/backend.mjs';
import { requireUser } from '../../../lib/routeAuth';

export const runtime = 'nodejs';

export async function GET() {
    const { session, error } = await requireUser();
    if (error) {
        return error;
    }

    try {
        const result = await backendRequest('/api/bookings', {
            searchParams: { email: session.email },
        });
        if (!result.ok) {
            return NextResponse.json({ message: 'Failed to fetch bookings' }, { status: result.status || 502 });
        }
        const rows = Array.isArray(result.data) ? result.data : [];
        const mine = rows.filter((row) => {
            const owner = row?.userEmail || row?.email;
            return !owner || owner === session.email;
        });
        return NextResponse.json(mine);
    } catch {
        return NextResponse.json({ message: 'Failed to fetch bookings' }, { status: 502 });
    }
}
