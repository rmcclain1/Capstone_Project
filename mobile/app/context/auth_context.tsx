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
    avatar_url?: string; // Rails payload often returns this when coming from Google/Firebase
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

function getBaseUrl() {
    // Keep your emulator defaults; API path added per-call
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
        const { data } = await axios.get<{ ok: boolean; user: User }>(`${API}/me`);
        if (data?.ok && data.user) {
            // normalize allergies to string[]
            setUser({ ...data.user, allergies: toArray((data.user as any).allergies) });
        }
    }, [token]);

    // bootstrap from SecureStore/localStorage (via getSessionToken), then load /me
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

    // Email/password now handled by Firebase; then we exchange for Rails JWT
    const login = useCallback(async (email: string, password: string) => {
        const res = await loginWithEmailPassword(email, password);
        if (!res?.ok) throw new Error('Authentication failed');
        // Rails JWT is already stored by the client API; read it back to sync axios header
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
