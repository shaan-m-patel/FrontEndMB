'use client';

import { useEffect, useState } from 'react';

export function useSession() {
    const [session, setSession] = useState(undefined);

    useEffect(() => {
        let cancelled = false;

        const load = () => {
            fetch('/api/auth/session', { credentials: 'include' })
                .then((response) => response.json())
                .then((data) => {
                    if (!cancelled) {
                        setSession(data?.role ? data : { role: null });
                    }
                })
                .catch(() => {
                    if (!cancelled) {
                        setSession({ role: null });
                    }
                });
        };

        load();
        window.addEventListener('login', load);
        return () => {
            cancelled = true;
            window.removeEventListener('login', load);
        };
    }, []);

    return session;
}
