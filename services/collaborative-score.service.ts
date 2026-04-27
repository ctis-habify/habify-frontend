import {
  CollaborativeScoreSummary,
  LeaderboardEntry,
  UserCupAward,
  createCupAwardFromFirstPlaceCount,
  normalizeLeaderboardMedal,
  normalizeCupTier,
  CupTier,
} from '../types/collaborative-score';
import { api } from './api';

const toNumberOrDefault = (value: unknown, defaultValue: number = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed: number = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return defaultValue;
};

const toStringOrNull = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  return null;
};

const getFirstPlaceCount = (value: unknown): number | null => {
  if (!value || typeof value !== 'object') return null;

  const source: Record<string, unknown> = value as Record<string, unknown>;
  const count: number = toNumberOrDefault(
    source.firstPlaceCount ||
      source.first_place_count ||
      source.firstPlaces ||
      source.first_places ||
      source.winCount ||
      source.win_count ||
      source.wins,
    -1,
  );

  return count >= 0 ? count : null;
};

const getArrayFromResponse = (data: unknown): unknown[] => {
  // BFS through the response to find the first array, prioritising known keys
  const priorityKeys = ['data', 'leaderboard', 'items', 'results', 'entries', 'users', 'scores', 'list'];
  const queue: unknown[] = [data];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) return current;
    if (typeof current !== 'object') continue;

    const obj = current as Record<string, unknown>;

    for (const key of priorityKeys) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
    for (const key of priorityKeys) {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        queue.push(obj[key]);
      }
    }
    for (const val of Object.values(obj)) {
      if (val && typeof val === 'object') queue.push(val);
    }
  }

  return [];
};

const getCupAward = (value: unknown): UserCupAward | null => {
  if (!value) return null;

  if (typeof value === 'string') {
    const tierFromString: CupTier | null = normalizeCupTier(value);
    return tierFromString
      ? {
          tier: tierFromString,
          totalPoints: 0,
        }
      : null;
  }

  if (typeof value !== 'object') return null;

  const source: Record<string, unknown> = value as Record<string, unknown>;
  const tierFromResponse: CupTier | null = normalizeCupTier(
    String(source.tier ||
      source.cupTier ||
      source.cup_tier ||
      source.cupType ||
      source.cup_type ||
      source.level ||
      source.type ||
      source.name ||
      source.label || '')
  );

  if (!tierFromResponse) {
    return null;
  }

  const totalPoints: number = toNumberOrDefault(
    source.totalPoints ||
      source.points ||
      source.score ||
      source.totalXp ||
      source.xp,
    0,
  );
  const firstPlaceCount: number | null = getFirstPlaceCount(source);

  if (firstPlaceCount !== null) {
    const awardFromCount: UserCupAward | null = createCupAwardFromFirstPlaceCount(firstPlaceCount, totalPoints);
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

const normalizeLeaderboardEntry = (value: unknown): LeaderboardEntry => {
  const source: Record<string, unknown> = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  // Support nested user object: { rank, user: { id, name, ... }, totalPoints }
  const nested: Record<string, unknown> = (source.user && typeof source.user === 'object'
    ? source.user
    : {}) as Record<string, unknown>;

  const userId = String(
    source.userId || source.user_id ||
    nested.id || nested.userId ||
    source.id || ''
  );
  const name = String(
    source.name || source.fullName || source.userName ||
    nested.name || nested.fullName || nested.userName || nested.username ||
    source.username || 'Unnamed User'
  );
  const username = toStringOrNull(
    source.username || source.user_name || nested.username || nested.user_name
  );
  const avatarUrl = toStringOrNull(
    source.avatarUrl || source.avatar_url || source.profileImage ||
    nested.avatarUrl || nested.avatar_url || nested.profileImage
  );

  return {
    rank: toNumberOrDefault(source.rank || source.position, 0),
    userId,
    name,
    username,
    avatarUrl,
    totalPoints: toNumberOrDefault(source.totalPoints || source.points || source.score, 0),
    cup:
      getCupAward(source.cup) ||
      getCupAward(source.userCup) ||
      getCupAward(source.user_cup) ||
      getCupAward(source.badge) ||
      getCupAward(nested.cup) ||
      getCupAward(nested) ||
      null,
    leaderboardMedal: normalizeLeaderboardMedal(
      source.leaderboardMedal || source.medal || source.rankMedal,
    ),
    isDoneToday: !!(source.isDoneToday || source.is_done_today || source.doneToday || source.done),
  };
};

const normalizeScoreSummary = (value: unknown): CollaborativeScoreSummary => {
  const source: Record<string, unknown> = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;

  return {
    totalPoints: toNumberOrDefault(source.totalPoints || source.points || source.score, 0),
    currentStreak: toNumberOrDefault(source.currentStreak || source.streak || source.current_streak, 0),
    nextBonusStreak: toNumberOrDefault(
      source.nextBonusStreak || source.next_bonus_streak,
      5,
    ),
    nextBonusPoints: toNumberOrDefault(
      source.nextBonusPoints || source.next_bonus_points,
      10,
    ),
    cup:
      getCupAward(source) ||
      getCupAward(source.cup) ||
      getCupAward(source.userCup) ||
      getCupAward(source.user_cup) ||
      getCupAward(source.badge) ||
      getCupAward(source.user) ||
      null,
  };
};

export const collaborativeScoreService = {
  // Get collaborative score summary for current user
  getCollaborativeScore: async (): Promise<CollaborativeScoreSummary> => {
    const res = await api.get('/collaborative/score/me');
    return normalizeScoreSummary(res.data);
  },

  // Get global leaderboard ranked by collaborative score
  getLeaderboard: async (limit?: number): Promise<LeaderboardEntry[]> => {
    const params: Record<string, number> = {};
    if (limit !== undefined) params.limit = limit;
    const res = await api.get('/collaborative/score/leaderboard', { params });
    return getArrayFromResponse(res.data).map(normalizeLeaderboardEntry);
  },
};
