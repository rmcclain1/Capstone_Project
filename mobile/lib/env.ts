// lib/env.ts
import { Platform } from 'react-native';
import { CFG } from '@/lib/config';

function stripApiSuffix(url: string): string {
    let base = (url || '').trim();
    if (!base) return '';
    base = base.replace(/\/+$/g, '');
    return base.replace(/(?:\/api(?:\/v\d+)?)$/i, '');
}

export function getApiBaseUrl(): string {
    if (Platform.OS === 'web') return stripApiSuffix(CFG.API_URL_WEB);
    return stripApiSuffix(CFG.API_URL_LAN || CFG.API_URL_WEB);
}

const API_PREFIX = '/api/v1';
export function apiUrl(path: string): string {
    const base = getApiBaseUrl();
    const p = path.startsWith('/') ? path : `/${path}`;
    const normalized = p.startsWith('/api/') ? p : `${API_PREFIX}${p}`;
    return `${base}${normalized}`;
}

// legacy compatibility
export function getApiRoot(): string {
    return getApiBaseUrl();
}
