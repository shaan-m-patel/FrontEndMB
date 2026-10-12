const PAYMENT_METHOD_PATTERN = /^(pm|tok)_[A-Za-z0-9]+$/;

export function assertPaymentMethod(paymentMethodId) {
    if (typeof paymentMethodId !== 'string' || !PAYMENT_METHOD_PATTERN.test(paymentMethodId)) {
        const error = new Error('A payment processor token is required');
        error.status = 400;
        throw error;
    }
}

export async function chargePayment({ amountCents, paymentMethodId, idempotencyKey }) {
    assertPaymentMethod(paymentMethodId);
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
        const error = new Error('Unable to price this order');
        error.status = 400;
        throw error;
    }
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
        const error = new Error('Payment processor is not configured');
        error.status = 503;
        throw error;
    }

    const body = new URLSearchParams({
        amount: String(amountCents),
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: 'true',
        'payment_method_types[]': 'card',
    });
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${secret}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Idempotency-Key': idempotencyKey,
        },
        body,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.status !== 'succeeded' || data.amount !== amountCents) {
        const error = new Error('Payment was not completed');
        error.status = 402;
        throw error;
    }
    return { paymentId: data.id, amountCents: data.amount };
}
