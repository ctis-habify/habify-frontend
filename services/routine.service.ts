import { PublicRoutine, Routine, RoutineList, RoutineLog } from '../types/routine';
import { UserCupAward, createCupAwardFromFirstPlaceCount, normalizeCupTier, normalizeLeaderboardMedal } from '../types/collaborative-score';
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
  if (value && typeof value === 'object') {
     const obj = value as Record<string, unknown>;
     return toStringOrUndefined(obj.name || obj.value || obj.type || obj.label || obj.text || obj.message);
  }
  return undefined;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const getFirstPlaceCount = (value: unknown): number | null => {
  if (!value || typeof value !== 'object') return null;

  const source = value as Record<string, unknown>;
  const count =
    toOptionalNumber(
      source.firstPlaceCount ||
        source.first_place_count ||
        source.firstPlaces ||
        source.first_places ||
        source.winCount ||
        source.win_count ||
        source.wins,
    ) ?? null;

  return count !== null && count >= 0 ? count : null;
};

const getCupAward = (value: unknown): UserCupAward | null => {
  if (!value) return null;

  if (typeof value === 'string') {
    const tierFromString = normalizeCupTier(value);
    return tierFromString
      ? {
          tier: tierFromString,
          totalPoints: 0,
        }
      : null;
  }

  if (typeof value !== 'object') return null;

  const source = value as Record<string, unknown>;
  const tierFromResponse = normalizeCupTier(
    source.tier ||
      source.cupTier ||
      source.cup_tier ||
      source.cupType ||
      source.cup_type ||
      source.level ||
      source.type ||
      source.name ||
      source.label,
  );

  if (!tierFromResponse) {
    return null;
  }

  const totalPoints =
    toOptionalNumber(
      source.totalPoints ||
        source.points ||
        source.score ||
        source.totalXp ||
        source.xp,
    ) ?? 0;
  const firstPlaceCount = getFirstPlaceCount(source);

  if (firstPlaceCount !== null) {
    const awardFromCount = createCupAwardFromFirstPlaceCount(firstPlaceCount, totalPoints);
    if (awardFromCount) {
      return awardFromCount;
    }
  }

  return {
    tier: tierFromResponse,
    totalPoints,
    firstPlaceCount: firstPlaceCount ?? undefined,
  };
};

const enrichParticipantWithCup = (participant: unknown): unknown => {
  if (!participant || typeof participant !== 'object') return participant;

  const source = participant as Record<string, unknown>;
  const existingUser =
    source.user && typeof source.user === 'object'
      ? (source.user as Record<string, unknown>)
      : null;

  const cup =
    getCupAward(source) ||
    getCupAward(source.cup) ||
    getCupAward(source.userCup) ||
    getCupAward(source.user_cup) ||
    getCupAward(source.badge) ||
    getCupAward(existingUser) ||
    getCupAward(existingUser?.cup) ||
    getCupAward(existingUser?.userCup) ||
    getCupAward(existingUser?.user_cup) ||
    getCupAward(existingUser?.badge);

  return {
    ...source,
    cup,
    user: existingUser
      ? {
          ...existingUser,
          cup: cup || getCupAward(existingUser.cup) || null,
        }
      : source.user,
  };
};

const normalizeRoutineLeaderboardEntry = (item: unknown): Record<string, unknown> => {
  const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;

  return {
    ...source,
    userId: toStringOrUndefined(source.userId || source.user_id || source.id) || '',
    name: toStringOrUndefined(source.name || source.fullName || source.userName || source.username) || '',
    username: toStringOrUndefined(source.username || source.user_name) || null,
    avatarUrl: toStringOrUndefined(source.avatarUrl || source.avatar_url || source.profileImage) || null,
    score: toNumberOrDefault(source.score || source.points || source.totalPoints, 0),
    rank: toNumberOrDefault(source.rank || source.position, 0),
    cup:
      getCupAward(source) ||
      getCupAward(source.cup) ||
      getCupAward(source.userCup) ||
      getCupAward(source.user_cup) ||
      getCupAward(source.badge) ||
      getCupAward(source.user) ||
      null,
    leaderboardMedal: normalizeLeaderboardMedal(
      source.leaderboardMedal || source.medal || source.rankMedal,
    ),
  };
};



const normalizeCollaborativeRoutine = (item: unknown): Routine => {
  const rawSource = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
  const nestedRoutine = (rawSource.routine && typeof rawSource.routine === 'object' ? rawSource.routine : {}) as Record<string, unknown>;
  const rules = (rawSource.rules && typeof rawSource.rules === 'object' ? rawSource.rules : {}) as Record<string, unknown>;
  
  // Flatten so we don't need deep paths
  const source = { ...rules, ...nestedRoutine, ...rawSource } as Record<string, unknown>;

  const categoryValue = source.category;
  const categoryName =
    toStringOrUndefined(source.categoryName || source.category_name) ||
    (categoryValue && typeof categoryValue === 'object'
      ? toStringOrUndefined((categoryValue as Record<string, unknown>).name)
      : undefined) ||
    (typeof categoryValue === 'string' ? categoryValue : undefined) ||
    '';

  const routineName = toStringOrUndefined(source.routineName || source.routine_name || source.title || source.name) || '';

  let startTime = toStringOrUndefined(source.startTime || source.start_time || source.startAt || source.time) || '';
  let endTime = toStringOrUndefined(source.endTime || source.end_time || source.endAt || source.time) || '';

  if (startTime && startTime.includes(' - ')) {
    const parts = startTime.split(' - ');
    startTime = parts[0] || '';
    if (endTime === parts[0] || endTime === startTime || endTime.includes(' - ')) {
      endTime = parts[1] || '';
    }
  }

  return {
    ...(source as Partial<Routine>),
    id: toStringOrUndefined(source.id || source.routineId || source.routine_id) || '',
    routineName,
    title: routineName,
    description: toStringOrUndefined(source.description || source.desc) || '',
    lives: toNumberOrDefault(source.lives || source.life || source.remainingLives || source.maxLives, 0),
    streak: toNumberOrDefault(source.streak || source.currentStreak || source.current_streak, 0),
    startTime,
    endTime,
    creatorId: toStringOrUndefined(source.creatorId || source.creator_id || source.userId || source.user_id || source.ownerId || (source.creator as any)?.id || (source.user as any)?.id),
    isPublic: source.isPublic === true || source.is_public === true || String(source.visibility || source.privacy || '').toLowerCase() === 'public',
    categoryName,
    rewardCondition: toStringOrUndefined(source.rewardCondition || source.reward_condition || source.reward) || '',
    frequencyType: toStringOrUndefined(source.frequencyType || source.frequency_type || source.frequency || source.repetition || source.repeat_type || source.repeat) || '',
    routineType: 'collaborative',
  } as Routine;
};

const normalizeRoutineLog = (item: unknown): RoutineLog => {
  const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
  
  return {
    ...(source as Partial<RoutineLog>),
    id: toNumberOrDefault(source.id || source.logId || source.log_id || source.LOG_ID),
    routineId: toStringOrUndefined(source.routineId || source.routine_id || source.ROUTINE_ID) || '',
    userId: toStringOrUndefined(source.userId || source.user_id || source.USER_ID) || '',
    logDate: toStringOrUndefined(source.logDate || source.log_date || source.LOG_DATE) || '',
    createdAt: toStringOrUndefined(source.createdAt || source.created_at || source.CREATED_AT),
    isAiVerified: source.isAiVerified === true || source.is_ai_verified === true,
    isVerified: source.isVerified === true || source.is_verified === true || source.isVerifiedAI === true,
    verificationImageUrl: toStringOrUndefined(source.verificationImageUrl || source.verification_image_url || source.imageUrl),
    status: (toStringOrUndefined(source.status || source.STATUS) || 'pending').toLowerCase() as any,
    approvals: Array.isArray(source.approvals) ? source.approvals.map(a => typeof a === 'object' ? a : String(a)) : [],
    rejections: Array.isArray(source.rejections) ? source.rejections.map(r => typeof r === 'object' ? r : String(r)) : [],
    userName: toStringOrUndefined(source.userName || source.user_name || source.username || (source.user as any)?.name),
  } as RoutineLog;
};

const normalizeMessageStrings = (value: unknown): string[] => {
  return getArrayFromResponse(value)
    .map((item) => {
      if (typeof item === 'string') return item;
      const obj = item as { text?: string; message?: string; content?: string };
      return obj?.text || obj?.message || obj?.content || '';
    })
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
    try {
      const endpoint = routineId ? `/routines/${routineId}/logs` : '/routine-logs';
      const res = await api.get(endpoint);
      const data = getArrayFromResponse(res.data);
      return data.map(normalizeRoutineLog);
    } catch (err: any) {
      if (err.response?.status === 404 && routineId) {
        const res = await api.get('/routine-logs', { params: { routine_id: routineId } });
        const data = getArrayFromResponse(res.data);
        return data.map(normalizeRoutineLog);
      }
      throw err;
    }
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
    startTime?: string;
    endTime?: string;
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
    return getCollaborativeRoutinesFromResponse(res.data);
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
    const normalized = normalizeCollaborativeRoutine(res.data);
    return {
      ...normalized,
      participants: Array.isArray(res.data?.participants)
        ? res.data.participants.map(enrichParticipantWithCup)
        : [],
    };
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
      routineId,
      logDate,
      verificationImageUrl,
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
      isVerified: isVerified,
      verificationImageUrl: verificationImageUrl,
    });
    return res.data;
  },

  // ✅ Verify Collaborative Log (Voting)
  async verifyCollaborativeLog(
    logId: number,
    status: 'approved' | 'rejected',
  ): Promise<{ message: string }> {
    const res = await api.post(`/routines/collaborative/logs/${logId}/verify`, { status });
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

  // ✅ Browse Public Collaborative Routines (with optional search)
  async browsePublicRoutines(search?: string, categoryId?: number, frequencyType?: string): Promise<PublicRoutine[]> {
    const params: any = {};
    if (search) params.search = search;
    if (categoryId) params.categoryId = categoryId;
    if (frequencyType) params.frequencyType = frequencyType;
    const res = await api.get('/routines/collaborative/public', { params });
    return res.data;
  },

  // ✅ Join a Public Routine by ID
  async joinPublicRoutine(routineId: string): Promise<{ message: string }> {
    try {
      const res = await api.post(`/routines/collaborative/${routineId}/join`);
      return res.data;
    } catch (err: any) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw err;
    }
  },

  // Leave a Collaborative Routine
  async leaveRoutine(routineId: string): Promise<{ message: string }> {
    try {
      const res = await api.delete(`/routines/collaborative/${routineId}/leave`);
      return res.data;
    } catch (err: any) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw err;
    }
  },

  // ✅ Get Collaborative Routine Leaderboard
  async getCollaborativeRoutineLeaderboard(routineId: string): Promise<any[]> {
    const res = await api.get(`/routines/collaborative/${routineId}/leaderboard`);
    return getArrayFromResponse(res.data).map(normalizeRoutineLeaderboardEntry);
  },
};
