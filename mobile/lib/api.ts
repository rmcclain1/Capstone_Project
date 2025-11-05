// mobile/lib/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'; // Android emulator; iOS sim: http://localhost:3000

export const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
});

// Attach Authorization header for every request
api.interceptors.request.use(async (config) => {
    try {
        const token = await SecureStore.getItemAsync('rails_jwt'); // <-- key must match where you saved it
        if (token) {
            config.headers = config.headers ?? {};
            (config.headers as any).Authorization = `Bearer ${token}`;
        }
    } catch {
        // ignore
    }
    return config;
});

// Optional: redirect to login on 401s
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.response?.status === 401) {
            // You can also emit a sign-out here
            router.replace('/login');
        }
        return Promise.reject(err);
    }
);
