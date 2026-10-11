import { NextResponse } from 'next/server';
import { lookupPromotion } from '../../../../lib/promotions.mjs';
import { requireUser } from '../../../../lib/routeAuth';

export const runtime = 'nodejs';

export async function POST(request) {
    const { error } = await requireUser();
    if (error) {
        return error;
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ applicable: false });
    }

    const promotion = await lookupPromotion(body?.code);
    if (!promotion) {
        return NextResponse.json({ applicable: false });
    }
    return NextResponse.json({
        applicable: true,
        discountPercent: promotion.discountPercent,
    });
}
