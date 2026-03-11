import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { notificationService } from '../services/notification.service';
import { emitToast } from './use-toast';

const POLL_INTERVAL_MS = 30_000;

export function useUnreadCount(isAuthenticated: boolean) {
  const [count, setCount] = useState(0);
  const prevCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }
    try {
      const newCount = await notificationService.fetchUnreadCount();
      setCount(newCount);

      if (newCount > prevCountRef.current && prevCountRef.current >= 0) {
        try {
          const { data } = await notificationService.fetchNotifications(1, 0);
          if (data.length > 0) {
            emitToast(data[0].body, 'bell');
          }
        } catch {
          // ignore
        }
      }
      prevCountRef.current = newCount;
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  useEffect(() => {
    prevCountRef.current = -1;
    refresh();

    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') refresh();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, [refresh]);

  return { count, refresh };
}
