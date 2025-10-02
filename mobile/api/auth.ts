import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000/api/v1'; // use your Mac's IP if testing on a physical phone

export const login = async (username: string, password: string) => {
    const res = await axios.post(`${API_URL}/login`, { username, password });
    const { token, user } = res.data;
    await AsyncStorage.multiSet([['token', token], ['userId', String(user.id)]]);
    return user;
};