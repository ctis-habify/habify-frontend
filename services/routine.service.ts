import { Routine, RoutineList, RoutineLog } from '../types/routine';
import { api } from './api';

export type UpdateRoutinePayload = Partial<{
  routineListId: number;
  routineName: string;
  frequencyType: 'Daily' | 'Weekly' | string;
  frequencyDetail: number;
  startTime: string;
  endTime: string;
  isAiVerified: boolean;
  startDate: string;
  isReminderEnabled: boolean;
  reminderTime: string;
}>;

const getArrayFromResponse = (data: unknown): any[] => {
  const queue: unknown[] = [data];
  const visited = new Set<unknown>();
  const priorityKeys = ['data', 'messages', 'predefinedMessages', 'items', 'results'];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) return current;
    if (typeof current !== 'object') continue;

    const objectValue = current as Record<string, unknown>;

    for (const key of priorityKeys) {
      if (Array.isArray(objectValue[key])) {
        return objectValue[key] as unknown[];
      }
    }

    for (const key of priorityKeys) {
      if (objectValue[key] && typeof objectValue[key] === 'object') {
        queue.push(objectValue[key]);
      }
    }

    for (const value of Object.values(objectValue)) {
      if (value && typeof value === 'object') {
        queue.push(value);
      }
    }
  }

  return [];
};

const getAccessTokenFromLocalStorage = (): string | null => {
  if (typeof window === 'undefined') return null;
  const storage = (window as unknown as { localStorage?: Storage }).localStorage;
  if (!storage) return null;
  try {
    return storage.getItem('accessToken');
  } catch {
    return null;
  }
};

const getCollaborativeRoutinesFromResponse = (data: unknown): Routine[] => {
  if (Array.isArray(data)) return data.map(normalizeCollaborativeRoutine);
  if (data && typeof data === 'object') {
    const obj = data as {
      routines?: unknown[];
      data?: unknown[];
      items?: unknown[];
      result?: unknown[];
    };
    if (Array.isArray(obj.routines)) return obj.routines.map(normalizeCollaborativeRoutine);
    if (Array.isArray(obj.data)) return obj.data.map(normalizeCollaborativeRoutine);
    if (Array.isArray(obj.items)) return obj.items.map(normalizeCollaborativeRoutine);
    if (Array.isArray(obj.result)) return obj.result.map(normalizeCollaborativeRoutine);
  }
  return [];
};

const toNumberOrDefault = (value: unknown, defaultValue = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return defaultValue;
};

const toStringOrUndefined = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
};

const getByPath = (source: Record<string, unknown>, path: string): unknown => {
  const keys = path.split('.');
  let current: unknown = source;
  for (const key of keys) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
};

const pickFirst = (source: Record<string, unknown>, paths: string[]): unknown => {
  for (const path of paths) {
    const value = getByPath(source, path);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
};

const normalizeCollaborativeRoutine = (item: unknown): Routine => {
  const rawSource = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
  const nestedRoutine = (
    rawSource.routine && typeof rawSource.routine === 'object' ? rawSource.routine : {}
  ) as Record<string, unknown>;
  const source = { ...nestedRoutine, ...rawSource } as Record<string, unknown>;
  const categoryValue = pickFirst(source, ['category', 'routine.category']);
  const categoryName =
    toStringOrUndefined(
      pickFirst(source, [
        'categoryName',
        'category_name',
        'routine.categoryName',
        'routine.category_name',
      ]),
    ) ||
    (categoryValue && typeof categoryValue === 'object'
      ? toStringOrUndefined((categoryValue as Record<string, unknown>).name)
      : undefined) ||
    (typeof categoryValue === 'string' ? categoryValue : undefined) ||
    '';

  const routineName =
    toStringOrUndefined(
      pickFirst(source, [
        'routineName',
        'routine_name',
        'name',
        'title',
        'routine.routineName',
        'routine.routine_name',
        'routine.name',
        'routine.title',
      ]),
    ) || '';

  const startTime =
    toStringOrUndefined(
      pickFirst(source, [
        'startTime',
        'start_time',
        'startAt',
        'start_at',
        'schedule.startTime',
        'schedule.start_time',
        'routine.startTime',
        'routine.start_time',
      ]),
    ) || '';

  const endTime =
    toStringOrUndefined(
      pickFirst(source, [
        'endTime',
        'end_time',
        'endAt',
        'end_at',
        'schedule.endTime',
        'schedule.end_time',
        'routine.endTime',
        'routine.end_time',
      ]),
    ) || '';

  return {
    ...(source as Partial<Routine>),
    id:
      toStringOrUndefined(pickFirst(source, ['id', 'routineId', 'routine_id', 'routine.id'])) || '',
    routineName,
    description:
      toStringOrUndefined(pickFirst(source, ['description', 'desc', 'routine.description'])) || '',
    lives: toNumberOrDefault(
      pickFirst(source, [
        'lives',
        'life',
        'remainingLives',
        'remaining_lives',
        'maxLives',
        'max_lives',
        'routine.lives',
      ]),
      0,
    ),
    streak: toNumberOrDefault(
      pickFirst(source, ['streak', 'current_streak', 'currentStreak', 'routine.streak']),
      0,
    ),
    startTime,
    endTime,
    creatorId:
      toStringOrUndefined(
        pickFirst(source, [
          'creatorId',
          'creator_id',
          'createdBy',
          'userId',
          'ownerId',
          'creator.id',
          'user.id',
          'routine.creatorId',
        ]),
      ) || undefined,
    isPublic:
      pickFirst(source, ['isPublic', 'is_public', 'routine.isPublic']) === true ||
      String(
        pickFirst(source, ['visibility', 'privacy', 'routine.visibility']) || '',
      ).toLowerCase() === 'public',
    categoryName,
    title: toStringOrUndefined(pickFirst(source, ['title', 'routineName', 'routine_name'])) || '',
    frequencyType:
      toStringOrUndefined(
        pickFirst(source, ['frequencyType', 'frequency_type', 'routine.frequencyType']),
      ) || '',
  } as Routine;
};

const normalizeMessageStrings = (value: unknown): string[] => {
  return getArrayFromResponse(value)
    .map((item) =>
      typeof item === 'string'
        ? item
        : (item as { text?: string; message?: string; content?: string })?.text ||
          (item as { text?: string; message?: string; content?: string })?.message ||
          (item as { text?: string; message?: string; content?: string })?.content ||
          '',
    )
    .map((text) => String(text).trim())
    .filter(Boolean);
};

export const routineService = {
  // Get all routines for the authenticated user
  async getRoutines(): Promise<Routine[]> {
    const res = await api.get('/routines');
    return res.data;
  },
  // Today's routines
  async getTodayRoutines(): Promise<Routine[]> {
    const res = await api.get('/routines/today');
    return res.data; // backend 'data' içinde döndürüyorsa: res.data.data
  },

  // Get grouped routines
  async getGroupedRoutines(token?: string): Promise<RoutineList[]> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const res = await api.get('/routines/grouped', config);
    return res.data;
  },

  // Get routine by ID
  async getRoutineById(routineId: string, token: string): Promise<Routine> {
    const res = await api.get(`/routines/${routineId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  // Get routine lists (routine groups)
  async getRoutineLists(): Promise<RoutineList[]> {
    const res = await api.get('/routine-lists');
    return res.data;
  },
  async getRoutineLogs(routineId?: string): Promise<RoutineLog[]> {
    const endpoint = routineId ? `/routines/${routineId}/logs` : '/routine-logs';
    const res = await api.get(endpoint);
    return res.data;
  },
  async createRoutineList(categoryId: number, title: string): Promise<RoutineList> {
    const res = await api.post('/routine-lists', {
      title,
      categoryId,
    });
    return res.data;
  },

  // ✅ Create Routine
  async createRoutine(body: {
    routineListId: number;
    routineName: string;
    frequencyType: string;
    frequencyDetail?: number;
    startTime: string;
    endTime: string;
    isAiVerified: boolean;
    startDate: string;
    categoryId?: number;
  }): Promise<Routine> {
    const res = await api.post('/routines', body);
    return res.data;
  },

  // ✅ Create Collaborative Routine
  async createCollaborativeRoutine(body: {
    routineListId?: number;
    categoryId?: number;
    routineName: string;
    frequencyType: string;
    frequencyDetail?: number;
    startTime: string;
    endTime: string;
    startDate: string;
    isAiVerified?: boolean;
    routineType?: string;
    description?: string;
    lives?: number;
    isPublic?: boolean;
    entranceCondition?: string;
    rewardCondition?: string;
    repetition?: string;
    ageRequirement?: number;
    genderRequirement?: string;
    xpRequirement?: number;
  }): Promise<Routine> {
    const res = await api.post('/routines/collaborative', body);
    return res.data;
  },

  // ✅ Get Collaborative Routines
  async getCollaborativeRoutines(): Promise<Routine[]> {
    const res = await api.get('/routines/collaborative');
    return res.data;
  },

  // ✅ Join a Group
  async joinGroup(key: string): Promise<any> {
    try {
      const res = await api.post('/routines/join', { key });
      return res.data;
    } catch (err: any) {
      if (err.response && err.response.status === 400 && err.response.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw err;
    }
  },

  // ✅ Group Detail (Profile View)
  async getGroupDetail(id: string): Promise<Routine & { participants: any[] }> {
    const res = await api.get(`/routines/group/${id}`);
    return res.data;
  },

  // ✅ Get Predefined Messages for Collaborative Routine Chat
  async getRoutinePredefinedMessages(): Promise<string[]> {
    const res = await api.get('/routines/collaborative-chat/predefined');
    return normalizeMessageStrings(res.data);
  },

  // ✅ Get Collaborative Routine Chat Messages
  async getRoutineChatMessages(routineId: string): Promise<any[]> {
    const res = await api.get(`/routines/collaborative-chat/${routineId}`);
    return getArrayFromResponse(res.data);
  },

  // ✅ Send Collaborative Routine Chat Message
  async sendRoutineChatMessage(routineId: string, message: string): Promise<any> {
    const res = await api.post(`/routines/collaborative-chat/${routineId}`, { message });
    return res.data;
  },

  // ✅ Unified Verification Flow
  async verifyRoutine(body: { routineId: string; objectPath: string }): Promise<any> {
    const res = await api.post('/routines/verify', body);
    return res.data;
  },

  // ✅ Send Routine Invitation
  async sendRoutineInvite(routineId: string, toUserId: string): Promise<any> {
    const res = await api.post('/routine-invitations', { routineId, toUserId });
    return res.data;
  },

  // ✅ Remove Member from Collaborative Routine
  async removeMemberFromRoutine(routineId: string, userId: string): Promise<any> {
    const res = await api.delete(`/routines/collaborative/${routineId}/members/${userId}`);
    return res.data;
  },

  // ✅ Get Pending Routine Invitations
  async getPendingRoutineInvites(): Promise<any[]> {
    const res = await api.get('/routine-invitations/received');
    return res.data;
  },

  // ✅ Accept Routine Invitation
  async acceptRoutineInvite(invitationId: string): Promise<any> {
    const res = await api.patch(`/routine-invitations/${invitationId}/accept`);
    return res.data;
  },

  // ✅ Decline Routine Invitation
  async declineRoutineInvite(invitationId: string): Promise<any> {
    const res = await api.patch(`/routine-invitations/${invitationId}/decline`);
    return res.data;
  },

  // Create routine log (mark routine as completed) - LEGACY (Consider using verifyRoutine)
  async createRoutineLog(
    routineId: string,
    logDate: string,
    verificationImageUrl?: string,
  ): Promise<RoutineLog> {
    const res = await api.post('/routine-logs', {
      routine_id: routineId,
      log_date: logDate,
      verification_image_url: verificationImageUrl,
    });
    return res.data;
  },

  // Update routine log verification
  async updateRoutineLog(
    logId: number,
    isVerified: boolean,
    verificationImageUrl?: string,
  ): Promise<RoutineLog> {
    const res = await api.patch(`/routine-logs/${logId}`, {
      is_verified: isVerified,
      verification_image_url: verificationImageUrl,
    });
    return res.data;
  },

  async updateRoutine(id: string, payload: UpdateRoutinePayload, token: string): Promise<any> {
    const response = await api.patch(`/routines/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status !== 200) throw new Error('Failed to update routine');
    return response.data;
  },

  async deleteRoutine(id: string, token: string): Promise<boolean> {
    const response = await api.delete(`/routines/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status !== 200 && response.status !== 204)
      throw new Error('Failed to delete routine');
    return true; // Success
  },

  async deleteRoutineList(id: number, token: string): Promise<boolean> {
    const response = await api.delete(`/routine-lists/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status !== 200 && response.status !== 204)
      throw new Error('Failed to delete routine list');
    return true;
  },

  async updateRoutineList(
    id: number,
    title: string,
    categoryId: number,
    token?: string,
  ): Promise<RoutineList> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const res = await api.patch(`/routine-lists/${id}`, { title, categoryId }, config);
    return res.data;
  },
};
