export function paymentProcessorConfigured() {
    return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

export async function tokenizeCard({ number, expiry, cvc }) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
        throw new Error('Card entry is unavailable until the payment processor is configured.');
    }

    const digits = String(number || '').replace(/\D/g, '');
    const match = String(expiry || '').trim().match(/^(0[1-9]|1[0-2])\s*\/?\s*(\d{2}|\d{4})$/);
    const securityCode = String(cvc || '').replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19 || !match || securityCode.length < 3 || securityCode.length > 4) {
        throw new Error('Enter a valid card number, expiry, and security code.');
    }

    let expYear = match[2];
    if (expYear.length === 2) {
        expYear = `20${expYear}`;
    }

    const body = new URLSearchParams({
        type: 'card',
        'card[number]': digits,
        'card[exp_month]': String(Number(match[1])),
        'card[exp_year]': expYear,
        'card[cvc]': securityCode,
    });
    const response = await fetch('https://api.stripe.com/v1/payment_methods', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.id || !data.card?.last4) {
        throw new Error(data?.error?.message || 'The payment processor rejected the card.');
    }

    return {
        paymentMethodId: data.id,
        cardLast4: data.card.last4,
        expiryDate: `${String(data.card.exp_month).padStart(2, '0')}/${String(data.card.exp_year).slice(-2)}`,
    };
}
