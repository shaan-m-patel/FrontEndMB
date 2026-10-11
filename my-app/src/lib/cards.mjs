const PAYMENT_METHOD_PATTERN = /^(pm|tok)_[A-Za-z0-9]+$/;

export function publicCard(card) {
    if (!card || typeof card !== 'object') {
        return null;
    }
    const last4 = String(card.cardLast4 || card.last4 || '').replace(/\D/g, '').slice(-4);
    if (last4.length !== 4) {
        return null;
    }
    const paymentMethodId = typeof card.paymentMethodId === 'string' && PAYMENT_METHOD_PATTERN.test(card.paymentMethodId)
        ? card.paymentMethodId
        : undefined;
    const expiryDate = typeof card.expiryDate === 'string' ? card.expiryDate.slice(0, 7) : '';
    return {
        cardLast4: last4,
        expiryDate,
        ...(paymentMethodId ? { paymentMethodId } : {}),
    };
}

export function sanitizeProfile(profile) {
    if (!profile || typeof profile !== 'object') {
        return {};
    }
    const cards = Array.isArray(profile.creditCards)
        ? profile.creditCards.map(publicCard).filter(Boolean)
        : [];
    return {
        name: profile.name || '',
        email: profile.email || '',
        billingAddress: profile.billingAddress || '',
        city: profile.city || '',
        postalCode: profile.postalCode || '',
        state: profile.state || '',
        promotionOptIn: Boolean(profile.promotionOptIn),
        creditCards: cards,
    };
}

export function sanitizeProfileUpdate(body) {
    const source = body && typeof body === 'object' ? body : {};
    const clean = {};
    for (const key of ['name', 'billingAddress', 'city', 'postalCode', 'state']) {
        if (typeof source[key] === 'string') {
            clean[key] = source[key];
        }
    }
    if (typeof source.password === 'string' && source.password) {
        clean.password = source.password;
        if (typeof source.currentPassword === 'string') {
            clean.currentPassword = source.currentPassword;
        }
    }
    if (typeof source.promotionOptIn === 'boolean') {
        clean.promotionOptIn = source.promotionOptIn;
    } else if (typeof source.promotions === 'boolean') {
        clean.promotionOptIn = source.promotions;
    }
    if (Array.isArray(source.creditCards)) {
        clean.creditCards = source.creditCards.map(publicCard).filter(Boolean);
    }
    return clean;
}

export function registrationPayload(body) {
    const source = body && typeof body === 'object' ? body : {};
    return {
        name: typeof source.name === 'string' ? source.name : '',
        email: typeof source.email === 'string' ? source.email : '',
        password: typeof source.password === 'string' ? source.password : '',
        billingAddress: typeof source.billingAddress === 'string' ? source.billingAddress : '',
        city: typeof source.city === 'string' ? source.city : '',
        postalCode: typeof source.postalCode === 'string' ? source.postalCode : '',
        state: typeof source.state === 'string' ? source.state : '',
        promotionOptIn: Boolean(source.promotionOptIn),
    };
}
