import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000/api/v1';

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      username,
      password,
    });

    const { token, user } = response.data;
    await AsyncStorage.setItem('token', token);
    return user;
  } catch (err: any) {
    throw err.response?.data?.error || 'Login failed';
  }
};
