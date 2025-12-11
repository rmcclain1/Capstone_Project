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
import {
    loginWithEmailPassword,
    loginWithGoogle,
    loginWithApple,
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
    login: (email: string, password: string) => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    loginWithGoogleFlow: () => Promise<void>;
    loginWithAppleFlow: () => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthContextShape>(null as any);

function normalizeUser(raw: any): User | null {
    if (!raw || typeof raw !== 'object') return null;
    const u = raw as User;
    const allergies = (raw as any).allergies;
    console.log('[Auth] normalizeUser - avatar_url:', raw.avatar_url, 'profile_picture_url:', raw.profile_picture_url);
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
                console.log('[Auth] Bootstrap - stored token:', stored ? 'exists' : 'missing');

                if (!stored || cancelled) {
                    setLoading(false);
                    return;
                }

                setToken(stored);
                api.defaults.headers.common.Authorization = `Bearer ${stored}`;

                const res = await api.get('/api/v1/me');
                console.log('[Auth] Bootstrap - /me response:', res.data?.ok ? 'success' : 'failed');

                if (!res.data?.ok) {
                    console.log('[Auth] Bootstrap - clearing expired token');
                    setUser(null);
                    setToken(null);
                    delete api.defaults.headers.common.Authorization;
                    await apiLogout();
                } else {
                    setUser(normalizeUser(res.data.user));
                }
            } catch (e: any) {
                console.log('[Auth] bootstrap error:', e?.response?.data || e.message);
                setUser(null);
                setToken(null);
                delete api.defaults.headers.common.Authorization;
                await apiLogout();
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        bootstrap();
        return () => {
            cancelled = true;
        };
    }, []);

    const loginWithEmail = useCallback(async (email: string, password: string): Promise<void> => {
        setLoading(true);
        try {
            console.log('[Auth] Starting email login...');
            const result = await loginWithEmailPassword(email, password);

            if (!result.ok) {
                console.log('[Auth] Email login failed:', result.reason);
                throw new Error(result.reason);
            }

            console.log('[Auth] Firebase auth successful, checking for token...');

            // Small delay to ensure backend has processed
            await new Promise(resolve => setTimeout(resolve, 500));

            const stored = await getSessionToken();
            console.log('[Auth] Stored token after login:', stored ? 'exists' : 'MISSING');

            if (!stored) {
                throw new Error('Token not stored after login. Please try again.');
            }

            setToken(stored);
            api.defaults.headers.common.Authorization = `Bearer ${stored}`;

            // Retry logic for /me endpoint
            console.log('[Auth] Fetching user data...');
            let lastError: any;

            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    if (attempt > 0) {
                        console.log(`[Auth] Retry ${attempt}/2 - waiting 1s...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    const meRes = await api.get('/api/v1/me');
                    console.log('[Auth] /me response:', meRes.data?.ok ? 'success' : 'failed');

                    if (meRes.data?.ok) {
                        setUser(normalizeUser(meRes.data.user));
                        console.log('[Auth] Login complete, user set');
                        return; // Success!
                    }
                } catch (e: any) {
                    lastError = e;
                    console.error(`[Auth] /me attempt ${attempt + 1} failed:`, e?.response?.data || e.message);
                }
            }

            // All retries failed
            throw lastError || new Error('Failed to fetch user data after login');
        } catch (e: any) {
            console.error('[Auth] loginWithEmail error:', e?.response?.data || e.message);
            // Clean up on failure
            setUser(null);
            setToken(null);
            delete api.defaults.headers.common.Authorization;
            await apiLogout();
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    const loginWithGoogleFlow = useCallback(async (): Promise<void> => {
        setLoading(true);
        try {
            console.log('[Auth] Starting Google login...');
            const result = await loginWithGoogle();

            if (!result.ok) {
                console.log('[Auth] Google login failed:', result.reason);
                throw new Error(result.reason);
            }

            console.log('[Auth] Google auth successful, checking for token...');

            // Small delay to ensure backend has processed
            await new Promise(resolve => setTimeout(resolve, 500));

            const stored = await getSessionToken();
            console.log('[Auth] Stored token after login:', stored ? 'exists' : 'MISSING');

            if (!stored) {
                throw new Error('Token not stored after login. Please try again.');
            }

            setToken(stored);
            api.defaults.headers.common.Authorization = `Bearer ${stored}`;

            // Retry logic for /me endpoint
            console.log('[Auth] Fetching user data...');
            let lastError: any;

            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    if (attempt > 0) {
                        console.log(`[Auth] Retry ${attempt}/2 - waiting 1s...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    const meRes = await api.get('/api/v1/me');
                    console.log('[Auth] /me response:', meRes.data?.ok ? 'success' : 'failed');

                    if (meRes.data?.ok) {
                        setUser(normalizeUser(meRes.data.user));
                        console.log('[Auth] Google login complete, user set');
                        return; // Success!
                    }
                } catch (e: any) {
                    lastError = e;
                    console.error(`[Auth] /me attempt ${attempt + 1} failed:`, e?.response?.data || e.message);
                }
            }

            // All retries failed
            throw lastError || new Error('Failed to fetch user data after Google login');
        } catch (e: any) {
            console.error('[Auth] loginWithGoogleFlow error:', e?.response?.data || e.message);
            // Clean up on failure
            setUser(null);
            setToken(null);
            delete api.defaults.headers.common.Authorization;
            await apiLogout();
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    const loginWithAppleFlow = useCallback(async (): Promise<void> => {
        setLoading(true);
        try {
            console.log('[Auth] Starting Apple login...');
            const result = await loginWithApple();

            if (!result.ok) {
                console.log('[Auth] Apple login failed:', result.reason);
                throw new Error(result.reason);
            }

            console.log('[Auth] Apple auth successful, checking for token...');

            // Small delay to ensure backend has processed
            await new Promise(resolve => setTimeout(resolve, 500));

            const stored = await getSessionToken();
            console.log('[Auth] Stored token after login:', stored ? 'exists' : 'MISSING');

            if (!stored) {
                throw new Error('Token not stored after login. Please try again.');
            }

            setToken(stored);
            api.defaults.headers.common.Authorization = `Bearer ${stored}`;

            // Retry logic for /me endpoint
            console.log('[Auth] Fetching user data...');
            let lastError: any;

            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    if (attempt > 0) {
                        console.log(`[Auth] Retry ${attempt}/2 - waiting 1s...`);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    const meRes = await api.get('/api/v1/me');
                    console.log('[Auth] /me response:', meRes.data?.ok ? 'success' : 'failed');

                    if (meRes.data?.ok) {
                        setUser(normalizeUser(meRes.data.user));
                        console.log('[Auth] Apple login complete, user set');
                        return; // Success!
                    }
                } catch (e: any) {
                    lastError = e;
                    console.error(`[Auth] /me attempt ${attempt + 1} failed:`, e?.response?.data || e.message);
                }
            }

            // All retries failed
            throw lastError || new Error('Failed to fetch user data after Apple login');
        } catch (e: any) {
            console.error('[Auth] loginWithAppleFlow error:', e?.response?.data || e.message);
            // Clean up on failure
            setUser(null);
            setToken(null);
            delete api.defaults.headers.common.Authorization;
            await apiLogout();
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            console.log('[Auth] Logging out...');
            await apiLogout();
        } catch (e) {
            console.log('[Auth] logout error', e);
        } finally {
            setUser(null);
            setToken(null);
            delete api.defaults.headers.common.Authorization;
            console.log('[Auth] Logout complete');
        }
    }, []);

    const refreshUser = useCallback(async () => {
        if (!token) {
            console.log('[Auth] refreshUser - no token, skipping');
            return;
        }
        try {
            console.log('[Auth] Refreshing user data...');
            const res = await api.get('/api/v1/me');
            if (res.data?.ok) {
                setUser(normalizeUser(res.data.user));
                console.log('[Auth] User refreshed');
            }
        } catch (e: any) {
            console.log('[Auth] refreshUser error:', e?.response?.data || e.message);
        }
    }, [token]);

    // alias to keep older code working
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
                loginWithAppleFlow,
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
