
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RoutineRow, RoutineRowProps } from './RoutineRow';

const DOT_COUNT = 7; 

type Props = {
  tagLabel: string;
  title: string;
  showWeekDays?: boolean;
  routines: RoutineRowProps[];
  onRoutineToggle?: (index: number, value: boolean) => void;
  onItemPress?: (id: string) => void;
};

export const RoutineCategoryCard: React.FC<Props> = ({
  tagLabel,
  title,
  routines,
  onRoutineToggle,
  onItemPress,
}) => {
  // tüm rutinler tamamlandı mı?
  const allCompleted =
    routines.length > 0 && routines.every((r) => r.completed);
  return (
    <View style={styles.card}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.chipRow}>
          <View style={[styles.chip, styles.tagChip]}>
            <Text style={styles.chipText}>{tagLabel}</Text>
          </View>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.dotRow}>
        {Array.from({ length: DOT_COUNT }).map((_, idx) => {
          const isCheckedDot = allCompleted && idx === 0;
          return (
            <View
              key={idx}
              style={[styles.dot, isCheckedDot && styles.filledDot]}
            >
              {isCheckedDot && (
                <Ionicons name="checkmark" size={20} color="#ffffff" />
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.divider} />

      {/* RUTINLER */}
      {routines.map((routine, idx) => (
        <View key={routine.name}>
          <RoutineRow
            {...routine}
            onToggle={(val) => onRoutineToggle?.(idx, val)}
            onPress={() => onItemPress?.(routine.id)}
          />
          {idx !== routines.length - 1 && (
            <View style={styles.lightDivider} />
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#e5e7eb',
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 18,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagChip: { backgroundColor: '#1d4ed8' },
  freqChip: { backgroundColor: '#38bdf8' },
  chipText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
  },

  /** SPORT DOTS */
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',   
    alignItems: 'center',
    gap: 14,
    marginTop: 16,
    marginBottom: 12,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2563eb',
    backgroundColor: '#2563eb', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledDot: {
    width: 26,   
    height: 26,
    borderRadius: 26,
    backgroundColor: '#2563eb',
  },

  /** MUSIC DAYS */
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 12,
  },
  dayPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2563eb',
    backgroundColor: '#edf4ff',
  },
  dayPillDone: {
    backgroundColor: '#2563eb',
  },
  dayText: {
    color: '#1e3a8a',
    fontWeight: '700',
  },
  dayTextDone: {
    color: '#ffffff',
  },

  divider: { height: 10 },
  lightDivider: {
    height: 1,
    backgroundColor: 'rgba(15,23,42,0.06)',
  },
});