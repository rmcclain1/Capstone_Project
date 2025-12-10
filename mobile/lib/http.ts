// mobile/lib/http.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// CHANGE THIS TO YOUR CLOUDFLARE TUNNEL URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://YOUR-TUNNEL-URL-HERE.trycloudflare.com';

export const http = axios.create({
    baseURL: API_URL,
    timeout: 15000,
});

// Attach Authorization: Bearer <rails_jwt> for every request to our Rails API.
http.interceptors.request.use(async (config) => {
    try {
        const token = await SecureStore.getItemAsync('rails_jwt'); // keep your existing key name
        if (token) {
            config.headers = config.headers ?? {};
            // Only add for our API baseURL
            if (config.baseURL && config.url && (config.baseURL + config.url).startsWith(API_URL)) {
                (config.headers as any).Authorization = `Bearer ${token}`;
            }
        }
    } catch {
        // ignore – request will go without auth header
    }
    return config;
});

export default http;
