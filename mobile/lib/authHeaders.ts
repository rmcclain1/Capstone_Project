// mobile/lib/authHeader.ts
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
export async function authHeader() {
    const token = await SecureStore.getItemAsync('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}
export function setAxiosAuthHeader(token: string | null) {
    if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    else delete axios.defaults.headers.common.Authorization;
}