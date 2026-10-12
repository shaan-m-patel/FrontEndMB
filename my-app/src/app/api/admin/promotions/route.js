import { NextResponse } from 'next/server';
import { backendRequest } from '../../../../lib/backend.mjs';
import { requireAdmin } from '../../../../lib/routeAuth';

export const runtime = 'nodejs';

export async function POST(request) {
    const { error } = await requireAdmin();
    if (error) {
        return error;
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: 'Invalid promotion' }, { status: 400 });
    }

    const discount = Number(body?.discount);
    if (!body?.title || !body?.code || !body?.validUntil || !Number.isInteger(discount) || discount <= 0 || discount > 100) {
        return NextResponse.json({ message: 'Enter a valid promotion' }, { status: 400 });
    }

    try {
        const result = await backendRequest('/api/promotions/add', {
            method: 'POST',
            body: {
                title: body.title,
                code: body.code,
                validUntil: body.validUntil,
                discount,
            },
        });
        if (!result.ok) {
            return NextResponse.json({ message: 'Failed to add promotion' }, { status: result.status || 400 });
        }
        return NextResponse.json({ message: 'Promotion added' });
    } catch {
        return NextResponse.json({ message: 'Failed to add promotion' }, { status: 502 });
    }
}
