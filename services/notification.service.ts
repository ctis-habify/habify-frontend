import { api } from './api';

type NotificationKind = 'unfinished_tasks' | 'social_interactions';

const COOLDOWN_MS = 3 * 60 * 1000;

const lastShownAt: Record<NotificationKind, number> = {
  unfinished_tasks: 0,
  social_interactions: 0,
};

let lastCollaborativeCount = 0;

export type NotificationCategory = 'friend_requests' | 'unfinished_tasks' | 'social_interactions';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  message: string;
  createdAt: number;
  isRead?: boolean;
  routineId?: string | null;
}

export interface BackendNotification {
  id: string;
  userId: string;
  routineId: string | null;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  pushSent: boolean;
  createdAt: string;
  routine?: { id: string; routineName: string } | null;
}

const notificationFeed: NotificationItem[] = [];

function addNotification(category: NotificationCategory, message: string): void {
  const item: NotificationItem = {
    id: `${category}-${Date.now()}`,
    category,
    message,
    createdAt: Date.now(),
  };

  notificationFeed.unshift(item);
}

function shouldShow(kind: NotificationKind): boolean {
  const now = Date.now();
  if (now - lastShownAt[kind] < COOLDOWN_MS) return false;
  lastShownAt[kind] = now;
  return true;
}

export const notificationService = {
  getNotifications(): NotificationItem[] {
    return [...notificationFeed].sort((a, b) => b.createdAt - a.createdAt);
  },

  addFriendRequestNotification(friendName: string): void {
    addNotification('friend_requests', `${friendName} sent you a friend request.`);
  },

  getUnfinishedTaskReminder(unfinishedCount: number): string | null {
    if (unfinishedCount <= 0) return null;
    if (!shouldShow('unfinished_tasks')) return null;

    const message = unfinishedCount === 1
      ? 'You have 1 unfinished task today.'
      : `You have ${unfinishedCount} unfinished tasks today.`;
    addNotification('unfinished_tasks', message);
    return message;
  },

  getSocialInteractionReminder(collaborativeCount: number): string | null {
    const previous = lastCollaborativeCount;
    lastCollaborativeCount = collaborativeCount;

    if (previous > 0 && collaborativeCount > previous) {
      if (!shouldShow('social_interactions')) return null;
      const message = 'You have new social interactions in collaborative routines.';
      addNotification('social_interactions', message);
      return message;
    }

    return null;
  },

  // ── Backend API methods ──

  async fetchNotifications(
    limit = 50,
    offset = 0,
  ): Promise<{ data: BackendNotification[]; total: number }> {
    const res = await api.get('/notifications', { params: { limit, offset } });
    return res.data;
  },

  async fetchUnreadCount(): Promise<number> {
    const res = await api.get('/notifications/unread-count');
    return res.data.count;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async registerPushToken(token: string): Promise<void> {
    await api.post('/notifications/push-token', { token });
  },

  async removePushToken(): Promise<void> {
    await api.post('/notifications/push-token/remove');
  },

  backendToLocal(n: BackendNotification): NotificationItem {
    return {
      id: n.id,
      category: 'unfinished_tasks',
      message: n.body,
      createdAt: new Date(n.createdAt).getTime(),
      isRead: n.isRead,
      routineId: n.routineId,
    };
  },
};
