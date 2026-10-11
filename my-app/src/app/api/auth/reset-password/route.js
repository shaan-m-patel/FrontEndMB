import { NextResponse } from 'next/server';
import { backendRequest } from '../../../../lib/backend.mjs';
import { consumeResetToken, parseResetRequest } from '../../../../lib/resetTokens.mjs';

export const runtime = 'nodejs';

export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: 'A reset token is required.' }, { status: 400 });
    }

    const parsed = parseResetRequest(body);
    if (!parsed.ok) {
        return NextResponse.json({ message: parsed.message }, { status: 400 });
    }

    const redeemed = await consumeResetToken(parsed.token);
    if (!redeemed) {
        return NextResponse.json({ message: 'Reset link is invalid or expired.' }, { status: 400 });
    }

    try {
        const result = await backendRequest('/reset-password', {
            method: 'POST',
            body: {
                email: redeemed.email,
                password: parsed.password,
                token: parsed.token,
            },
        });
        if (!result.ok) {
            return NextResponse.json({ message: 'Failed to change password.' }, { status: 400 });
        }
    } catch {
        return NextResponse.json({ message: 'Failed to change password.' }, { status: 502 });
    }

    return NextResponse.json({ message: 'Password changed successfully.' });
}
