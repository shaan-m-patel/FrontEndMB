import { createHash } from 'crypto';
import { quoteOrder } from './pricing.mjs';

function reject(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    return error;
}

export async function completeCheckout({
    session,
    movieName,
    selectedDate,
    selectedTime,
    selectedSeats,
    ageCategories,
    promotionCode,
    paymentMethodId,
}, deps) {
    if (!session?.email) {
        throw reject('Authentication required', 401);
    }
    if (!movieName || !selectedDate || !selectedTime) {
        throw reject('Movie, date, and time are required');
    }

    const movie = await deps.loadMovie({ movieName, selectedDate, selectedTime });
    if (!movie) {
        throw reject('That showing is not available', 404);
    }

    let discountPercent = 0;
    if (typeof promotionCode === 'string' && promotionCode.trim()) {
        const promotion = await deps.lookupPromotion(promotionCode);
        if (!promotion) {
            throw reject('Invalid promotion code');
        }
        discountPercent = promotion.discountPercent;
    }

    const quote = quoteOrder({ selectedSeats, ageCategories, discountPercent });

    let payment;
    if (quote.totalCents > 0) {
        const idempotencyKey = createHash('sha256')
            .update(JSON.stringify({
                email: session.email,
                movieName,
                selectedDate,
                selectedTime,
                selectedSeats,
                totalCents: quote.totalCents,
                paymentMethodId,
            }))
            .digest('hex');
        payment = await deps.charge({
            amountCents: quote.totalCents,
            paymentMethodId,
            idempotencyKey,
        });
    } else if (quote.discountPercent === 100) {
        payment = { paymentId: 'promo-comp', amountCents: 0 };
    } else {
        throw reject('Unable to price this order');
    }

    return deps.createBooking({
        userEmail: session.email,
        movieName,
        selectedDate,
        selectedTime,
        selectedSeats,
        ageCategories,
        order: quote.lines,
        orderTotal: quote.total,
        movieDate: selectedDate,
        movieTime: selectedTime,
        paymentId: payment.paymentId,
    });
}
