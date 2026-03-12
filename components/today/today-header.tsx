import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

   
type Props = {
  points: number;
  loading: boolean;
  onMenuPress?: () => void;
};

export function TodayHeader({points, loading}: Props): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';
  
  const getLevel = (pts: number) => {
    if (pts >= 100) return { label: "Pro", icon: "trophy-outline" as const, color: "#FFD700" }; 
    if (pts >= 50) return { label: "Good", icon: "star-outline" as const, color: "#FF8C00" }; 
    return { label: "Beginner", icon: "leaf-outline" as const, color: "#4CAF50" }; 
  };

  const level = getLevel(points);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* ... header row ... */}
      <View style={styles.headerRow}>
        
        <View>
          <Text style={[styles.dateText, { color: colors.icon }]}>{today}</Text>
          <Text style={[styles.title, { color: colors.text }]}>Today's Routine</Text>
        </View>
        
        <View
          style={[
            styles.levelBadge,
            {
              backgroundColor: isDark ? colors.surface : '#fff',
              borderColor: isDark ? colors.border : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
            <Ionicons name={level.icon} size={24} color={level.color} style={{ marginRight: 8 }} />
            <Text style={[styles.levelText, { color: level.color }]}>
                {points} Points
            </Text>
        </View>
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
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  dateText: {
    fontSize: 13,
    fontWeight: "400",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "400",
    letterSpacing: -0.5,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  levelText: {
    fontSize: 16,
    fontWeight: "400",
  },
  divider: {
    height: 1,
    marginBottom: 10,
  },
  loadingWrap: { paddingVertical: 10 },
});
