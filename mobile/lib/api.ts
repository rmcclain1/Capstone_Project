// mobile/lib/api.ts
import axios from 'axios';
import { router } from 'expo-router';
import { getToken } from './tokenStorage';
import { Platform } from 'react-native';
import { CFG } from './config';

// Use different URL based on platform
const API_URL = Platform.OS === 'web'
    ? CFG.API_URL_WEB     // http://192.168.1.42:3000 for web
    : CFG.API_URL_LAN;    // http://192.168.1.42:3000 for mobile

console.log('[API] Platform:', Platform.OS);
console.log('[API] Base URL:', API_URL);

export const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
});

// Request interceptor - attach Rails JWT
api.interceptors.request.use(
    async (config) => {
        console.log('[API] Making request:', config.method?.toUpperCase(), config.url);
        console.log('[API] Full URL:', API_URL + config.url);

        try {
            const token = await getToken();
            if (token) {
                config.headers = config.headers ?? {};
                config.headers.Authorization = `Bearer ${token}`;
                console.log('[API] Request with token:', config.url);
            } else {
                console.log('[API] Request WITHOUT token:', config.url);
            }
        } catch (error) {
            console.error('[API] Error getting token:', error);
        }
        return config;
    },
    (error) => {
        console.error('[API] Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - handle 401s
api.interceptors.response.use(
    (res) => {
        console.log('[API] Response SUCCESS:', res.status, res.config.url);
        return res;
    },
    async (err) => {
        const status = err?.response?.status;
        const url = err?.config?.url || '';

        console.error('[API] Response error:', {
            status,
            url,
            message: err.message,
            code: err.code,
            data: err?.response?.data
        });

        if (status === 401 && !url.endsWith('/api/v1/sessions') && !url.endsWith('/api/v1/me')) {
            console.log('[API] 401 - redirecting to login');
            try {
                const { removeToken } = await import('./tokenStorage');
                await removeToken();
            } catch (e) {
                console.error('[API] Error removing token:', e);
            }
            router.replace('/login');
        }
        return Promise.reject(err);
    }
);