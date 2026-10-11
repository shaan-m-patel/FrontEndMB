import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

process.env.SESSION_SECRET = 'test-session-secret-value';

const { quoteOrder } = await import('../src/lib/pricing.mjs');
const { toAllowedEmbedUrl, TRAILER_IFRAME_ALLOW } = await import('../src/lib/trailerUrl.mjs');
const { sanitizeProfile, sanitizeProfileUpdate, registrationPayload } = await import('../src/lib/cards.mjs');
const { createSessionToken, readSessionToken } = await import('../src/lib/session.mjs');
const {
    consumeResetToken,
    issueResetToken,
    parseResetRequest,
    setResetTokenStorePath,
} = await import('../src/lib/resetTokens.mjs');
const { completeCheckout } = await import('../src/lib/checkout.mjs');
const { assertPaymentMethod } = await import('../src/lib/payment.mjs');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

test('ticket prices come from age category and ignore a client total', () => {
    const quote = quoteOrder({
        selectedSeats: ['A1', 'A2'],
        ageCategories: { A1: 'Adult', A2: 'Child' },
        orderTotal: 0,
    });
    assert.equal(quote.subtotal, 15);
    assert.equal(quote.total, 15);
    assert.throws(() => quoteOrder({
        selectedSeats: ['A1'],
        ageCategories: { A1: 'Free' },
    }));
});

test('a promotion discount is applied once', () => {
    const quote = quoteOrder({
        selectedSeats: ['B1'],
        ageCategories: { B1: 'Adult' },
        discountPercent: 20,
    });
    assert.equal(quote.total, 8);
    assert.equal(quote.discountPercent, 20);
});

test('trailer embeds stay on YouTube or Vimeo and drop clipboard access', () => {
    assert.equal(
        toAllowedEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
        'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    );
    assert.equal(toAllowedEmbedUrl('https://vimeo.com/123456'), 'https://player.vimeo.com/video/123456');
    assert.equal(toAllowedEmbedUrl('https://evil.example/phish'), null);
    assert.equal(toAllowedEmbedUrl('javascript:alert(1)'), null);
    assert.equal(TRAILER_IFRAME_ALLOW.includes('clipboard'), false);
});

test('profile and registration payloads drop card numbers and security codes', () => {
    const updated = sanitizeProfileUpdate({
        email: 'victim@example.com',
        name: 'Ada',
        password: '',
        creditCards: [{
            cardLast4: '4242',
            expiryDate: '12/30',
            cvv: '123',
            creditCardNumber: '4242424242424242',
            paymentMethodId: 'pm_savedcard',
        }],
    });
    const serialized = JSON.stringify(updated);
    assert.equal(updated.email, undefined);
    assert.equal(updated.password, undefined);
    assert.equal(updated.creditCards[0].cvv, undefined);
    assert.equal(updated.creditCards[0].cardLast4, '4242');
    assert.equal(serialized.includes('4242424242424242'), false);
    assert.equal(serialized.includes('"cvv"'), false);

    const profile = sanitizeProfile({
        email: 'ada@example.com',
        creditCards: [{ cardNumber: '4242424242424242', cvv: '999', cardLast4: '4242', expiryDate: '01/30' }],
    });
    assert.equal(JSON.stringify(profile).includes('4242424242424242'), false);
    assert.equal(profile.creditCards[0].cvv, undefined);

    const registration = registrationPayload({
        name: 'Ada',
        email: 'ada@example.com',
        password: 'secret123',
        creditCardNumber: ['4242424242424242'],
        cvv: ['123'],
    });
    assert.equal(registration.creditCardNumber, undefined);
    assert.equal(registration.cvv, undefined);
});

test('session tokens are signed and expire', async () => {
    const token = await createSessionToken({
        email: 'ada@example.com',
        role: 'user',
        maxAgeSeconds: 60,
    });
    const session = await readSessionToken(token);
    assert.deepEqual(session, { email: 'ada@example.com', role: 'user' });
    assert.equal(await readSessionToken(`${token}x`), null);
    assert.equal(await readSessionToken(''), null);

    const expired = await createSessionToken({
        email: 'ada@example.com',
        role: 'admin',
        maxAgeSeconds: -10,
    });
    assert.equal(await readSessionToken(expired), null);
});

test('password reset rejects a bare email and consumes a token once', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'reset-tokens-'));
    setResetTokenStorePath(path.join(directory, 'tokens.json'));

    const missing = parseResetRequest({ email: 'admin@example.com', password: 'new-password' });
    assert.equal(missing.ok, false);

    const token = await issueResetToken('ada@example.com');
    const parsed = parseResetRequest({ email: 'victim@example.com', token, password: 'new-password' });
    assert.equal(parsed.ok, true);
    const first = await consumeResetToken(parsed.token);
    const second = await consumeResetToken(parsed.token);
    assert.equal(first.email, 'ada@example.com');
    assert.equal(second, null);
});

test('checkout charges the server price and does not book when payment fails', async () => {
    const input = {
        session: { email: 'ada@example.com', role: 'user' },
        movieName: 'Test',
        selectedDate: '2026-10-12',
        selectedTime: '19:00',
        selectedSeats: ['A1'],
        ageCategories: { A1: 'Adult' },
        paymentMethodId: 'pm_test123',
        orderTotal: 0,
        userEmail: 'victim@example.com',
    };
    const deps = {
        loadMovie: async () => ({ movieName: 'Test' }),
        lookupPromotion: async () => null,
        charge: async (payment) => ({ paymentId: 'pi_123', amountCents: payment.amountCents }),
        createBooking: async (record) => record,
    };

    let charged = null;
    const booked = await completeCheckout(input, {
        ...deps,
        charge: async (payment) => {
            charged = payment;
            return deps.charge(payment);
        },
    });
    assert.equal(charged.amountCents, 1000);
    assert.equal(booked.orderTotal, 10);
    assert.equal(booked.userEmail, 'ada@example.com');

    let created = false;
    await assert.rejects(() => completeCheckout(input, {
        ...deps,
        charge: async () => {
            throw Object.assign(new Error('Payment was not completed'), { status: 402 });
        },
        createBooking: async () => {
            created = true;
            return {};
        },
    }));
    assert.equal(created, false);
    assert.throws(() => assertPaymentMethod('4242424242424242'));
});

test('client pages no longer trust local identity, prices, or stored secrets', async () => {
    const files = {
        service: await readFile(path.join(root, 'src/app/movieService.js'), 'utf8'),
        login: await readFile(path.join(root, 'src/app/login/page.js'), 'utf8'),
        reset: await readFile(path.join(root, 'src/app/ResetPassword/ResetForm.js'), 'utf8'),
        home: await readFile(path.join(root, 'src/app/page.js'), 'utf8'),
        checkout: await readFile(path.join(root, 'src/app/CheckoutPage/page.js'), 'utf8'),
        confirmation: await readFile(path.join(root, 'src/app/OrderConfirmation/page.js'), 'utf8'),
        register: await readFile(path.join(root, 'src/app/register/page.js'), 'utf8'),
        profile: await readFile(path.join(root, 'src/app/profile/page.js'), 'utf8'),
        middleware: await readFile(path.join(root, 'src/middleware.js'), 'utf8'),
    };

    assert.equal(files.service.includes('localhost:9090/reset-password'), false);
    assert.equal(files.service.includes('/api/auth/reset-password'), true);
    assert.equal(files.service.includes('user-profile?email'), false);
    assert.equal(files.service.includes("console.log('Before API Call'"), false);
    assert.equal(files.login.includes("localStorage.setItem('password'"), false);
    assert.equal(files.login.includes('localStorage.removeItem(\'password\')'), true);
    assert.equal(files.reset.includes('searchParams.get(\'token\')'), true);
    assert.equal(files.reset.includes('resetPassword(token'), true);
    assert.equal(files.home.includes('clipboard-write'), false);
    assert.equal(files.checkout.includes('fetchPromotions'), false);
    assert.equal(files.checkout.includes('/api/promotions/validate'), true);
    assert.equal(files.checkout.includes('orderTotal'), false);
    assert.equal(files.confirmation.includes('createBooking'), false);
    assert.equal(files.confirmation.includes('bookingId'), true);
    assert.equal(files.register.includes('cvv'), false);
    assert.equal(files.profile.includes('cvv'), false);
    assert.equal(files.profile.includes('localStorage'), false);
    assert.equal(files.middleware.includes("session.role !== 'admin'"), true);
});
