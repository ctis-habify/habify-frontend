import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter, Platform, StatusBar, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { routineService } from '../../../services/routine.service';
import type { Routine, TodayScreenResponse } from '../../../types/routine';


import { Toast } from '@/components/ui/toast';
import { Colors, getBackgroundGradient } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { setAuthToken } from '@/services/api';
import { notificationService } from '@/services/notification.service';
import { BottomReturnButton } from '../../../components/today/bottom-return-button';
import { TodayRoutinesList } from '../../../components/today/today-routines-list';

const TOKEN_KEY = 'habify_access_token';

async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export default function TodayRoutinesScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { token: authContextToken } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const screenColors = getBackgroundGradient(theme);

  const opacity = useSharedValue(0);
  const translateX = useSharedValue(40);
  const scale = useSharedValue(0.97);

  const ENTER_SPRING = { damping: 35, stiffness: 80, mass: 1.0 };

  const pageStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Routine[]>([]);
  const [streak, setStreak] = useState(0);
  const [collabIds, setCollabIds] = useState<Set<string>>(new Set());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const goToRoutineDetail = useCallback(
    (routine: Routine) => {
      const isCollaborative = collabIds.has(routine.id);

      if (isCollaborative) {
        // Navigate to Collaborative Chat
        router.push({
          pathname: '/(collaborative)/routine/[id]/chat',
          params: { id: routine.id }
        });
      } else {
        // Navigate to Personal Detail
        router.push({
          pathname: '/(personal)/routine/[id]',
          params: { id: routine.id }
        });
      }
    },
    [router, collabIds],
  );

  const handleCameraPress = useCallback(
    (id: string) => {
      router.push({ pathname: '/(personal)/camera-modal', params: { routineId: id } });
    },
    [router],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = authContextToken || await getToken();

      if (!token) {
        setAuthToken(null);
        setItems([]);
        return;
      }

      // Token'ı interceptor'a set et
      setAuthToken(token);

      try {
        const joinedCollab = await routineService.getCollaborativeRoutines();
        const cIds = new Set(joinedCollab.map(r => r.id));
        setCollabIds(cIds);
      } catch (_ce) {
      }

      const res: TodayScreenResponse = await routineService.getTodayRoutines();

      const incoming: Routine[] = res.routines || [];
      const normalized: Routine[] = incoming;
      setStreak(res.streak ?? 0);

      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();
      const currentTimeInSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;

      const filtered = normalized.filter(r => {
        // Show if not completed today and not failed
        if (r.isCompleted || r.isDone || r.isFailed) return false;

        if (r.startTime) {
          const [sh, sm, ss] = r.startTime.split(':').map(Number);
          const startInSeconds = (sh || 0) * 3600 + (sm || 0) * 60 + (ss || 0);
          if (currentTimeInSeconds < startInSeconds) return false;
        }

        if (r.endTime) {
          const [eh, em, es] = r.endTime.split(':').map(Number);
          const endInSeconds = (eh || 0) * 3600 + (em || 0) * 60 + (es || 0);
          if (currentTimeInSeconds > endInSeconds) return false;
        }

        return true;
      });

      setItems(filtered);

      const reminder = notificationService.getUnfinishedTaskReminder(filtered.length);
      if (reminder) {
        setToastMessage(reminder);
        setToastVisible(true);
      }
    } catch (e: unknown) {
      setItems([]);
      let msg = "Failed to load today's routines.";
      if (e instanceof Error) msg = e.message;
      setToastMessage(msg);
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  }, [authContextToken]);

  const triggerEntrance = useCallback(() => {
    opacity.value = 0;
    translateX.value = 40;
    scale.value = 0.97;

    opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    translateX.value = withSpring(0, ENTER_SPRING);
    scale.value = withSpring(1, ENTER_SPRING);
  }, []);

  useEffect(() => {
    if (isFocused) {
      triggerEntrance();
      load();
    }
  }, [isFocused, triggerEntrance, load]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('refreshPersonalRoutines', () => {
      load();
    });

    return () => sub.remove();
  }, [load, isFocused]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

      <Animated.View style={[{ flex: 1, backgroundColor: screenColors[0] }, pageStyle]}>
        <LinearGradient
          colors={screenColors}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.content}>
            <TodayRoutinesList
              items={items}
              streak={streak}
              loading={loading}
              onRefresh={load}
              onPressRoutine={goToRoutineDetail}
              onPressCamera={handleCameraPress}
            />

            <BottomReturnButton
              label="Return Routine Lists"
              onPress={() => router.replace('/(personal)/(drawer)/routines')}
            />
          </View>

          <Toast
            visible={toastVisible}
            message={toastMessage}
            onClose={() => setToastVisible(false)}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'flex-end',
  },
  menuButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },

});
