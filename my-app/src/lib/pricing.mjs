export const PRICE_BY_AGE_CENTS = {
    Adult: 1000,
    Child: 500,
    Senior: 700,
};

const SEAT_PATTERN = /^[A-E][1-8]$/;

function reject(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
}

export function quoteOrder({ selectedSeats, ageCategories, discountPercent = 0 }) {
    if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
        throw reject('Select at least one seat');
    }
    if (selectedSeats.length > 40) {
        throw reject('Too many seats');
    }

    const uniqueSeats = new Set(selectedSeats);
    if (uniqueSeats.size !== selectedSeats.length) {
        throw reject('Duplicate seats');
    }

    const discount = Number(discountPercent) || 0;
    if (discount < 0 || discount > 100) {
        throw reject('Invalid discount');
    }

    const lines = [];
    let subtotalCents = 0;
    for (const seat of selectedSeats) {
        if (typeof seat !== 'string' || !SEAT_PATTERN.test(seat)) {
            throw reject('Invalid seat');
        }
        const age = ageCategories?.[seat];
        const priceCents = PRICE_BY_AGE_CENTS[age];
        if (!priceCents) {
            throw reject('Invalid age category');
        }
        lines.push({ seat, age, price: priceCents / 100 });
        subtotalCents += priceCents;
    }

    const discountCents = Math.round(subtotalCents * (discount / 100));
    const totalCents = subtotalCents - discountCents;
    return {
        lines,
        subtotal: subtotalCents / 100,
        discountPercent: discount,
        total: totalCents / 100,
        subtotalCents,
        totalCents,
    };
}
