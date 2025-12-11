// mobile/lib/api.ts
import axios from 'axios';
import { router } from 'expo-router';
import { getToken, setToken } from './tokenStorage';
import { Platform } from 'react-native';

// Prefer env var; fall back to production API domain
const API_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    'https://api.consumesafe.app';

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
        console.log('[API] Full URL:', API_URL + (config.url || ''));

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
            data: err?.response?.data,
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

// ============================================================================
// AUTH HELPERS - Exchange OAuth tokens for Rails JWT
// ============================================================================

/**
 * Exchange Google/Firebase ID token for Rails JWT
 * Call this after successful Google sign-in
 * 
 * @param firebaseIdToken - The ID token from Firebase/Google authentication
 * @returns Object containing the Rails JWT token and user data
 */
export async function authenticateWithGoogle(firebaseIdToken: string) {
    try {
        console.log('[API] Authenticating with Google ID token');

        const response = await api.post('/api/v1/sessions', {
            provider: 'google',
            id_token: firebaseIdToken,
            // NOTE: Adjust the key names above based on what your SessionsController expects
            // Check app/controllers/api/v1/sessions_controller.rb for the exact params
        });

        const { token, user } = response.data;

        if (!token) {
            throw new Error('No token received from Rails');
        }

        // Store the Rails JWT - this is what makes all subsequent API calls work
        await setToken(token);
        console.log('[API] Rails JWT stored successfully');

        return { token, user };
    } catch (error) {
        console.error('[API] Failed to authenticate with Google:', error);
        throw error;
    }
}

/**
 * Exchange Apple ID token for Rails JWT
 * Call this after successful Apple sign-in
 * 
 * @param appleIdToken - The ID token from Apple authentication
 * @returns Object containing the Rails JWT token and user data
 */
export async function authenticateWithApple(appleIdToken: string) {
    try {
        console.log('[API] Authenticating with Apple ID token');

        const response = await api.post('/api/v1/sessions/apple', {
            id_token: appleIdToken,
            // NOTE: Adjust based on your SessionsController expectations
        });

        const { token, user } = response.data;

        if (!token) {
            throw new Error('No token received from Rails');
        }

        // Store the Rails JWT
        await setToken(token);
        console.log('[API] Rails JWT stored successfully');

        return { token, user };
    } catch (error) {
        console.error('[API] Failed to authenticate with Apple:', error);
        throw error;
    }
}

/**
 * Verify the current Rails JWT is still valid
 * Useful for app startup to check if user is still authenticated
 * 
 * @returns User data if token is valid, null if invalid/expired
 */
export async function verifyCurrentSession() {
    try {
        const token = await getToken();
        if (!token) {
            console.log('[API] No token found, user not authenticated');
            return null;
        }

        console.log('[API] Verifying current session...');
        const response = await api.get('/api/v1/me');

        console.log('[API] Session valid, user authenticated');
        return response.data.user;
    } catch (error) {
        console.error('[API] Session verification failed:', error);
        // Don't redirect here - let the response interceptor handle it
        return null;
    }
}

/**
 * Log out - clear the Rails JWT
 */
export async function logout() {
    try {
        console.log('[API] Logging out...');
        const { removeToken } = await import('./tokenStorage');
        await removeToken();
        console.log('[API] Token removed, user logged out');
    } catch (error) {
        console.error('[API] Error during logout:', error);
        throw error;
    }
}