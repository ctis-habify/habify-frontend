// src/services/api.ts
import axios from 'axios';



let authToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

const BASE_URL = 'https://habify-backend.onrender.com';

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

// Global Interceptor: Convert all incoming snake_case responses to camelCase
const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

const keysToCamel = (o: any): any => {
  if (o === Object(o) && !Array.isArray(o) && typeof o !== 'function') {
    const n = {};
    Object.keys(o).forEach((k) => {
      // Don't modify keys that start with '$' or are already camelCase mapped
      const newKey = toCamelCase(k);
      (n as any)[newKey] = keysToCamel(o[k]);
    });
    return n;
  } else if (Array.isArray(o)) {
    return o.map((i) => keysToCamel(i));
  }
  return o;
};

api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = keysToCamel(response.data);
    }
    return response;
  },
  (error) => Promise.reject(error),
);