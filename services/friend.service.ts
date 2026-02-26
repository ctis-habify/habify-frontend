import { api } from './api';

export interface UserSearchResult {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  totalXp: number;
}

export interface FriendRequestReceivedItem {
  id: string;
  fromUserId: string;
  fromUser: {
    id: string;
    name: string;
    username?: string | null;
    avatarUrl?: string | null;
  };
  createdAt: string;
}

export interface FriendRequestSentItem {
  id: string;
  toUserId: string;
  toUser: {
    id: string;
    name: string;
    username?: string | null;
    avatarUrl?: string | null;
  };
  createdAt: string;
  status: string;
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

  getReceivedRequests: async (): Promise<FriendRequestReceivedItem[]> => {
    const res = await api.get<FriendRequestReceivedItem[]>('/friend-requests/received');
    return res.data;
  },

  getSentRequests: async (): Promise<FriendRequestSentItem[]> => {
    const res = await api.get<FriendRequestSentItem[]>('/friend-requests/sent');
    return res.data;
  },

  acceptRequest: async (requestId: string): Promise<void> => {
    await api.patch(`/friend-requests/${requestId}/accept`);
  },

  declineRequest: async (requestId: string): Promise<void> => {
    await api.patch(`/friend-requests/${requestId}/decline`);
  },

  getFriends: async (): Promise<UserSearchResult[]> => {
    const res = await api.get<UserSearchResult[]>('/friend-requests/friends');
    return res.data;
  },
};
