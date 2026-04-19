import { HomeButton } from '@/components/navigation/home-button';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter, Platform, StatusBar, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { routineService } from '../../../services/routine.service';
import type { Routine } from '../../../types/routine';


import { Toast } from '@/components/ui/toast';
import { getBackgroundGradient } from '@/constants/theme';
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
  const screenColors = getBackgroundGradient(theme);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Routine[]>([]);
  const [streak, setStreak] = useState(0);
  const [collabIds, setCollabIds] = useState<Set<string>>(new Set());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [contentAnimationKey, setContentAnimationKey] = useState(0);

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
      
      // Fetch collab IDs for reliable detection
      try {
        const joinedCollab = await routineService.getCollaborativeRoutines();
        const cIds = new Set(joinedCollab.map(r => r.id));
        setCollabIds(cIds);
      } catch (_ce) {
        // ignore
      }

      const res = await routineService.getTodayRoutines();
      const castedRes = res as any;

      const incoming = castedRes?.routines ?? (Array.isArray(res) ? res : []);
      const normalized: Routine[] = incoming;
      setStreak(castedRes?.streak ?? 0);

      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();
      const currentTimeInSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;

      const filtered = normalized.filter(r => {
        // Show if not completed today and not failed
        if (r.isCompleted || r.isDone || r.isFailed) return false;

        // Time-based filtering: hide if not started yet OR if deadline passed (Failed)
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

  useEffect(() => {
    if (isFocused) {
      setContentAnimationKey((current) => current + 1);
      load();
    }
    
    // Also listen for cross-screen events like successful AI verification in camera-modal
    const sub = DeviceEventEmitter.addListener('refreshPersonalRoutines', () => {
      load();
    });
    
    return () => sub.remove();
  }, [isFocused, load]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={screenColors}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <HomeButton color="#fff" style={styles.menuButton} />
        </View>
        <Animated.View
          key={`today-routines-content-${contentAnimationKey}`}
          entering={FadeInDown.delay(120).duration(560).springify()}
          style={styles.content}
        >
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
        </Animated.View>

        <Toast 
          visible={toastVisible} 
          message={toastMessage} 
          onHide={() => setToastVisible(false)} 
        />
      </View>
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
