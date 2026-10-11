import { NextResponse } from 'next/server';
import { backendRequest } from '../../../../lib/backend.mjs';
import { requireAdmin } from '../../../../lib/routeAuth';
import { toAllowedEmbedUrl } from '../../../../lib/trailerUrl.mjs';

export const runtime = 'nodejs';

export async function POST(request) {
    const { error } = await requireAdmin();
    if (error) {
        return error;
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: 'Invalid movie' }, { status: 400 });
    }

    const trailerUrl = toAllowedEmbedUrl(body?.trailerUrl);
    if (!trailerUrl) {
        return NextResponse.json({ message: 'Trailer URL must be a YouTube or Vimeo link' }, { status: 400 });
    }

    try {
        const result = await backendRequest('/add-movie', {
            method: 'POST',
            body: { ...body, trailerUrl },
        });
        if (!result.ok) {
            return NextResponse.json({ message: 'Failed to add movie' }, { status: result.status || 400 });
        }
        return NextResponse.json(result.data ?? { message: 'Movie added' });
    } catch {
        return NextResponse.json({ message: 'Failed to add movie' }, { status: 502 });
    }
}
