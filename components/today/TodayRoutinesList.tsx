import { Colors } from "@/constants/theme";
import React, { useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Routine } from "../../types/routine";
import { ThemedView } from "../themed-view";
import { RoutineCard } from "./RoutineCard";
import { TodayHeader } from "./TodayHeader";

type Props = {
  items: Routine[];
  loading: boolean;
  onRefresh: () => void;
  onPressRoutine: (id: string) => void;
};

export function TodayRoutinesList({ items, loading, onRefresh, onPressRoutine }: Props) {
  // UI values here (can be moved later to backend)
  const points = 456;
  
  const header = useMemo(() => {
    return <TodayHeader loading={loading} points={points} />;
  }, [loading, points]);

  return (
    <ThemedView variant="card" style={styles.panel}>
      {/* Fixed Header */}
      {header}

      <FlatList
        data={items}
        // ... same props
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <RoutineCard 
            routine={item} 
            onPress={() => onPressRoutine(item.id)} 
          />
        )}
        contentContainerStyle={styles.listContent}
        // ListHeaderComponent={header} // Removed from here
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
