import { useCallback, useEffect, useState } from 'react';
import { userService } from '@/services/user.service';
import { User } from '@/types/user';

interface UseUserProfileResult {
  readonly user: User | null;
  readonly loading: boolean;
  readonly error: string | null;
}

export function useUserProfile(userId: string): UseUserProfileResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async (): Promise<void> => {
    if (!userId) {
      setLoading(false);
      setError('No user ID provided.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUserById(userId);
      setUser(data);
    } catch (e) {
      const status =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { status?: number } }).response?.status
          : undefined;
      if (status !== 401) {
        console.error('useUserProfile: failed to fetch user', e);
      }
      setError('Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, error };
}
