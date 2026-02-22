import { api } from './api';

export interface UserSearchResult {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  totalXp: number;
}

export const friendService = {
  searchUsers: async (query: string): Promise<UserSearchResult[]> => {
    const res = await api.get<UserSearchResult[]>('/users/search', {
      params: { q: query.trim() },
    });
    return res.data;
  },

  sendFriendRequest: async (toUserId: string): Promise<{ id: string }> => {
    const res = await api.post('/friend-requests', { toUserId });
    return res.data;
  },
};
