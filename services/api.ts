// services/api.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const BASE_URL = "http://192.168.1.9:3000"; // <-- kendi backend URL’in

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Her isteğe otomatik Authorization header ekle
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("authToken");
  if (token) {
    // If headers is an AxiosHeaders instance use its set method, otherwise merge safely into a plain object
    if (config.headers && typeof (config.headers as any).set === "function") {
      (config.headers as any).set("Authorization", `Bearer ${token}`);
    } else {
      config.headers = {
        ...(config.headers as Record<string, any>),
        Authorization: `Bearer ${token}`,
      } as any;
    }
  }
  return config;
});

export default api;
