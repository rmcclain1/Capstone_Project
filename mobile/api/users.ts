import { api as axios } from '@/lib/api';
import { apiUrl } from '@/lib/env';
const API_URL = apiUrl('/'); 


export async function signup(payload: {
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
}) {
    const res = await axios.post(`${API_URL}/users`, { user: payload });
    return res.data.user;
}
