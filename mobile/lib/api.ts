// mobile/lib/api.ts
import axios from 'axios';
import { router } from 'expo-router';
import { getToken } from './tokenStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

export const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
});

// attach Rails JWT on every request
api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});

// optional: route to login on 401s (avoid loop on /sessions)
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status;
        const url = err?.config?.url || '';
        if (status === 401 && !url.endsWith('/api/v1/sessions')) {
            router.replace('/login');
        }
        return Promise.reject(err);
    }
);
