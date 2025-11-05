import { setToken as saveRailsJwt, getToken as readRailsJwt, clearToken as wipeRailsJwt } from '@/lib/tokenStorage';
import { getApiRoot } from '@/lib/env';

export type RailsSessionResponse = {
    ok: boolean;
    token?: string;
    user?: Record<string, any>;
    error?: string;
    status?: number;
};

function buildApiUrl(path: string) {
    const base = getApiRoot().replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
}

export async function postToRails(firebaseIdToken: string): Promise<RailsSessionResponse> {
    const url = buildApiUrl('/api/v1/sessions');
    const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${firebaseIdToken}` },
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json?.token) await saveRailsJwt(json.token); // <-- save using your storage
    return { ok: !!json?.token, token: json?.token, user: json?.user, error: json?.error, status: res.status };
}

export async function getRailsJwt(): Promise<string | null> {
    return readRailsJwt();
}

export async function clearRailsJwt(): Promise<void> {
    await wipeRailsJwt();
}

// If you still use fetch anywhere instead of axios:
export async function authedFetch(pathOrUrl: string, init: RequestInit = {}) {
    const token = await readRailsJwt();
    if (!token) throw new Error('Not authenticated (missing Rails JWT)');
    const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
    const url = isAbsolute ? pathOrUrl : buildApiUrl(pathOrUrl);
    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
        headers.set('Content-Type', 'application/json');
    }
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    return fetch(url, { ...init, headers });
}
