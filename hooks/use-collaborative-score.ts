import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useAuth } from './use-auth';
import { collaborativeScoreService } from '../services/collaborative-score.service';
import {
  CollaborativeRankInfo,
  UserCupAward,
  createLeaderboardCupAward,
  resolveCollaborativeRank,
} from '../types/collaborative-score';

interface UseCollaborativeScoreResult {
  readonly points: number;
  readonly streak: number;
  readonly rank: CollaborativeRankInfo;
  readonly cup: UserCupAward | null;
  readonly loading: boolean;
}

export function useCollaborativeScore(): UseCollaborativeScoreResult {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [cup, setCup] = useState<UserCupAward | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchScore = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const [data, leaderboard] = await Promise.all([
        collaborativeScoreService.getCollaborativeScore(),
        collaborativeScoreService.getLeaderboard(50).catch(() => []),
      ]);
      setPoints(data.totalPoints ?? 0);
      setStreak(data.currentStreak ?? 0);
      const currentUserId = user?.id ? String(user.id).trim() : '';
      const currentEntry = leaderboard.find((entry) => entry.userId === currentUserId);
      const fallbackCup = !data.cup && currentEntry
        ? createLeaderboardCupAward(currentEntry.rank, data.totalPoints ?? 0)
        : null;
      setCup(data.cup ?? fallbackCup);
    } catch {
      // Gracefully fallback to defaults on error
      setPoints(0);
      setStreak(0);
      setCup(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchScore();
    }, [fetchScore]),
  );

  const rank = resolveCollaborativeRank(points);

  return { points, streak, rank, cup, loading };
}
