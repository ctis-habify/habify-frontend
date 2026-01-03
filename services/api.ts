// src/services/api.ts
import axios from 'axios';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const api = axios.create({
  baseURL: 'http://localhost:3000', // backend address
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