import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { collaborativeScoreService } from '../services/collaborative-score.service';
import {
  CollaborativeRankInfo,
  resolveCollaborativeRank,
} from '../types/collaborative-score';

interface UseCollaborativeScoreResult {
  readonly points: number;
  readonly streak: number;
  readonly rank: CollaborativeRankInfo;
  readonly loading: boolean;
}

export function useCollaborativeScore(): UseCollaborativeScoreResult {
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchScore = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await collaborativeScoreService.getCollaborativeScore();
      setPoints(data.totalPoints ?? 0);
      setStreak(data.currentStreak ?? 0);
    } catch {
      // Gracefully fallback to defaults on error
      setPoints(0);
      setStreak(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchScore();
    }, [fetchScore]),
  );

  const rank = resolveCollaborativeRank(points);

  return { points, streak, rank, loading };
}
