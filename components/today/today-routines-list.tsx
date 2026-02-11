import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { userService } from "@/services/user.service";
import type { Routine } from "../../types/routine";
import { ThemedView } from "../themed-view";
import { RoutineCard } from "./routine-card";
import { TodayHeader } from "./today-header";

type Props = {
  items: Routine[];
  loading: boolean;
  onRefresh: () => void;
  onPressRoutine: (_id: string) => void;
  onPressCamera?: (_id: string) => void;
};

// Helper for keyExtractor
const keyExtractor = (item: Routine) => item.id;

export function TodayRoutinesList({ items, loading, onRefresh, onPressRoutine, onPressCamera }: Props): React.ReactElement {
  // 1. State
  const [points, setPoints] = useState(0);

  // 2. Callbacks
  const fetchUserData = useCallback(async () => {
    try {
      const user = await userService.getCurrentUser();
      setPoints(user.total_xp ?? 0);
    } catch (error) {
      console.error("Failed to fetch user XP", error);
    }
  }, []);

  const renderItem = useCallback(({ item }: { item: Routine }) => (
    <RoutineCard 
      routine={item} 
      onPress={() => onPressRoutine(item.id)} 
      onPressCamera={onPressCamera}
    />
  ), [onPressRoutine, onPressCamera]);

  // 3. Effects
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );
  
  // 4. Memos
  const header = useMemo(() => {
    return <TodayHeader loading={loading} points={points} />;
  }, [loading, points]);

  // 5. Render
  return (
    <ThemedView variant="card" style={styles.panel}>
      {/* Fixed Header */}
      {header}

      <FlatList
        data={items}
        // ... same props
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<View style={{ height: 90 }} />}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={onRefresh}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No routines for today.</Text>
            </View>
          ) : null
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 55,
    borderRadius: 28,
    marginTop: 10,
    overflow: "hidden",
  },
  listContent: { paddingBottom: 10, paddingHorizontal: 8 },
  emptyWrap: { paddingVertical: 30, alignItems: "center" },
  emptyText: { color: Colors.light.text, fontWeight: "700" },
});
