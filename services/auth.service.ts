
const API_URL = 'http://localhost:3000'; 

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
  }
};