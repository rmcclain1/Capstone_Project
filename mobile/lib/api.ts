import axios from 'axios';
import { getApiRoot } from '@/lib/env';
import { getToken as getRailsJwt } from '@/lib/tokenStorage';

export const api = axios.create({
    baseURL: getApiRoot(), // handles http://10.0.2.2:3000 on Android, localhost elsewhere
});

// Attach Authorization: Bearer <Rails JWT> to every request (if present)
api.interceptors.request.use(async (config) => {
    const token = await getRailsJwt();
    if (token) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});
