import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { readSessionToken } from './session.mjs';

export async function getSession() {
    const token = cookies().get('session')?.value;
    return readSessionToken(token);
}

export function unauthorized() {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
}

export function forbidden() {
    return NextResponse.json({ message: 'Administrator access required' }, { status: 403 });
}

export async function requireUser() {
    const session = await getSession();
    if (!session) {
        return { session: null, error: unauthorized() };
    }
    return { session, error: null };
}

export async function requireAdmin() {
    const session = await getSession();
    if (!session) {
        return { session: null, error: unauthorized() };
    }
    if (session.role !== 'admin') {
        return { session, error: forbidden() };
    }
    return { session, error: null };
}
