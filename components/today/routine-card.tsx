import { Colors, ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimatedFlame } from '../animations/animated-flame';
import { ThrobbingHeart } from '../animations/throbbing-heart';
import type { Routine } from '@/types/routine';

function remainingColor(mins: number, colors: ThemeColors) {
  if (mins <= 30) return colors.error; 
  if (mins <= 60) return '#F97316'; // Orange-500
  if (mins <= 240) return '#EAB308'; // Yellow-500
  return colors.success;
}

type Props = {
  routine: Routine;
  onPress: () => void;
  onPressCamera?: (_id: string) => void;
};

export function RoutineCard({ routine, onPress, onPressCamera }: Props): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';
  const { title, endTime, remainingLabel } = routine;

  // Live update state
  const [label, setLabel] = React.useState(remainingLabel === 'Pending' ? 'Pending' : '');
  const [minsLeft, setMinsLeft] = React.useState(0);

  const updateState = React.useCallback(() => {
     if (remainingLabel === 'Pending') {
        setLabel('Pending');
        return;
     }

     const freq = (routine.frequencyType || '').toUpperCase();
     if (freq === 'WEEKLY') {
        setLabel('Weekly');
        setMinsLeft(1440); // Any large positive number
        return;
     }

     if (!endTime) {
        setLabel('Pending');
        setMinsLeft(100);
        return;
     }

     const now = new Date();
     // Parse end time
     const parts = endTime.split(':').map(Number);
     if (parts.length < 2) {
         setLabel('Pending');
         return;
     }
     const [eh, em] = parts;
     const end = new Date();
     end.setHours(eh, em, 0, 0);

     const diffMs = end.getTime() - now.getTime();
     if (diffMs < 0) {
        setLabel('Failed');
        setMinsLeft(-1);
        return;
     }

     const diffMins = Math.ceil(diffMs / 60000);
     setMinsLeft(diffMins);

     if (diffMins < 60) {
        setLabel(`${diffMins}m left`);
     } else {
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        setLabel(`${h}h ${m}m left`);
     }
  }, [endTime, remainingLabel, routine.frequencyType]);

  React.useEffect(() => {
     updateState();
     const id = setInterval(updateState, 1000);
     return () => clearInterval(id);
  }, [updateState]);

  const color = useMemo(() => remainingColor(minsLeft, colors), [minsLeft, colors]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0 : 0.06,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.textWrap}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{title}</Text>
          
          {label !== 'Pending' && (
            <View style={styles.badgeRow}>
              {label !== 'Weekly' && (
                <View
                  style={[
                    styles.timeBadge,
                    { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                  ]}
                >
                   <Ionicons name="time-outline" size={14} color={color} style={{ marginRight: 4 }} />
                   <Text style={[styles.duration, { color: isDark ? colors.white : color }]}>{label}</Text>
                </View>
              )}

              {!!routine.collaborativeKey && (
                <View
                  style={[
                    styles.groupBadge,
                    { 
                        backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(14, 165, 233, 0.06)',
                        borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(14, 165, 233, 0.15)',
                        borderWidth: 1 
                    },
                  ]}
                >
                  <Ionicons name="people" size={12} color={isDark ? '#38bdf8' : '#0284c7'} />
                  <Text style={[styles.groupBadgeText, { color: isDark ? '#38bdf8' : '#0284c7' }]}>Group</Text>
                </View>
              )}

              {(routine.streak ?? 0) > 0 && (
                <View style={[styles.statBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.05)' }]}>
                  <AnimatedFlame streak={routine.streak} size={12} />
                  <Text style={[styles.statBadgeText, { color: isDark ? '#fbbf24' : '#d97706' }]}>{routine.streak}</Text>
                </View>
              )}

              {(routine.lives ?? 0) > 0 && (
                <View style={[styles.statBadge, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.05)' }]}>
                  <ThrobbingHeart lives={Math.max(0, (routine.lives ?? 0) - (routine.missedCount ?? 0))} size={12} />
                  <Text style={[styles.statBadgeText, { color: isDark ? '#f87171' : '#dc2626' }]}>
                    {Math.max(0, (routine.lives ?? 0) - (routine.missedCount ?? 0))}/{routine.lives}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <Pressable
          onPress={() => onPressCamera?.(routine.id)}
          style={[styles.cameraBtn, { backgroundColor: isDark ? colors.background : colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          hitSlop={10}
        >
          <Ionicons name="camera" size={20} color={colors.primary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    
    // Premium Soft Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }]
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textWrap: { 
    flex: 1, 
    paddingRight: 12 
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  duration: { 
    fontSize: 12, 
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cameraBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
