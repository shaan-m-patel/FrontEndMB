import { NextResponse } from 'next/server';
import { getPaidBookingForUser } from '../../../../lib/bookingStore.mjs';
import { requireUser } from '../../../../lib/routeAuth';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
    const { session, error } = await requireUser();
    if (error) {
        return error;
    }

    const booking = await getPaidBookingForUser(params.id, session.email);
    if (!booking) {
        return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json(booking);
}
