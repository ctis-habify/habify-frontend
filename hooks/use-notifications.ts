import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { notificationService } from '../services/notification.service';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
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
      (_notification) => {
        // Foreground notification received – no special handling needed,
        // the handler above shows the alert automatically.
      },
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (_response) => {
        // User tapped a notification – could navigate to a specific screen.
        // For now we do nothing; the notifications screen shows all reminders.
      },
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [setupPush]);
}
