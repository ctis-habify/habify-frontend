import { useCallback, useEffect, useRef, useState } from 'react';
import { routineService } from '@/services/routine.service';
import { PublicRoutine } from '@/types/routine';

interface UseUserPublicRoutinesResult {
  readonly routines: PublicRoutine[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly markAsJoined: (routineId: string) => void;
}

export function useUserPublicRoutines(userId: string): UseUserPublicRoutinesResult {
  const [routines, setRoutines] = useState<PublicRoutine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const joinedCacheRef = useRef<Map<string, PublicRoutine>>(new Map());

  const fetchRoutines = useCallback(async (): Promise<void> => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await routineService.browsePublicRoutines(
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        userId
      );
      const list: PublicRoutine[] = Array.isArray(data) ? data : [];

      // Re-apply joined cache so navigating away and back preserves Joined state
      const merged = list.map((r) =>
        joinedCacheRef.current.has(r.id) ? { ...r, isAlreadyMember: true } : r,
      );
      setRoutines(merged);
    } catch {
      setError('Failed to load routines.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const markAsJoined = useCallback((routineId: string) => {
    setRoutines((prev) => {
      const target = prev.find((r) => r.id === routineId);
      if (target) joinedCacheRef.current.set(routineId, target);
      return prev.map((r) => (r.id === routineId ? { ...r, isAlreadyMember: true } : r));
    });
  }, []);

  return { routines, loading, error, markAsJoined };
}
