import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { routineService } from '../../../services/routine.service';
import type { Routine } from '../../../types/routine';


import { BACKGROUND_GRADIENT } from '@/app/theme';
import { setAuthToken } from '@/services/api';
import { BottomReturnButton } from '../../../components/today/BottomReturnButton';
import { TodayRoutinesList } from '../../../components/today/TodayRoutinesList';

const TOKEN_KEY = 'habify_access_token';

async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export default function TodayRoutinesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Routine[]>([]);

  const goToRoutineDetail = useCallback(
    (id: string) => {
      // @ts-ignore
      router.push({ pathname: '/(personal)/routine/[id]', params: { id } }); 
    },
    [router],
  );
  
  const handleCameraPress = useCallback(
    (id: string) => {
      // @ts-ignore
      router.push({ pathname: '/(personal)/camera-modal', params: { routineId: id } });
    },
    [router],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();

      if (!token) {
        setAuthToken(null);
        setItems([]);
        return;
      }

      // Token'ı interceptor'a set et
      setAuthToken(token);
      const res = await routineService.getTodayRoutines();
      console.log('/routines/today response:', res);

      // Normalize et: array değilse içinden array çıkar
      const normalized: Routine[] = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.data)
          ? (res as any).data
          : Array.isArray((res as any)?.items)
            ? (res as any).items
            : Array.isArray((res as any)?.routines)
              ? (res as any).routines
              : [];

      setItems(normalized.filter(r => {
        if (!r.startTime) return true; 

        const now = new Date();
        const [h, m] = r.startTime.split(':').map(Number);
        const start = new Date();
        start.setHours(h, m, 0, 0);

        // Check end time for failure
        let isFailed = false;
        if (r.endTime) {
            const [eh, em] = r.endTime.split(':').map(Number);
            const end = new Date();
            end.setHours(eh, em, 0, 0);
            if (now > end && !r.isDone) {
                isFailed = true;
            }
        }

        // Show if started AND not failed
        return now >= start && !isFailed; 
      }));
    } catch (e: any) {
      console.log('Today routines load error:', e);
      if (e.response) {
        console.log('Error payload:', JSON.stringify(e.response.data, null, 2));
      }
      setItems([]);
    } finally {

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      load();
    }
  }, [isFocused, load]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={BACKGROUND_GRADIENT}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },


});
