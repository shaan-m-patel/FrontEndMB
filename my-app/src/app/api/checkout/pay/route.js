import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { backendRequest } from '../../../../lib/backend.mjs';
import { savePaidBooking } from '../../../../lib/bookingStore.mjs';
import { completeCheckout } from '../../../../lib/checkout.mjs';
import { chargePayment } from '../../../../lib/payment.mjs';
import { lookupPromotion } from '../../../../lib/promotions.mjs';
import { requireUser } from '../../../../lib/routeAuth';

export const runtime = 'nodejs';

async function loadMovie({ movieName, selectedDate, selectedTime }) {
    let result;
    try {
        result = await backendRequest('/get-movies');
    } catch {
        return null;
    }
    if (!result.ok || !result.data) {
        return null;
    }
    const movies = [
        ...(result.data.currentlyRunning || []),
        ...(result.data.comingSoon || []),
    ];
    const movie = movies.find((item) => item.movieName === movieName);
    if (!movie) {
        return null;
    }
    const dates = (movie.showDates || []).map((date) => String(date));
    const times = (movie.showTimes || []).map((time) => String(time));
    if (!dates.includes(String(selectedDate)) || !times.includes(String(selectedTime))) {
        return null;
    }
    return movie;
}

async function createBooking(booking) {
    const id = randomUUID();
    const record = { ...booking, id };
    try {
        await backendRequest('/api/bookings', { method: 'POST', body: record });
    } catch (error) {
        console.error('Paid booking could not be forwarded to the catalog service');
    }
    try {
        await backendRequest('/send-confirmation-email', {
            method: 'POST',
            body: {
                userEmail: record.userEmail,
                movieName: record.movieName,
                movieDate: record.movieDate,
                movieTime: record.movieTime,
                order: record.order,
                orderTotal: record.orderTotal,
                paymentId: record.paymentId,
            },
        });
    } catch (error) {
        console.error('Confirmation email could not be sent');
    }
    return savePaidBooking(record);
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
        return NextResponse.json({ message: 'Invalid payment request' }, { status: 400 });
    }

    try {
        const booking = await completeCheckout({
            session,
            movieName: body.movieName,
            selectedDate: body.selectedDate,
            selectedTime: body.selectedTime,
            selectedSeats: body.selectedSeats,
            ageCategories: body.ageCategories,
            promotionCode: body.promotionCode,
            paymentMethodId: body.paymentMethodId,
        }, {
            loadMovie,
            lookupPromotion,
            charge: chargePayment,
            createBooking,
        });
        return NextResponse.json({ bookingId: booking.id, orderTotal: booking.orderTotal });
    } catch (checkoutError) {
        const status = checkoutError.status || 502;
        const message = checkoutError.status ? checkoutError.message : 'Payment could not be completed';
        return NextResponse.json({ message }, { status });
    }
}
