// app/api/profile.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000/api/v1';

async function authHeaders() {
    const token = await AsyncStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
}

export type User = {
    id: number;
    username: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    phone_number?: string | null;
    birthday?: string | null;   // ISO from backend
    location?: string | null;
    avatar_url?: string | null;
    allergies?: string[] | null;
};

export type UpdateProfilePayload = {
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    birthday?: string; // 'YYYY-MM-DD'
    location?: string;
    avatar_url?: string;
    allergies?: string[];
};

export async function getProfile(): Promise<User> {
    const headers = await authHeaders();
    const userId = await AsyncStorage.getItem('userId');
    const res = await axios.get(`${API_URL}/users/${userId}`, { headers });
    return res.data;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const headers = await authHeaders();
    const userId = await AsyncStorage.getItem('userId');
    const res = await axios.put(`${API_URL}/users/${userId}`, { user: payload }, { headers });
    return res.data;
}
