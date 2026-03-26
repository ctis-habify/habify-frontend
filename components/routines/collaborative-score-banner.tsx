import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated as RNAnimated, StyleSheet, Text, View } from 'react-native';

import { CollaborativeRankInfo } from '@/types/collaborative-score';

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  readonly points: number;
  readonly streak: number;
  readonly rank: CollaborativeRankInfo;
  readonly loading: boolean;
  readonly accentColor?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#E879F9'; // Fuchsia-400 default
const COUNTER_DURATION = 900;
const COUNTER_INTERVAL = 16; // ~60fps

// ── Animated Counter Hook ────────────────────────────────────────────────────

function useAnimatedCounter(target: number, loading: boolean): number {
  const [display, setDisplay] = React.useState(0);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loading) {
      setDisplay(0);
      return;
    }

    const startTime = Date.now();
    const startValue = 0;

    const tick = (): void => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / COUNTER_DURATION, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (target - startValue) * eased);
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = setTimeout(tick, COUNTER_INTERVAL);
      }
    };

    tick();

    return () => {
      if (rafRef.current) clearTimeout(rafRef.current);
    };
  }, [target, loading]);

  return display;
}

// ── Component ────────────────────────────────────────────────────────────────

export function CollaborativeScoreBanner({
  points,
  streak,
  rank,
  loading,
  accentColor = ACCENT,
}: Props): React.ReactElement {
  // ── Animated Points Counter ──────────────────────────────────────────────
  const displayPoints = useAnimatedCounter(points, loading);

  // ── Shimmer Loading ──────────────────────────────────────────────────────
  const shimmerAnim = useRef(new RNAnimated.Value(0.3)).current;

  useEffect(() => {
    if (loading) {
      const loop = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(shimmerAnim, {
            toValue: 0.7,
            duration: 600,
            useNativeDriver: true,
          }),
          RNAnimated.timing(shimmerAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    return undefined;
  }, [loading, shimmerAnim]);

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <RNAnimated.View style={[styles.container, styles.shimmerContainer, { opacity: shimmerAnim }]}>
        <View style={styles.shimmerBar} />
        <View style={[styles.shimmerBar, styles.shimmerBarShort]} />
        <View style={styles.shimmerBar} />
      </RNAnimated.View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Points Column */}
      <View style={styles.statColumn}>
        <View style={styles.iconWrap}>
          <Ionicons name="diamond-outline" size={20} color={accentColor} />
        </View>
        <Text style={[styles.statValue, { color: accentColor }]}>{displayPoints}</Text>
        <Text style={styles.statLabel}>Points</Text>
      </View>

      <View style={styles.divider} />

      {/* Rank Column */}
      <View style={styles.statColumn}>
        <View style={styles.iconWrap}>
          <Ionicons name={rank.icon} size={20} color={rank.color} />
        </View>
        <Text style={[styles.statValue, { color: rank.color }]}>{rank.label}</Text>
        <Text style={styles.statLabel}>Rank</Text>
      </View>

      <View style={styles.divider} />

      {/* Streak Column */}
      <View style={styles.statColumn}>
        <View style={styles.iconWrap}>
          <Ionicons name="flame" size={20} color="#F97316" />
        </View>
        <Text style={[styles.statValue, { color: '#F97316' }]}>{streak}</Text>
        <Text style={styles.statLabel}>Streak</Text>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  shimmerContainer: {
    justifyContent: 'space-around',
    paddingVertical: 22,
  },
  shimmerBar: {
    width: 60,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 7,
  },
  shimmerBarShort: {
    width: 50,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
