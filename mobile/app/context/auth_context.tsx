import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/api/auth'; // Import the configured API
import { registerForPushNotificationsAsync } from '@/app/utils/notifications';

type User = {
    id: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    birthday?: string;
    location?: string;
    profile_picture_url?: string;
    allergies?: string[] | null;
};

type AuthContextShape = {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

const AuthContext = createContext<AuthContextShape>(null as any);

const TOKEN_KEY = 'token';
const USER_ID_KEY = 'userId';

function toArray(raw: any): string[] {
    if (Array.isArray(raw)) return raw.filter(x => typeof x === 'string');
    if (raw == null) return [];
    return [String(raw)];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Keep axios header in sync with token
    useEffect(() => {
        if (token) {
            api.defaults.headers.common.Authorization = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common.Authorization;
        }
    }, [token]);

    const refreshUser = useCallback(async () => {
        if (!token || !userId) return;
        const { data } = await api.get<User>(`/users/${userId}`);
        setUser({ ...data, allergies: toArray((data as any).allergies) });
    }, [token, userId]);

    useEffect(() => {
        (async () => {
            try {
                const [[, t], [, uid]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_ID_KEY]);
                if (t && uid) {
                    setToken(t);
                    setUserId(uid);
                    api.defaults.headers.common.Authorization = `Bearer ${t}`;
                    await refreshUser();
                }
            } catch (e) {
                console.log(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [refreshUser]);

    const login = useCallback(async (username: string, password: string) => {
        const { data } = await api.post('/login', { username, password });
        const { token: t, user } = data;

        await AsyncStorage.multiSet([[TOKEN_KEY, t], [USER_ID_KEY, String(user.id)]]);
        setToken(t);
        setUserId(String(user.id));
        api.defaults.headers.common.Authorization = `Bearer ${t}`;

        const expoPushToken = await registerForPushNotificationsAsync();
        if (expoPushToken) {
            try {
                await api.put(`/users/${user.id}`, {
                    user: { expo_push_token: expoPushToken },
                });
            } catch (e) {
                console.log('Failed to save expo_push_token', e);
            }
        }

        await refreshUser();
    }, [refreshUser]);

    const logout = useCallback(async () => {
        try {
            await api.delete('/logout');
        } catch { }
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_ID_KEY]);
        setToken(null);
        setUserId(null);
        setUser(null);
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