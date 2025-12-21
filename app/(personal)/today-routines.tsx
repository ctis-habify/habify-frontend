import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { routineService } from "../../services/routine.service";
import type { Routine } from "../../types/routine";

import { BottomReturnButton } from "../../components/today/BottomReturnButton";
import { TodayRoutinesList } from "../../components/today/TodayRoutinesList";

const TOKEN_KEY = "habify_access_token";

async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export default function TodayRoutinesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Routine[]>([]);

  const goToRoutineDetail = useCallback(
    (id: string) => {
      router.push({ pathname: "/(personal)/routines", params: { routineId: id } });
    },
    [router]
  );

  const load = useCallback(async () => {
  setLoading(true);
  try {
    const token = await getToken();
    if (!token) {
      setItems([]);
      return;
    }

    // sadece token kontrolü değil, token ile istek atılması
    const routines = await routineService.getTodayRoutines(token);

    console.log('/routines/today response:', routines);

    setItems(routines);

  } catch (e) {
    console.log('Today routines load error:', e);
    setItems([]);
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#4F86E8", "#2C54C9", "#1E3C98", "#0D2A7A"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <TodayRoutinesList
          items={items}
          loading={loading}
          onRefresh={load}
          onPressRoutine={goToRoutineDetail}
        />

        <BottomReturnButton
          label="Return Routine Lists"
          onPress={() => router.replace("/(personal)/routines")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
});
