import React, { useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Routine } from "../../types/routine";
import { RoutineCard } from "./RoutineCard";
import { TodayHeader } from "./TodayHeader";

type Props = {
  items: Routine[];
  loading: boolean;
  onRefresh: () => void;
  // eslint-disable-next-line no-unused-vars
  onPressRoutine: (id: string) => void;
};

export function TodayRoutinesList({ items, loading, onRefresh, onPressRoutine }: Props) {
  // UI values here (can be moved later to backend)
  const streakDays = 15;
  const points = 456;
  console.log("TodayRoutinesList rendering: items count =", items.length, "loading =", loading);
  const safeItems = items ?? [];
  console.log("TodayRoutinesList rendering: items count =", safeItems.length, "loading =", loading);
  console.log("Routines:", items);
  const header = useMemo(() => {
    return <TodayHeader loading={loading} streakDays={streakDays} points={points} />;
  }, [loading, points, streakDays]);

  return (
    <View style={styles.panel}>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <RoutineCard 
            routine={item} 
            onPress={() => onPressRoutine(item.id)} 
          />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={header}
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
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 86,
    borderRadius: 28,
    backgroundColor: "rgba(15, 45, 120, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingTop: 10,
    overflow: "hidden",
  },
  listContent: { paddingBottom: 10, paddingHorizontal: 8 },
  emptyWrap: { paddingVertical: 30, alignItems: "center" },
  emptyText: { color: "rgba(255,255,255,0.85)", fontWeight: "700" },
});
