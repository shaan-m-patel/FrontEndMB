const textEncoder = new TextEncoder();

function encodeBase64Url(bytes) {
    const view = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
    let binary = '';
    for (let i = 0; i < view.length; i += 1) {
        binary += String.fromCharCode(view[i]);
    }
    return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function decodeBase64Url(value) {
    const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (value.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function sessionSecret() {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 16) {
        throw new Error('SESSION_SECRET must be set to at least 16 characters');
    }
    return secret;
}

async function hmacKey() {
    return crypto.subtle.importKey(
        'raw',
        textEncoder.encode(sessionSecret()),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify'],
    );
}

export const SESSION_MAX_AGE = 60 * 60 * 8;
export const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30;

export function sessionCookieOptions(maxAgeSeconds) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeSeconds,
    };
}

export async function createSessionToken({ email, role, maxAgeSeconds }) {
    const payload = {
        email,
        role,
        exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
    };
    const payloadPart = encodeBase64Url(textEncoder.encode(JSON.stringify(payload)));
    const key = await hmacKey();
    const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(payloadPart));
    return `${payloadPart}.${encodeBase64Url(signature)}`;
}

export async function readSessionToken(token) {
    if (!token || typeof token !== 'string') {
        return null;
    }
    const parts = token.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return null;
    }
    try {
        const key = await hmacKey();
        const valid = await crypto.subtle.verify(
            'HMAC',
            key,
            decodeBase64Url(parts[1]),
            textEncoder.encode(parts[0]),
        );
        if (!valid) {
            return null;
        }
        const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
        if (!payload?.email || !payload?.role || !payload?.exp) {
            return null;
        }
        if (payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }
        return { email: payload.email, role: payload.role };
    } catch {
        return null;
    }
}
