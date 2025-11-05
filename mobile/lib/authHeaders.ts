// mobile/lib/authHeader.ts
import * as SecureStore from 'expo-secure-store';
export async function authHeader() {
    const token = await SecureStore.getItemAsync('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}
