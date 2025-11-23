const API_URL = 'http://localhost:3000';

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
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message) ? data.message[0] : data.message;
        throw new Error(message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message) ? data.message[0] : data.message;
        throw new Error(message || 'Login failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },
};
