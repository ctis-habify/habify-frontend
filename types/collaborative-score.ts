export type CollaborativeRank =
  | 'Newcomer'
  | 'Contributor'
  | 'Collaborator'
  | 'Leader'
  | 'Champion';

export interface CollaborativeRankInfo {
  readonly label: CollaborativeRank;
  readonly icon: 'leaf-outline' | 'people-outline' | 'star-outline' | 'shield-outline' | 'trophy-outline';
  readonly color: string;
  readonly minPoints: number;
}

export interface CollaborativeScoreSummary {
  totalPoints: number;
  currentStreak: number;
}

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
