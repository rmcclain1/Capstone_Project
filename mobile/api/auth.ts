import { Platform } from "react-native";
import axios from "axios";

function getBaseUrl() {
  if (Platform.OS === "android") return "http://192.0.0.2:3000/api/v1";
  return "https://ungambolled-nonetheless-marcia.ngrok-free.dev/api/v1";
}

export const API_BASE_URL = getBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

export default api;
