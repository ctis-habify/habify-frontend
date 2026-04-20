import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInLeft } from "react-native-reanimated";

import { AnimatedFlame } from '../animations/animated-flame';

   
type Props = {
  points: number;
  streak: number;
  loading: boolean;
  onMenuPress?: () => void;
};

export function TodayHeader({points, streak, loading}: Props): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';
  
  const getLevel = (pts: number) => {
    if (pts >= 100) return { label: "Pro", icon: "trophy-outline" as const, color: "#fbbf24" }; 
    if (pts >= 50) return { label: "Good", icon: "star-outline" as const, color: "#f97316" }; 
    return { label: "Beginner", icon: "leaf-outline" as const, color: "#10b981" }; 
  };

  const level = getLevel(points);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.headerRow}>
        <Animated.View 
          entering={FadeInLeft.delay(100).duration(500)}
          style={{ flex: 1 }}
        >
          <Text style={[styles.dateText, { color: colors.icon }]}>{today}</Text>
          <Text style={[styles.title, { color: colors.text }]}>Today's Routine</Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(200).duration(500).springify()}
          style={styles.badgesRow}
        >
          {/* Points Badge */}
          <View
            style={[
              styles.levelBadge,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                marginRight: 8,
              },
            ]}
          >
            <Ionicons name={level.icon} size={20} color={level.color} style={{ marginRight: 6 }} />
            <Text style={[styles.levelText, { color: level.color }]}>
              {points} XP
            </Text>
          </View>

          {/* Streak Badge */}
          <View
            style={[
              styles.streakBadge,
              {
                backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.08)',
                borderColor: 'rgba(249, 115, 22, 0.25)',
              },
            ]}
          >
            <AnimatedFlame streak={streak} size={20} />
            <View style={{ width: 4 }} />
            <Text style={[styles.streakText, { color: '#f97316' }]}>
              {streak}
            </Text>
          </View>
        </Animated.View>

      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  levelText: {
    fontSize: 14,
    fontWeight: "800",
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  streakText: {
    fontSize: 14,
    fontWeight: "800",

  },
  divider: {
    height: 1,
    marginBottom: 10,
    opacity: 0.5,
  },
  loadingWrap: { paddingVertical: 10 },
});
