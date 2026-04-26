import { PublicRoutine, Routine, RoutineList, RoutineLog, TodayScreenResponse } from '../types/routine';
import { UserCupAward, createCupAwardFromFirstPlaceCount, normalizeCupTier, normalizeLeaderboardMedal } from '../types/collaborative-score';
import { api } from './api';

export type PredefinedRoutineMessage = {
  text: string;
  category: string;
  color?: string;
  order?: number;
};

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
  description: string;
  lives: number;
}>;

const getArrayFromResponse = (data: unknown): unknown[] => {
  const queue: unknown[] = [data];
  const visited: Set<unknown> = new Set<unknown>();
  const priorityKeys: string[] = ['data', 'messages', 'predefinedMessages', 'items', 'results'];

  while (queue.length > 0) {
    const current: unknown = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) return current as unknown[];
    if (typeof current !== 'object') continue;

    const objectValue: Record<string, unknown> = current as Record<string, unknown>;

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
  return getArrayFromResponse(data).map(normalizeCollaborativeRoutine);
};

const toNumberOrDefault = (value: unknown, defaultValue: number = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed: number = Number(value);
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

  const source: Record<string, unknown> = participant as Record<string, unknown>;
  const existingUser: Record<string, unknown> | null =
    source.user && typeof source.user === 'object'
      ? (source.user as Record<string, unknown>)
      : null;

  const cup: UserCupAward | null =
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



const normalizeRoutine = (item: unknown): Routine => {
  const source: Record<string, unknown> = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
  
  const categoryValue: unknown = source.category;
  const categoryName: string =
    toStringOrUndefined(source.categoryName || source.category_name) ||
    (categoryValue && typeof categoryValue === 'object'
      ? toStringOrUndefined((categoryValue as Record<string, unknown>).name)
      : undefined) ||
    (typeof categoryValue === 'string' ? categoryValue : undefined) ||
    '';

  const routineName: string = toStringOrUndefined(source.routineName || source.routine_name || source.title || source.name) || '';

  let startTime: string = toStringOrUndefined(source.startTime || source.start_time || source.startAt || source.time) || '';
  let endTime: string = toStringOrUndefined(source.endTime || source.end_time || source.endAt || source.time) || '';

  if (startTime && startTime.includes(' - ')) {
    const parts: string[] = startTime.split(' - ');
    startTime = parts[0] || '';
    if (endTime === parts[0] || endTime === startTime || endTime.includes(' - ')) {
      endTime = parts[1] || '';
    }
  }

  const rawIsDone = source.isDone === true || source.is_done === true || source.is_completed === true || source.completed === true;
  
  // Strict Today Check: We look for ANY field that indicates when this was last touched.
  let isDone = rawIsDone;
  const lastTouch = toStringOrUndefined(
    source.updatedAt || 
    source.updated_at || 
    source.lastCompletedAt || 
    source.last_done || 
    source.logDate || 
    source.log_date ||
    source.completionDate
  );

  if (isDone) {
    if (!lastTouch) {
      // If we have no timestamp at all, we cannot prove it was done TODAY.
      // Given the legacy 'stuck' issues, we assume it's stale and reset it.
      isDone = false; 
    } else {
      try {
        const d = new Date(lastTouch);
        const updateDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        if (updateDateStr !== todayStr) {
          isDone = false; // Stale completion from a previous day
        }
      } catch (e) {
        isDone = false;
      }
    }
  }

  return {
    ...(source as Partial<Routine>),
    id: toStringOrUndefined(source.id || source.routineId || source.routine_id) || '',
    routineName,
    title: routineName,
    description: toStringOrUndefined(source.description || source.desc) || '',
    lives: toNumberOrDefault(source.lives || source.life || source.remainingLives, 0),
    maxLives: toNumberOrDefault(source.maxLives || source.lives || 0, 0),
    streak: toNumberOrDefault(source.streak || source.currentStreak || source.current_streak, 0),
    startTime,
    endTime,
    isDone, // Use our strictly checked isDone
    creatorId: toStringOrUndefined(source.creatorId || source.creator_id || source.userId || source.user_id || source.ownerId || (source.creator as Record<string, unknown>)?.id || (source.user as Record<string, unknown>)?.id),
    isPublic: source.isPublic === true || source.is_public === true || String(source.visibility || source.privacy || '').toLowerCase() === 'public',
    categoryName,
    rewardCondition: toStringOrUndefined(source.rewardCondition || source.reward_condition || source.reward) || '',
    frequencyType: toStringOrUndefined(source.frequencyType || source.frequency_type || source.frequency || source.repetition || source.repeat_type || source.repeat) || '',
    createdAt: toStringOrUndefined(source.createdAt || source.created_at || source.startDate || source.start_date),
  } as Routine;
};

const normalizeCollaborativeRoutine = (item: unknown): Routine => {
  const rawSource: Record<string, unknown> = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
  const nestedRoutine: Record<string, unknown> = (rawSource.routine && typeof rawSource.routine === 'object' ? rawSource.routine : {}) as Record<string, unknown>;
  const rules: Record<string, unknown> = (rawSource.rules && typeof rawSource.rules === 'object' ? rawSource.rules : {}) as Record<string, unknown>;
  
  const source: Record<string, unknown> = { ...rules, ...nestedRoutine, ...rawSource } as Record<string, unknown>;
  const normalized = normalizeRoutine(source);
  
  return {
    ...normalized,
    maxLives: toNumberOrDefault(rules.lives || source.maxLives || source.lives || 0, 0),
    routineType: 'collaborative',
  };
};

const normalizeRoutineLog = (item: unknown): RoutineLog => {
  const source: Record<string, unknown> = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
  
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
    status: (toStringOrUndefined(source.status || source.STATUS) || 'pending').toLowerCase() as 'pending' | 'approved' | 'rejected',
    approvals: Array.isArray(source.approvals) ? source.approvals.map((a: unknown) => typeof a === 'object' ? a : String(a)) : [],
    rejections: Array.isArray(source.rejections) ? source.rejections.map((r: unknown) => typeof r === 'object' ? r : String(r)) : [],
    userName: toStringOrUndefined(source.userName || source.user_name || source.username || (source.user as Record<string, unknown>)?.name || (source.user as Record<string, unknown>)?.username),
    userAvatar: toStringOrUndefined(source.userAvatar || source.user_avatar || (source.user as Record<string, unknown>)?.avatar || (source.user as Record<string, unknown>)?.avatarUrl || (source.user as Record<string, unknown>)?.profileImage || (source.user as Record<string, unknown>)?.user_avatar || (source.user as Record<string, unknown>)?.avatar_url),
    requiredApprovals: toNumberOrDefault(source.requiredApprovals || source.required_approvals, 0),
    approvalCount: toNumberOrDefault(source.approvalCount || source.approval_count, 0),
    isCompletedByGroup:
      source.isCompletedByGroup === true ||
      source.is_completed_by_group === true ||
      (toStringOrUndefined(source.status || source.STATUS) || '').toLowerCase() === 'approved',
    completionXp: toNumberOrDefault(source.completionXp || source.completion_xp, 0),
    submitterStreak: toNumberOrDefault(source.submitterStreak || source.submitter_streak, 0),
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

const normalizePredefinedRoutineMessages = (value: unknown): PredefinedRoutineMessage[] => {
  const fallback = normalizeMessageStrings(value).map((text, index) => ({
    text,
    category: 'general',
    order: index + 1,
  }));

  const array = getArrayFromResponse(value);
  if (array.length === 0) return fallback;

  const normalized = array
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          text: item.trim(),
          category: 'general',
          order: index + 1,
        } as PredefinedRoutineMessage;
      }

      if (!item || typeof item !== 'object') return null;
      const obj = item as Record<string, unknown>;
      const text = toStringOrUndefined(obj.text || obj.message || obj.content)?.trim();
      if (!text) return null;

      return {
        text,
        category: toStringOrUndefined(obj.category || obj.group || obj.type)?.toLowerCase() || 'general',
        color: toStringOrUndefined(obj.color),
        order: toOptionalNumber(obj.order) ?? index + 1,
      } as PredefinedRoutineMessage;
    })
    .filter((item): item is PredefinedRoutineMessage => !!item);

  return normalized.length > 0 ? normalized : fallback;
};

export const routineService = {
  // Get all routines for the authenticated user
  async getRoutines(): Promise<Routine[]> {
    const res: { data: unknown[] } = await api.get('/routines');
    return (res.data || []).map(normalizeRoutine);
  },
  // Today's routines
  async getTodayRoutines(): Promise<TodayScreenResponse> {
    const res: { data: { streak?: number; currentStreak?: number; current_streak?: number; routines: unknown[] } } = await api.get('/routines/today');
    return {
      streak: res.data.streak ?? res.data.currentStreak ?? res.data.current_streak ?? 0,
      routines: (res.data.routines || []).map(normalizeRoutine),
    };
  },

  // Get grouped routines
  async getGroupedRoutines(token?: string): Promise<RoutineList[]> {
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const res: { data: RoutineList[] } = await api.get('/routines/grouped', config);
    
    return (res.data || []).map(list => ({
      ...list,
      routines: (list.routines || []).map(normalizeRoutine)
    }));
  },

  // Get routine by ID
  async getRoutineById(routineId: string, token: string): Promise<Routine> {
    const res: { data: unknown } = await api.get(`/routines/${routineId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return normalizeRoutine(res.data);
  },

  // Get routine lists (routine groups)
  async getRoutineLists(): Promise<RoutineList[]> {
    const res: { data: RoutineList[] } = await api.get('/routine-lists');
    return (res.data || []).map(list => ({
      ...list,
      routines: (list.routines || []).map(normalizeRoutine)
    }));
  },
  async getRoutineLogs(routineId?: string): Promise<RoutineLog[]> {
    try {
      const endpoint: string = routineId ? `/routines/${routineId}/logs` : '/routine-logs';
      const res: { data: unknown } = await api.get(endpoint);
      const data: unknown[] = getArrayFromResponse(res.data);
      return data.map(normalizeRoutineLog);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const anyErr = err as { response: { status: number } };
        if (anyErr.response?.status === 404 && routineId) {
          const res: { data: unknown } = await api.get('/routine-logs', { params: { routine_id: routineId } });
          const data: unknown[] = getArrayFromResponse(res.data);
          return data.map(normalizeRoutineLog);
        }
      }
      throw err;
    }
  },
  
  // ✅ Get Calendar Logs (Unified for Personal & Collaborative)
  async getCalendarLogs(routineId: string, startDate: string, endDate: string, token: string): Promise<{date: string, isDone: boolean}[]> {
    const res: { data: unknown } = await api.get(`/routines/${routineId}/calendar`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { startDate, endDate },
    });
    return getArrayFromResponse(res.data) as { date: string; isDone: boolean }[];
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
  async joinGroup(key: string): Promise<{ message: string; id: string }> {
    try {
      const res: { data: { message: string; id: string } } = await api.post('/routines/join', { key });
      return res.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const responseData: Record<string, unknown> = (err as { response: { data: Record<string, unknown> } }).response.data;
        if (responseData.message) {
           throw new Error(String(responseData.message));
        }
      }
      throw err;
    }
  },

  // ✅ Group Detail (Profile View)
  async getGroupDetail(id: string): Promise<Routine & { participants: unknown[] }> {
    const res: { data: { participants?: unknown[] } } = await api.get(`/routines/group/${id}`);
    const normalized: Routine = normalizeCollaborativeRoutine(res.data);
    return {
      ...normalized,
      participants: Array.isArray(res.data?.participants)
        ? res.data.participants.map(enrichParticipantWithCup)
        : [],
    };
  },

  // ✅ Get Predefined Messages for Collaborative Routine Chat
  async getRoutinePredefinedMessages(): Promise<PredefinedRoutineMessage[]> {
    const res = await api.get('/routines/collaborative-chat/predefined');
    return normalizePredefinedRoutineMessages(res.data);
  },

  // ✅ Get Collaborative Routine Chat Messages
  async getRoutineChatMessages(routineId: string): Promise<unknown[]> {
    const res: { data: unknown } = await api.get(`/routines/collaborative-chat/${routineId}`);
    return getArrayFromResponse(res.data);
  },

  // ✅ Send Collaborative Routine Chat Message
  async sendRoutineChatMessage(routineId: string, message: string): Promise<{ message: string }> {
    const res: { data: { message: string } } = await api.post(`/routines/collaborative-chat/${routineId}`, { message });
    return res.data;
  },

  // ✅ Unified Verification Flow
  async verifyRoutine(body: { routineId: string; objectPath: string }): Promise<{ message: string }> {
    const res: { data: { message: string } } = await api.post('/routines/verify', body);
    return res.data;
  },

  // ✅ Send Routine Invitation
  async sendRoutineInvite(routineId: string, toUserId: string): Promise<{ message: string }> {
    const res: { data: { message: string } } = await api.post('/routine-invitations', { routineId, toUserId });
    return res.data;
  },

  // ✅ Remove Member from Collaborative Routine
  async removeMemberFromRoutine(routineId: string, userId: string): Promise<{ message: string }> {
    const res: { data: { message: string } } = await api.delete(`/routines/collaborative/${routineId}/members/${userId}`);
    return res.data;
  },

  // ✅ Get Pending Routine Invitations
  async getPendingRoutineInvites(): Promise<unknown[]> {
    const res: { data: unknown[] } = await api.get('/routine-invitations/received');
    return res.data;
  },

  // ✅ Accept Routine Invitation
  async acceptRoutineInvite(invitationId: string): Promise<{ message: string }> {
    const res: { data: { message: string } } = await api.patch(`/routine-invitations/${invitationId}/accept`);
    return res.data;
  },

  // ✅ Decline Routine Invitation
  async declineRoutineInvite(invitationId: string): Promise<{ message: string }> {
    const res: { data: { message: string } } = await api.patch(`/routine-invitations/${invitationId}/decline`);
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

  async updateRoutine(id: string, payload: UpdateRoutinePayload, token: string): Promise<Routine> {
    const response: { data: Routine; status: number } = await api.patch(`/routines/${id}`, payload, {
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
  async browsePublicRoutines(
    search?: string,
    categoryId?: number,
    frequencyType?: string,
    gender?: string,
    age?: number,
    xp?: number,
    creatorId?: string,
    memberId?: string
  ): Promise<PublicRoutine[]> {
    const params: Record<string, unknown> = {};
    if (search) params.search = search;
    if (categoryId) params.categoryId = categoryId;
    if (frequencyType) params.frequencyType = frequencyType;
    if (gender) params.gender = gender;
    if (age) params.age = age;
    if (xp) params.xp = xp;
    if (creatorId) params.creatorId = creatorId;
    if (memberId) params.memberId = memberId;
    const res: { data: PublicRoutine[] } = await api.get('/routines/collaborative/public', { params });
    return res.data;
  },

  // ✅ Join a Public Routine by ID
  async joinPublicRoutine(routineId: string): Promise<{ message: string }> {
    try {
      const res: { data: { message: string } } = await api.post(`/routines/collaborative/${routineId}/join`);
      return res.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const responseData: Record<string, unknown> = (err as { response: { data: Record<string, unknown> } }).response.data;
        if (responseData.message) {
           throw new Error(String(responseData.message));
        }
      }
      throw err;
    }
  },

  // Leave a Collaborative Routine
  async leaveRoutine(routineId: string): Promise<{ message: string }> {
    try {
      const res: { data: { message: string } } = await api.delete(`/routines/collaborative/${routineId}/leave`);
      return res.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const responseData: Record<string, unknown> = (err as { response: { data: Record<string, unknown> } }).response.data;
        if (responseData.message) {
           throw new Error(String(responseData.message));
        }
      }
      throw err;
    }
  },

  // Handle Creator Defeat (lives === 0) — deletes routine if alone, otherwise promotes a member
  async handleCreatorDefeat(routineId: string): Promise<{ message: string }> {
    try {
      const res: { data: { message: string } } = await api.post(`/routines/collaborative/${routineId}/creator-defeat`);
      return res.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const responseData: Record<string, unknown> = (err as { response: { data: Record<string, unknown> } }).response.data;
        if (responseData.message) {
           throw new Error(String(responseData.message));
        }
      }
      throw err;
    }
  },

  // ✅ Get Collaborative Routine Leaderboard
  async getCollaborativeRoutineLeaderboard(routineId: string): Promise<Record<string, unknown>[]> {
    const res: { data: unknown } = await api.get(`/routines/collaborative/${routineId}/leaderboard`);
    return getArrayFromResponse(res.data).map(normalizeRoutineLeaderboardEntry);
  },
};
