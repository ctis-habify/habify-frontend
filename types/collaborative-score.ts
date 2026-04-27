export type CollaborativeRank =
  | 'Newcomer'
  | 'Contributor'
  | 'Collaborator'
  | 'Leader'
  | 'Champion';

export type CupTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
export type LeaderboardMedal = 'BRONZE' | 'SILVER' | 'GOLD';

export interface CupInfo {
  readonly tier: CupTier;
  readonly label: string;
  readonly icon: string;
  readonly color: string;
}

export interface UserCupAward {
  readonly tier: CupTier;
  readonly totalPoints: number;
  readonly firstPlaceCount?: number;
}

export interface LeaderboardMedalInfo {
  readonly medal: LeaderboardMedal;
  readonly label: string;
  readonly icon: string;
  readonly color: string;
}

export interface CollaborativeRankInfo {
  readonly label: CollaborativeRank;
  readonly icon: 'leaf-outline' | 'people-outline' | 'star-outline' | 'shield-outline' | 'trophy-outline';
  readonly color: string;
  readonly minPoints: number;
}

export interface CollaborativeScoreSummary {
  totalPoints: number;
  currentStreak: number;
  nextBonusStreak: number;
  nextBonusPoints: number;
  cup?: UserCupAward | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  totalPoints: number;
  cup?: UserCupAward | null;
  leaderboardMedal?: LeaderboardMedal | null;
  isDoneToday?: boolean;
}

export const CUP_TIERS: readonly CupInfo[] = [
  { tier: 'DIAMOND', label: 'Diamond Cup', icon: '💎', color: '#67E8F9' },
  { tier: 'GOLD', label: 'Gold Cup', icon: '🏆', color: '#FACC15' },
  { tier: 'SILVER', label: 'Silver Cup', icon: '🥈', color: '#CBD5E1' },
  { tier: 'BRONZE', label: 'Bronze Cup', icon: '🥉', color: '#D97706' },
] as const;

export const LEADERBOARD_MEDALS: readonly LeaderboardMedalInfo[] = [
  { medal: 'GOLD', label: 'Gold Cup', icon: '🏆', color: '#F59E0B' },
  { medal: 'SILVER', label: 'Silver Cup', icon: '🏆', color: '#94A3B8' },
  { medal: 'BRONZE', label: 'Bronze Cup', icon: '🏆', color: '#EA580C' },
] as const;

export const COLLABORATIVE_RANKS: readonly CollaborativeRankInfo[] = [
  { label: 'Champion', icon: 'trophy-outline', color: '#FFD700', minPoints: 500 },
  { label: 'Leader', icon: 'shield-outline', color: '#E879F9', minPoints: 250 },
  { label: 'Collaborator', icon: 'star-outline', color: '#FF8C00', minPoints: 100 },
  { label: 'Contributor', icon: 'people-outline', color: '#60A5FA', minPoints: 25 },
  { label: 'Newcomer', icon: 'leaf-outline', color: '#4CAF50', minPoints: 0 },
] as const;

export function resolveCollaborativeRank(points: number): CollaborativeRankInfo {
  for (const rank of COLLABORATIVE_RANKS) {
    if (points >= rank.minPoints) {
      return rank;
    }
  }
  return COLLABORATIVE_RANKS[COLLABORATIVE_RANKS.length - 1];
}

export function normalizeCupTier(value: unknown): CupTier | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toUpperCase().replace(/[\s_-]+/g, '');
  if (normalized === 'BRONZE') return 'BRONZE';
  if (normalized === 'SILVER') return 'SILVER';
  if (normalized === 'GOLD') return 'GOLD';
  if (normalized === 'DIAMOND') return 'DIAMOND';
  if (normalized === 'BRONZECUP') return 'BRONZE';
  if (normalized === 'SILVERCUP') return 'SILVER';
  if (normalized === 'GOLDCUP') return 'GOLD';
  if (normalized === 'DIAMONDCUP') return 'DIAMOND';

  return null;
}

export function normalizeLeaderboardMedal(value: unknown): LeaderboardMedal | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toUpperCase();
  if (normalized === 'BRONZE') return 'BRONZE';
  if (normalized === 'SILVER') return 'SILVER';
  if (normalized === 'GOLD') return 'GOLD';

  return null;
}

export function getCupInfoByTier(tier: CupTier | null | undefined): CupInfo | null {
  if (!tier) return null;
  return CUP_TIERS.find((cup) => cup.tier === tier) ?? null;
}

export function getLeaderboardMedalInfo(
  medal: LeaderboardMedal | null | undefined,
): LeaderboardMedalInfo | null {
  if (!medal) return null;
  return LEADERBOARD_MEDALS.find((item) => item.medal === medal) ?? null;
}

export function createBronzeCupAward(totalPoints: number = 0): UserCupAward {
  return {
    tier: 'BRONZE',
    totalPoints,
  };
}

export function createCupAwardFromFirstPlaceCount(
  firstPlaceCount: number,
  totalPoints: number = 0,
): UserCupAward | null {
  if (firstPlaceCount >= 100) {
    return { tier: 'GOLD', totalPoints, firstPlaceCount };
  }
  if (firstPlaceCount >= 10) {
    return { tier: 'SILVER', totalPoints, firstPlaceCount };
  }
  if (firstPlaceCount >= 1) {
    return { tier: 'BRONZE', totalPoints, firstPlaceCount };
  }

  return null;
}

export function createLeaderboardCupAward(
  rank: number,
  totalPoints: number = 0,
): UserCupAward | null {
  if (rank === 1) {
    return { tier: 'BRONZE', totalPoints };
  }

  return null;
}
