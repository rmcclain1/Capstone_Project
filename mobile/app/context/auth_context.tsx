// mobile/app/context/auth_context.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api as axios } from '@/lib/api';
import { Platform } from 'react-native';

// Client auth API (Firebase + Rails exchange)
import {
    loginWithEmailPassword,   // signs into Firebase email/password, exchanges for Rails JWT
    getSessionToken,          // reads Rails JWT from SecureStore/localStorage
    logout as apiLogout,      // clears stored Rails JWT
} from '@/api/auth';

type User = {
    id: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    birthday?: string;
    location?: string;
    profile_picture_url?: string;
    allergies?: string[] | null;
    avatar_url?: string;
};

type AuthContextShape = {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

const AuthContext = createContext<AuthContextShape>(null as any);

// Prefer env if provided; keep emulator defaults as fallback
function getBaseUrl() {
    const env = process.env.EXPO_PUBLIC_API_URL?.trim();
    if (env) return env.replace(/\/+$/, '');
    if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
    return 'http://127.0.0.1:3000';
}
const API_ROOT = getBaseUrl();
const API = `${API_ROOT}/api/v1`;

function toArray(raw: any): string[] {
    if (Array.isArray(raw)) return raw.filter(x => typeof x === 'string');
    if (raw == null) return [];
    return [String(raw)];
}

// Try to normalize /me into a User object regardless of shape
function extractUser(meData: any): User | null {
    const candidate = (meData && typeof meData === 'object' && 'user' in meData) ? (meData as any).user : meData;
    if (!candidate || typeof candidate !== 'object') return null;
    const u = candidate as User;
    return { ...u, allergies: toArray((u as any).allergies) };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // keep axios header in sync with token
    useEffect(() => {
        if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        else delete axios.defaults.headers.common.Authorization;
    }, [token]);

    const refreshUser = useCallback(async () => {
        if (!token) return;
        try {
            const { data } = await axios.get(`${API}/me`);
            const u = extractUser(data);
            if (u) setUser(u);
        } catch (e) {
            // 401/expired token, network, or shape mismatch — don’t crash the app
            // Optionally: setUser(null);
        }
    }, [token]);

    // bootstrap from stored JWT; then load /me
    useEffect(() => {
        (async () => {
            try {
                const t = await getSessionToken();
                if (t) {
                    setToken(t);
                    await refreshUser();
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [refreshUser]);

    // Email/password handled by Firebase; then exchange for Rails JWT
    const login = useCallback(async (email: string, password: string) => {
        const res = await loginWithEmailPassword(email, password);
        if (!res?.ok) {
            // surface the exact reason our auth.ts provides
            const msg = (res as any)?.reason || 'Authentication failed';
            throw new Error(msg);
        }
        // JWT stored by postToRails; read it back to sync axios
        const t = await getSessionToken();
        setToken(t ?? null);
        await refreshUser();
    }, [refreshUser]);

    const logout = useCallback(async () => {
        try { await apiLogout(); } catch { }
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common.Authorization;
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
