// mobile/app/context/auth_context.tsx
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react';
import { api } from '@/lib/api';
import { Platform } from 'react-native';
import {
    loginWithEmailPassword,
    loginWithGoogle,
    getSessionToken,
    logout as apiLogout,
} from '@/api/auth';

export type User = {
    id: number;
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    phonenumber?: string;
    phone_number?: string;
    birthday?: string;
    location?: string;
    profile_picture_url?: string;
    avatar_url?: string;
    allergies?: string[] | null;
};

type AuthContextShape = {
    user: User | null;
    token: string | null;
    loading: boolean;
    // NEW: generic login alias used by login.tsx
    login: (email: string, password: string) => Promise<boolean>;
    loginWithEmail: (email: string, password: string) => Promise<boolean>;
    loginWithGoogleFlow: () => Promise<boolean>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthContextShape>(null as any);

function normalizeUser(raw: any): User | null {
    if (!raw || typeof raw !== 'object') return null;
    const u = raw as User;
    // Ensure allergies is always an array
    const allergies = (raw as any).allergies;
    return {
        ...u,
        allergies: Array.isArray(allergies)
            ? allergies
            : typeof allergies === 'string' && allergies.length > 0
                ? allergies.split(',').map((s: string) => s.trim()).filter(Boolean)
                : allergies ?? null,
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Bootstrap from stored Rails JWT
    useEffect(() => {
        let cancelled = false;

        async function bootstrap() {
            try {
                const stored = await getSessionToken();
                if (!stored || cancelled) {
                    setLoading(false);
                    return;
                }

                setToken(stored);
                api.defaults.headers.common.Authorization = `Bearer ${stored}`;

                const res = await api.get('/api/v1/me');
                if (!res.data?.ok) {
                    setUser(null);
                    setToken(null);
                    delete api.defaults.headers.common.Authorization;
                } else {
                    setUser(normalizeUser(res.data.user));
                }
            } catch (e) {
                console.log('[Auth] bootstrap error', e);
                setUser(null);
                setToken(null);
                delete api.defaults.headers.common.Authorization;
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        bootstrap();
        return () => {
            cancelled = true;
        };
    }, []);

    const loginWithEmail = useCallback(async (email: string, password: string) => {
        setLoading(true);
        try {
            const result = await loginWithEmailPassword(email, password);
            if (!result.ok) {
                console.log('[Auth] email login failed:', result.reason);
                return false;
            }
            // postToRails already stored token; fetch it
            const stored = await getSessionToken();
            if (stored) {
                setToken(stored);
                api.defaults.headers.common.Authorization = `Bearer ${stored}`;
            }
            // Fetch /me to get normalized user object
            const meRes = await api.get('/api/v1/me');
            if (meRes.data?.ok) {
                setUser(normalizeUser(meRes.data.user));
            }
            return true;
        } catch (e) {
            console.log('[Auth] loginWithEmail error', e);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const loginWithGoogleFlow = useCallback(async () => {
        setLoading(true);
        try {
            const result = await loginWithGoogle();
            if (!result.ok) {
                console.log('[Auth] google login failed:', result.reason);
                return false;
            }
            const stored = await getSessionToken();
            if (stored) {
                setToken(stored);
                api.defaults.headers.common.Authorization = `Bearer ${stored}`;
            }
            const meRes = await api.get('/api/v1/me');
            if (meRes.data?.ok) {
                setUser(normalizeUser(meRes.data.user));
            }
            return true;
        } catch (e) {
            console.log('[Auth] loginWithGoogleFlow error', e);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiLogout();
        } catch (e) {
            console.log('[Auth] logout error', e);
        } finally {
            setUser(null);
            setToken(null);
            delete api.defaults.headers.common.Authorization;
        }
    }, []);

    const refreshUser = useCallback(async () => {
        if (!token) return;
        try {
            const res = await api.get('/api/v1/me');
            if (res.data?.ok) {
                setUser(normalizeUser(res.data.user));
            }
        } catch (e) {
            console.log('[Auth] refreshUser error', e);
        }
    }, [token]);

    // Here we just expose `login` as an alias for `loginWithEmail`
    const login = loginWithEmail;

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                loginWithEmail,
                loginWithGoogleFlow,
                logout,
                refreshUser,
                setUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
