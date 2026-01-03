/* eslint-disable no-unused-vars */
import { RoutineRow, RoutineRowProps } from '@/components/routines/RoutineRow';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

const DOT_COUNT = 7;

type Props = {
  tagLabel: string;
  title: string;
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
    <ThemedView variant="card" style={styles.card}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <ThemedText type="label" style={styles.categoryTitle}>{tagLabel}</ThemedText>

        <View style={styles.headerRight}>
          <ThemedText type="default" style={styles.title}>{title}</ThemedText>

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



      <View style={styles.divider} />

      {/* RUTINLER */}
      {/* RUTINLER */}
      {routines.length === 0 ? (
        <View style={styles.emptyListContainer}>
          <ThemedText type="default" style={styles.emptyListText}>
            No routines in this list.
          </ThemedText>
        </View>
      ) : (
        routines.map((routine: any, idx) => (
          <View key={routine.id ?? routine.name ?? `${routine.name}-${idx}`}>
            <RoutineRow
              {...routine}
              onToggle={(val: any) => onRoutineToggle?.(idx, val)}
              onPress={() => onItemPress?.(routine.id)}
            />
            {idx !== routines.length - 1 && <View style={styles.lightDivider} />}
          </View>
        ))
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 18,
    // Stronger Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 10,
  },

  categoryTitle: {
    color: "#fff",
    backgroundColor: Colors.light.primary, // Back to solid pill as requested/implied
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  title: {
    color: Colors.light.text, 
    fontSize: 20, // Larger
    fontWeight: '500', // Reduced to Medium
    letterSpacing: -0.5, // Tighter tracking for modern look
  },

  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },



  divider: { height: 4 },
  lightDivider: {
    height: 1,
    backgroundColor: '#f3f4f6', // Ultra light
    marginLeft: 66, 
    marginRight: 20,
  },
  emptyListContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    color: '#9ca3af',
    fontSize: 14,
    fontStyle: 'italic',
  },
});
