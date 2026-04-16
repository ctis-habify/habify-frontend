import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated as RNAnimated, StyleSheet, Text, View } from 'react-native';

import { AnimatedFlame } from '@/components/animations/animated-flame';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CollaborativeRankInfo } from '@/types/collaborative-score';

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  readonly points: number;
  readonly streak: number;
  readonly nextBonusStreak: number;
  readonly nextBonusPoints: number;
  readonly rank: CollaborativeRankInfo;
  readonly loading: boolean;
  readonly accentColor?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

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
  nextBonusStreak,
  nextBonusPoints,
  rank,
  loading,
  accentColor,
}: Props): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const effectiveAccentColor = accentColor || Colors[theme].primary;
  
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
      <RNAnimated.View style={[styles.container, styles.shimmerContainer, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border, opacity: shimmerAnim }]}>
        <View style={[styles.shimmerBar, { backgroundColor: Colors[theme].border }]} />
        <View style={[styles.shimmerBar, styles.shimmerBarShort, { backgroundColor: Colors[theme].border }]} />
        <View style={[styles.shimmerBar, { backgroundColor: Colors[theme].border }]} />
      </RNAnimated.View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
        {/* Points Column */}
        <View style={styles.statColumn}>
          <View style={[styles.iconWrap, { backgroundColor: Colors[theme].surface }]}>
            <Ionicons name="diamond-outline" size={20} color={effectiveAccentColor} />
          </View>
          <Text style={[styles.statValue, { color: effectiveAccentColor }]}>{displayPoints}</Text>
          <Text style={[styles.statLabel, { color: Colors[theme].icon }]}>Points</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: Colors[theme].border }]} />

        {/* Rank Column */}
        <View style={styles.statColumn}>
          <View style={[styles.iconWrap, { backgroundColor: Colors[theme].surface }]}>
            <Ionicons name={rank.icon} size={20} color={rank.color} />
          </View>
          <Text style={[styles.statValue, { color: rank.color }]}>{rank.label}</Text>
          <Text style={[styles.statLabel, { color: Colors[theme].icon }]}>Rank</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: Colors[theme].border }]} />

        {/* Streak Column */}
        <View style={styles.statColumn}>
          <View style={[styles.iconWrap, { backgroundColor: Colors[theme].surface }]}>
            <Ionicons name="flame" size={20} color="#F97316" />
          </View>
          <Text style={[styles.statValue, { color: '#F97316' }]}>{streak}</Text>
          <Text style={[styles.statLabel, { color: Colors[theme].icon }]}>Streak</Text>
        </View>
      </View>

      {/* Bonus Strip */}
      {nextBonusStreak > 0 && (
        <View style={[styles.bonusStrip, { backgroundColor: `${effectiveAccentColor}10`, borderColor: `${effectiveAccentColor}30` }]}>
          <Ionicons name="gift-outline" size={16} color={effectiveAccentColor} />
          <Text style={[styles.bonusText, { color: Colors[theme].text }]}>
            Reach <Text style={{ fontWeight: '800', color: effectiveAccentColor }}>{nextBonusStreak} days</Text> streak to get <Text style={{ fontWeight: '800', color: effectiveAccentColor }}>+{nextBonusPoints} bonus points!</Text>
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  container: {
    flexDirection: 'row',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderWidth: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bonusStrip: {
    marginTop: 20, // Kart ile bonus satırı arasında daha fazla boşluk
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bonusText: {
    color: '#F5EFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  shimmerContainer: {
    justifyContent: 'space-around',
    paddingVertical: 22,
  },
  shimmerBar: {
    width: 60,
    height: 14,
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
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 36,
  },
});
