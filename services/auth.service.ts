import { AuthResponse, LoginPayload, RegisterPayload } from '@/types/auth';
import { api } from './api';

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/signup', payload);
      return response.data;
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const anyErr = error as any;
        const data = anyErr.response.data;
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
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const anyErr = error as any;
        const data = anyErr.response.data;
        const message = Array.isArray(data.message) ? data.message[0] : data.message;
        throw new Error(message || 'Login failed');
      }
      throw error;
    }
  },
  async resetPassword(email: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await api.post('/auth/reset-password', { email, newPassword });
      return response.data;
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const anyErr = error as any;
        const data = anyErr.response.data;
        const message = Array.isArray(data.message) ? data.message[0] : data.message;
        throw new Error(message || 'Failed to reset password');
      }
      throw error;
    }
  },
};
