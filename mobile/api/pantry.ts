import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://localhost:3000/api/v1";

export const fetchPantryItems = async () => {
  const token = await AsyncStorage.getItem("token");

  const response = await axios.get(`${API_URL}/pantries`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
