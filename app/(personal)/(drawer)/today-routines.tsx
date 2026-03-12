import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
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
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const goToRoutineDetail = useCallback(
    (id: string) => {
      router.push({ pathname: '/(personal)/routine/[id]', params: { id } }); 
    },
    [router],
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
      const res = await routineService.getTodayRoutines();
      console.log('/routines/today response:', res);

      // Normalize et (res is unknown usually, but service says Routine[] | {routines: Routine[]})
      const incoming = (typeof res === 'object' && res !== null && 'routines' in res) 
        ? (res as { routines: Routine[] }).routines 
        : res;
      const normalized: Routine[] = Array.isArray(incoming) ? incoming : [];

      const filtered = normalized.filter(r => {
        // Show if not completed today
        // We want to show everything meant for today, even if it's "Failed" (passed its time)
        // because the user might want to see what they missed or catch up if allowed.
        return !r.isCompleted && !r.isDone; 
      });
      
      console.log('[DEBUG] Today routines count after filter:', filtered.length);
      setItems(filtered);

      const reminder = notificationService.getUnfinishedTaskReminder(filtered.length);
      if (reminder) {
        setToastMessage(reminder);
        setToastVisible(true);
      }
    } catch (e: unknown) {
      console.log('Today routines load error:', e);
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
      load();
    }
  }, [isFocused, load]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={screenColors}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <TodayRoutinesList
          items={items}
          loading={loading}
          onRefresh={load}
          onPressRoutine={goToRoutineDetail}
          onPressCamera={handleCameraPress}
        />

        <BottomReturnButton
          label="Return Routine Lists"
          onPress={() => router.replace('/(personal)/(drawer)/routines')}
        />

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


});
