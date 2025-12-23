/* eslint-disable no-unused-vars */
import { RoutineRow, RoutineRowProps } from '@/components/routines/RoutineRow';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DOT_COUNT = 7;

type Props = {
  tagLabel: string; // kategori adı (Sport/Music/Study)
  title: string;    // liste adı (Sport List vs)
  showWeekDays?: boolean;
  routines: RoutineRowProps[];
  onPressAddRoutine?: () => void;
  onRoutineToggle?: (index: number, value: boolean) => void;
  onItemPress?: (id: string) => void;
};

export const RoutineCategoryCard: React.FC<Props> = ({
  tagLabel,
  title,
  routines,
  onPressAddRoutine,
  onRoutineToggle,
  onItemPress,
}) => {
  const allCompleted = routines.length > 0 && routines.every((r) => r.completed);

  return (
    <View style={styles.card}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        {/* ✅ sol üst: sadece kategori */}
        <Text style={styles.categoryTitle}>{tagLabel}</Text>

        {/* ✅ sağ üst: liste adı + küçük + */}
        <View style={styles.headerRight}>
          <Text style={styles.title}>{title}</Text>

          {!!onPressAddRoutine && (
            <TouchableOpacity
              onPress={onPressAddRoutine}
              style={styles.plusBtn}
              hitSlop={10}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* DOTS */}
      <View style={styles.dotRow}>
        {Array.from({ length: DOT_COUNT }).map((_, idx) => {
          const isCheckedDot = allCompleted && idx === 0;
          return (
            <View key={idx} style={[styles.dot, isCheckedDot && styles.filledDot]}>
              {isCheckedDot && <Ionicons name="checkmark" size={18} color="#ffffff" />}
            </View>
          );
        })}
      </View>

      <View style={styles.divider} />

      {/* RUTINLER */}
      {routines.map((routine: any, idx) => (
        <View key={routine.id ?? routine.name ?? `${routine.name}-${idx}`}>
          <RoutineRow
            {...routine}
            onToggle={(val: any) => onRoutineToggle?.(idx, val)}
            onPress={() => onItemPress?.(routine.id)}
          />
          {idx !== routines.length - 1 && <View style={styles.lightDivider} />}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(226, 232, 240, 0.92)',
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 18,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  categoryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffffff',
    backgroundColor: '#1d4ed8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },

  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1d4ed8ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

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

  divider: { height: 10 },
  lightDivider: {
    height: 1,
    backgroundColor: 'rgba(15,23,42,0.06)',
  },
});
