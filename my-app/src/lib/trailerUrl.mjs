const YOUTUBE_HOSTS = new Set([
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'youtube-nocookie.com',
    'www.youtube-nocookie.com',
]);

const VIMEO_HOSTS = new Set([
    'vimeo.com',
    'www.vimeo.com',
    'player.vimeo.com',
]);

export const TRAILER_IFRAME_ALLOW = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';

function youtubeId(url) {
    if (url.hostname === 'youtu.be') {
        return url.pathname.split('/').filter(Boolean)[0] || '';
    }
    if (url.pathname.startsWith('/embed/')) {
        return url.pathname.split('/')[2] || '';
    }
    if (url.pathname.startsWith('/shorts/')) {
        return url.pathname.split('/')[2] || '';
    }
    return url.searchParams.get('v') || '';
}

export function toAllowedEmbedUrl(raw) {
    if (typeof raw !== 'string' || !raw.trim()) {
        return null;
    }
    let url;
    try {
        url = new URL(raw.trim());
    } catch {
        return null;
    }
    if (url.protocol !== 'https:') {
        return null;
    }

    if (url.hostname === 'youtu.be' || YOUTUBE_HOSTS.has(url.hostname)) {
        const id = youtubeId(url);
        if (!/^[\w-]{11}$/.test(id)) {
            return null;
        }
        return `https://www.youtube-nocookie.com/embed/${id}`;
    }

    if (VIMEO_HOSTS.has(url.hostname)) {
        const id = url.pathname.split('/').filter(Boolean).pop() || '';
        if (!/^\d+$/.test(id)) {
            return null;
        }
        return `https://player.vimeo.com/video/${id}`;
    }

    return null;
}
