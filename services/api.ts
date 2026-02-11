// src/services/api.ts
import axios from 'axios';

import { Platform } from 'react-native';

let authToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

// Android emulator typically accesses localhost via 10.0.2.2
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    // headers'ı any olarak ele al
    const headers = (config.headers ?? {}) as any;

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    } else if (!headers.Authorization) {
      delete headers.Authorization;
    }

    config.headers = headers;
    return config;
  },
  (error) => Promise.reject(error),
);