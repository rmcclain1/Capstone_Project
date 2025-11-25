import axios from "axios";
const API_URL = "http://127.0.0.1:3000/api/v1";

export async function signup(payload: {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
}) {
  const res = await axios.post(`${API_URL}/users`, { user: payload });
  return res.data.user;
}
