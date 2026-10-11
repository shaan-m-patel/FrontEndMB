import { createHash, randomBytes } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

let storePath = path.join(process.cwd(), '.data', 'reset-tokens.json');
let chain = Promise.resolve();

export function setResetTokenStorePath(nextPath) {
    storePath = nextPath;
}

function hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
}

function withLock(task) {
    const run = chain.then(task, task);
    chain = run.then(() => undefined, () => undefined);
    return run;
}

async function readStore() {
    try {
        const raw = await readFile(storePath, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function writeStore(records) {
    await mkdir(path.dirname(storePath), { recursive: true });
    const active = records.filter((record) => record.expiresAt > Date.now() - RESET_TOKEN_TTL_MS);
    await writeFile(storePath, JSON.stringify(active), 'utf8');
}

export function parseForgotRequest(body) {
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, message: 'Enter a valid email address.' };
    }
    return { ok: true, email };
}

export function parseResetRequest(body) {
    if (typeof body?.token !== 'string' || body.token.length < 20) {
        return { ok: false, message: 'A reset token is required.' };
    }
    if (typeof body?.password !== 'string' || body.password.length < 8) {
        return { ok: false, message: 'Password must be at least 8 characters.' };
    }
    return { ok: true, token: body.token, password: body.password };
}

export async function issueResetToken(email) {
    const token = randomBytes(32).toString('base64url');
    const record = {
        hash: hashToken(token),
        email: email.toLowerCase(),
        expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
        used: false,
    };
    await withLock(async () => {
        const records = await readStore();
        records.push(record);
        await writeStore(records);
    });
    return token;
}

export async function consumeResetToken(token) {
    if (typeof token !== 'string' || token.length < 20) {
        return null;
    }
    const hash = hashToken(token);
    return withLock(async () => {
        const records = await readStore();
        const record = records.find((item) => item.hash === hash);
        if (!record || record.used || record.expiresAt <= Date.now()) {
            return null;
        }
        record.used = true;
        await writeStore(records);
        return { email: record.email };
    });
}
