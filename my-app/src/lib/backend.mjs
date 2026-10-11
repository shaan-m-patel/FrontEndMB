function apiBase() {
    return (process.env.BACKEND_URL || 'http://localhost:9090').replace(/\/$/, '');
}

export async function backendRequest(pathname, { method = 'GET', body, searchParams } = {}) {
    const url = new URL(pathname.replace(/^\//, ''), `${apiBase()}/`);
    if (searchParams) {
        for (const [key, value] of Object.entries(searchParams)) {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value));
            }
        }
    }
    const response = await fetch(url, {
        method,
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: 'no-store',
    });
    const text = await response.text();
    let data = null;
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = { message: text };
        }
    }
    return { ok: response.ok, status: response.status, data };
}
