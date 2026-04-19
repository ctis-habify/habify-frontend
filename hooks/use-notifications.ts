import { useEffect, useRef, useCallback } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { notificationService } from '../services/notification.service';
import { emitToast } from './use-toast';
import { useRouter } from 'expo-router';

const USER_KEY = 'habify_user';

interface QuietModeSettings {
  enabled: boolean;
  start: string; // HH:mm
  end: string;   // HH:mm
}

async function getQuietModeSettings(): Promise<QuietModeSettings | null> {
  try {
    const storedUser = await SecureStore.getItemAsync(USER_KEY);
    if (!storedUser) return null;
    const user = JSON.parse(storedUser);
    return {
      enabled: !!user.quietModeEnabled,
      start: user.quietModeStart || '22:00',
      end: user.quietModeEnd || '08:00',
    };
  } catch {
    return null;
  }
}

function isNowInQuietRange(start: string, end: string): boolean {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startH, startM] = start.split(':').map(Number);
  const startTime = startH * 60 + startM;
  
  const [endH, endM] = end.split(':').map(Number);
  const endTime = endH * 60 + endM;

  if (startTime < endTime) {
    // Normal range (e.g., 09:00 - 17:00)
    return currentTime >= startTime && currentTime < endTime;
  } else {
    // Overnight range (e.g., 22:00 - 08:00)
    return currentTime >= startTime || currentTime < endTime;
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const quietSettings = await getQuietModeSettings();
    const shouldSuppress = quietSettings?.enabled && isNowInQuietRange(quietSettings.start, quietSettings.end);

    return {
      shouldShowBanner: !shouldSuppress,
      shouldShowList: true, // Still keep in the list so users can see them later
      shouldPlaySound: !shouldSuppress,
      shouldSetBadge: !shouldSuppress,
    };
  },
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: projectId ?? undefined,
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
    });
  }

  return tokenData.data;
}

export function useNotifications(isAuthenticated: boolean) {
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const setupPush = useCallback(async () => {
    if (!isAuthenticated) return;

    const token = await registerForPushNotificationsAsync();
    if (token) {
      try {
        await notificationService.registerPushToken(token);
      } catch (err) {
        console.warn('Failed to register push token with backend:', err);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setupPush();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data as Record<string, unknown>;
        const body =
          notification.request.content.body ??
          notification.request.content.title ??
          'New reminder';

        if (
          typeof data?.type === 'string' &&
          (data.type === 'streak_bonus' ||
            (data.type === 'verification_result' && !!data.collaborativeRoutineId))
        ) {
          DeviceEventEmitter.emit('COLLABORATIVE_SCORE_REFRESH');
        }

        if (data?.status === 'streak_bonus_awarded') {
          notificationService.getRewardReminder(
            body,
            notification.request.content.title ?? 'Reward unlocked',
            typeof data.routineId === 'string'
              ? data.routineId
              : typeof data.collaborativeRoutineId === 'string'
                ? data.collaborativeRoutineId
                : null,
            typeof data.notificationId === 'string' ? data.notificationId : undefined,
          );
        }

        emitToast(body, 'bell');
      },
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        
        if (data?.routineId && typeof data.routineId === 'string') {
          if (data.type === 'streak_bonus') {
            router.push(`/(personal)/routine/${data.routineId}`);
          } else {
            router.push({
              pathname: '/(personal)/camera-modal',
              params: { routineId: data.routineId }
            });
          }
        } else if (data?.collaborativeRoutineId && typeof data.collaborativeRoutineId === 'string') {
          router.push(`/(collaborative)/routine/${data.collaborativeRoutineId}/chat`);
        } else {
          // If it's a social notification or other, go to notifications list
          router.push('/(personal)/notifications');
        }
      },
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [setupPush]);
}
