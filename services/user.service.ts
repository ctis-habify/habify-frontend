import { User, UserUpdateDto } from '../types/user';
import { api } from './api';

export const userService = {
  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    const res = await api.get('/users/me');
    return res.data;
  },

  // Get user by ID
  getUserById: async (userId: string): Promise<User> => {
    const res = await api.get(`/users/${userId}`);
    return res.data;
  },

  // Update user profile
  updateUser: async (data: UserUpdateDto): Promise<User> => {
    const res = await api.patch('/users/me', data);
    return res.data;
  },

  // Get user XP logs
  getUserXpLogs: async (userId?: string): Promise<any[]> => {
    const endpoint = userId ? `/users/${userId}/xp-logs` : '/users/me/xp-logs';
    const res = await api.get(endpoint);
    return res.data;
  },
};

