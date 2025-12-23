import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Routine } from '../../types/routine';

function remainingColor(mins: number) {
  if (mins <= 30) return '#E74C3C';
  if (mins <= 60) return '#C0392B';
  if (mins <= 240) return '#F39C12';
  return '#2ecc71';
}

type Props = {
  routine: Routine;
  onPress: () => void;
};

// "YYYY-MM-DD" + "HH:mm[:ss]" -> Date
function dateTimeFrom(dateStr?: string | null, timeStr?: string | null): Date | null {
  if (!timeStr) return null;

  const timeParts = timeStr.split(':').map((p) => Number(p));
  if (timeParts.length < 2) return null;

  const [h, m, s = 0] = timeParts;

  const base = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(base.getTime())) return null;

  base.setHours(h, m, s, 0);
  return base;
}

export function RoutineCard({ routine, onPress }: Props) {
  const { title, startTime, startDate } = routine as any;

  // eslint-disable-next-line no-unused-vars
  const { minsLeft, primaryLabel, secondaryLabel, isFuture } = useMemo(() => {
    const start = dateTimeFrom(startDate, startTime);
    if (!start) {
      return { minsLeft: 0, primaryLabel: '', secondaryLabel: '', isFuture: false };
    }

    const now = new Date();
    const DAY_MS = 24 * 60 * 60 * 1000;

    const diffStartMs = start.getTime() - now.getTime(); // start - now

    if (diffStartMs > DAY_MS) {
      return { minsLeft: 0, primaryLabel: '', secondaryLabel: '', isFuture: false };
    }

    if (diffStartMs > 0) {
      const startMins = Math.ceil(diffStartMs / (60 * 1000));
      const h = Math.floor(startMins / 60);
      const m = startMins % 60;

      const startsIn =
        h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `Starts in ${h}h` : `Starts in ${m}m`;

      return {
        minsLeft: startMins,
        primaryLabel: '',
        secondaryLabel: startsIn,
        isFuture: true,
      };
    }

    // Başlamış (start + 24h içinde)
    const elapsedMs = -diffStartMs;
    if (elapsedMs > DAY_MS) {
      return { minsLeft: 0, primaryLabel: '', secondaryLabel: '', isFuture: false };
    }

    const remainingMs = DAY_MS - elapsedMs;
    const totalMins = Math.ceil(remainingMs / (60 * 1000));
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;

    const left = h > 0 && m > 0 ? `${h}h ${m}m left` : h > 0 ? `${h}h left` : `${m}m left`;

    return {
      minsLeft: totalMins,
      primaryLabel: left,
      secondaryLabel: '',
      isFuture: false,
    };
  }, [startTime, startDate]);
  const color = useMemo(() => remainingColor(minsLeft), [minsLeft]);

  if (!primaryLabel && !secondaryLabel) {
    return null;
  }

  return (
    <Pressable onPress={onPress} style={styles.shadow}>
      <View style={styles.card}>
        <View style={styles.textWrap}>
          <Text style={styles.name} numberOfLines={1}>
            {title}
          </Text>

          {primaryLabel ? <Text style={[styles.duration, { color }]}>{primaryLabel}</Text> : null}

          {!!secondaryLabel && (
            <Text
              style={[
                styles.subLabel,
                { color }, // Starts in de aynı renk temasını kullanacak
              ]}
            >
              {secondaryLabel}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => console.log('Camera pressed:', routine.id)}
          style={styles.cameraTouchable}
          hitSlop={10}
        >
          <Ionicons name="camera" size={22} color="#1B2A6B" />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    marginHorizontal: 14,
    marginVertical: 9,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  card: {
    borderRadius: 16,
    backgroundColor: 'rgba(245,245,245,0.95)',
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textWrap: { flex: 1, paddingRight: 10 },
  name: {
    color: '#1B2A6B',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  duration: { fontSize: 14, fontWeight: '800' },

  cameraTouchable: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subLabel: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
  },
});
