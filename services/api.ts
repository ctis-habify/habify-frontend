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
  (config: any) => {
    // headers'ı Record olarak ele al
    const headers: Record<string, string> = (config.headers ?? {}) as Record<string, string>;

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    } else if (!headers.Authorization) {
      delete headers.Authorization;
    }

    // Add Timezone for backend date calculations
    try {
      headers['X-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      // Fallback if Intl is not available
    }

    config.headers = headers;
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// Global Interceptor: Convert all incoming snake_case responses to camelCase
const toCamelCase = (str: string): string => str.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());

const keysToCamel = (o: unknown): unknown => {
  if (o === Object(o) && !Array.isArray(o) && typeof o !== 'function') {
    const n: Record<string, unknown> = {};
    Object.keys(o as object).forEach((k: string) => {
      // Don't modify keys that start with '$' or are already camelCase mapped
      const newKey: string = toCamelCase(k);
      n[newKey] = keysToCamel((o as Record<string, unknown>)[k]);
    });
    return n;
  } else if (Array.isArray(o)) {
    return o.map((i: unknown) => keysToCamel(i));
  }
  return o;
};

api.interceptors.response.use(
  (response: any) => {
    if (response.data) {
      response.data = keysToCamel(response.data);
    }
    return response;
  },
  (error: unknown) => Promise.reject(error),
);
