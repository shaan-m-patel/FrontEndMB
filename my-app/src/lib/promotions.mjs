import { backendRequest } from './backend.mjs';

export async function lookupPromotion(code) {
    if (typeof code !== 'string') {
        return null;
    }
    const trimmed = code.trim();
    if (!trimmed || trimmed.length > 64) {
        return null;
    }
    let result;
    try {
        result = await backendRequest('/api/promotions');
    } catch {
        return null;
    }
    if (!result.ok || !Array.isArray(result.data)) {
        return null;
    }
    const now = Date.now();
    const match = result.data.find((promotion) => {
        if (!promotion || promotion.code !== trimmed) {
            return false;
        }
        if (promotion.validUntil) {
            const expires = new Date(promotion.validUntil).getTime();
            if (Number.isFinite(expires) && expires < now) {
                return false;
            }
        }
        const discount = Number(promotion.discount);
        return Number.isFinite(discount) && discount > 0 && discount <= 100;
    });
    if (!match) {
        return null;
    }
    return { discountPercent: Number(match.discount) };
}
