import { api } from './api';

type LoginPayload = {
  email: string;
  password: string;
};

type AuthResponse = {
  user: any;
  accessToken: string;
};

export const authService = {
  async register(payload: any) {
    try {
      const response = await api.post('/auth/signup', payload);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        const data = error.response.data;
        const message = Array.isArray(data.message) ? data.message[0] : data.message;
        throw new Error(message || 'Something went wrong');
      }
      throw error;
    }
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', payload);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        const data = error.response.data;
        const message = Array.isArray(data.message) ? data.message[0] : data.message;
        throw new Error(message || 'Login failed');
      }
      throw error;
    }
  },
};
