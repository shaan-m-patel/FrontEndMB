import { NextResponse } from 'next/server';
import { backendRequest } from '../../../../lib/backend.mjs';
import { issueResetToken, parseForgotRequest } from '../../../../lib/resetTokens.mjs';

export const runtime = 'nodejs';

const GENERIC_MESSAGE = 'If an account exists for that email, a reset link has been sent.';

export async function POST(request) {
    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 });
    }

    const parsed = parseForgotRequest(body);
    if (!parsed.ok) {
        return NextResponse.json({ message: parsed.message }, { status: 400 });
    }

    try {
        const token = await issueResetToken(parsed.email);
        const origin = process.env.APP_ORIGIN || 'http://localhost:3000';
        const resetLink = `${origin.replace(/\/$/, '')}/ResetPassword?token=${encodeURIComponent(token)}`;
        await backendRequest('/forgot-password', {
            method: 'POST',
            body: {
                email: parsed.email,
                resetToken: token,
                resetLink,
            },
        });
    } catch {
        console.error('Failed to issue password reset');
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
}
