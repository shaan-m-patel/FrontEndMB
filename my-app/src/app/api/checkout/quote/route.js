import { NextResponse } from 'next/server';
import { quoteOrder } from '../../../../lib/pricing.mjs';
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
        return NextResponse.json({ message: 'Invalid quote request' }, { status: 400 });
    }

    let discountPercent = 0;
    if (typeof body.promotionCode === 'string' && body.promotionCode.trim()) {
        const promotion = await lookupPromotion(body.promotionCode);
        if (!promotion) {
            return NextResponse.json({ message: 'Invalid promotion code' }, { status: 400 });
        }
        discountPercent = promotion.discountPercent;
    }

    try {
        const quote = quoteOrder({
            selectedSeats: body.selectedSeats,
            ageCategories: body.ageCategories,
            discountPercent,
        });
        return NextResponse.json({
            lines: quote.lines,
            subtotal: quote.subtotal,
            discountPercent: quote.discountPercent,
            total: quote.total,
        });
    } catch (quoteError) {
        return NextResponse.json({ message: quoteError.message }, { status: quoteError.status || 400 });
    }
}
