import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type Props = {
  streakDays: number;
  points: number;
  loading: boolean;
};

export function TodayHeader({ streakDays, points, loading }: Props) {
  return (
    <>
      <View style={styles.topSpacer} />

      <View style={styles.pill}>
        <View style={styles.pillLeft}>
          <View style={styles.flame} />
          <Text style={styles.pillTitle}>
            {streakDays}-Days{"\n"}Streak
          </Text>
        </View>

        <View style={styles.pillMiddleBars}>
          <View style={[styles.bar, styles.bar1]} />
          <View style={[styles.bar, styles.bar2]} />
          <View style={[styles.bar, styles.bar3]} />
        </View>

        <Text style={styles.pillPoints}>{points} point</Text>
      </View>

      <Text style={styles.title}>Today’s Routine List</Text>
      <View style={styles.divider} />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  topSpacer: { height: 10 },

  pill: {
    marginHorizontal: 18,
    marginTop: 16,
    marginBottom: 18,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(186, 220, 255, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pillLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  flame: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FF6A3D",
    transform: [{ rotate: "-20deg" }],
  },
  pillTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  pillMiddleBars: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  bar: { width: 10, borderRadius: 3 },
  bar1: { height: 18, backgroundColor: "#FF5DA2" },
  bar2: { height: 30, backgroundColor: "#E53935" },
  bar3: { height: 22, backgroundColor: "#FF5DA2" },
  pillPoints: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
    marginHorizontal: 26,
    marginBottom: 10,
  },

  loadingWrap: { paddingVertical: 16 },
});
