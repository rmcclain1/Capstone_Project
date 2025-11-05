// mobile/lib/tokenStorage.ts
import { Platform } from 'react-native';
export const TOKEN_KEY = 'rails_jwt';

export async function readToken(): Promise<string | null> {
    try {
        const SecureStore = await import('expo-secure-store');
        if (Platform.OS !== 'web' && typeof SecureStore.getItemAsync === 'function') {
            return await SecureStore.getItemAsync(TOKEN_KEY);
        }
    } catch { }
    if (typeof window !== 'undefined' && 'localStorage' in window) {
        return window.localStorage.getItem(TOKEN_KEY);
    }
    return null;
}

export async function saveToken(token: string): Promise<void> {
    try {
        const SecureStore = await import('expo-secure-store');
        if (Platform.OS !== 'web' && typeof SecureStore.setItemAsync === 'function') {
            await SecureStore.setItemAsync(TOKEN_KEY, token);
            return;
        }
    } catch { }
    if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.setItem(TOKEN_KEY, token);
    }
}

export async function removeToken(): Promise<void> {
    try {
        const SecureStore = await import('expo-secure-store');
        if (Platform.OS !== 'web' && typeof SecureStore.deleteItemAsync === 'function') {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            return;
        }
    } catch { }
    if (typeof window !== 'undefined' && 'localStorage' in window) {
        window.localStorage.removeItem(TOKEN_KEY);
    }
}

export const getToken = readToken;
export const setToken = saveToken;
export const clearToken = removeToken;
export const RAILS_JWT_KEY = TOKEN_KEY;
