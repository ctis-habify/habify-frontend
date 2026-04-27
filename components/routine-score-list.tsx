import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { UserAvatar } from '@/components/ui/user-avatar';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { CupIndicator } from '@/components/cup-indicator';
import {
  UserCupAward,
} from '@/types/collaborative-score';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type RoutineLeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  score: number;
  cup?: UserCupAward | null;
  isDoneToday?: boolean;
};

type RoutineScoreListProps = {
  leaderboard: RoutineLeaderboardEntry[];
  currentUserId: string;
  loading: boolean;
};

export const RoutineScoreList: React.FC<RoutineScoreListProps> = ({
  leaderboard,
  currentUserId,
  loading,
}) => {
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const colors = Colors[theme];
  const collaborativePrimary = colors.collaborativePrimary;

  if (loading) {
    return null; // The parent can handle a global loading state or we just return null until ready
  }

  return (
    <Animated.View 
      entering={FadeInDown.delay(300).duration(420)} 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.headerRow}>
        <Ionicons name="trophy" size={20} color="#fbbf24" />
        <Text style={[styles.sectionTitle, { color: collaborativePrimary }]}>Score List</Text>
      </View>

      {leaderboard.length === 0 ? (
        <Text style={[styles.secondaryValue, { color: colors.icon }]}>No scores available yet.</Text>
      ) : (
        <View style={styles.listContainer}>
          {leaderboard.map((entry, index) => {
            const isSelf = !!currentUserId && currentUserId === entry.userId;
            const displayName = entry.name || entry.username || 'Unnamed User';
            const displayCup = entry.cup || null;
            const isDone = entry.isDoneToday === true;

            return (
              <Animated.View
                key={entry.userId}
                entering={FadeInDown.delay(350 + index * 60).duration(280)}
                style={[
                  styles.row, 
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isSelf && { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(124, 58, 237, 0.08)', borderColor: collaborativePrimary }
                ]}
              >
                <View style={styles.rankContainer}>
                  {entry.rank === 1 ? (
                    <Ionicons name="medal" size={24} color="#fbbf24" />
                  ) : entry.rank === 2 ? (
                    <Ionicons name="medal" size={24} color="#94a3b8" />
                  ) : entry.rank === 3 ? (
                    <Ionicons name="medal" size={24} color="#b45309" />
                  ) : (
                    <Text style={[styles.rankText, { color: colors.icon }]}>#{entry.rank}</Text>
                  )}
                </View>

                <UserAvatar 
                  url={entry.avatarUrl} 
                  name={displayName} 
                  size={40} 
                  style={{ marginRight: 12 }}
                  borderColor={colors.border}
                  borderWidth={1.5}
                />

                <View style={styles.nameContainer}>
                  <View style={styles.nameRow}>
                    <View style={[styles.statusDot, { backgroundColor: isDone ? '#22c55e' : isDark ? '#334155' : '#cbd5e1' }]} />
                    <Text style={[styles.nameText, { color: colors.text }, isSelf && { color: collaborativePrimary, fontWeight: '800' }]} numberOfLines={1}>
                      {displayName} {isSelf ? '(You)' : ''}
                    </Text>
                    <CupIndicator cup={displayCup} compact showLabel={false} transparent />
                  </View>
                </View>

                <View style={styles.scoreContainer}>
                  <Text style={[styles.scoreText, { color: colors.text }]}>{entry.score}</Text>
                  <Text style={[styles.ptsText, { color: colors.icon }]}>pts</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  secondaryValue: {
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 10,
  },
  listContainer: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '800',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1.5,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarPlaceholderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  scoreContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
  },
  ptsText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2,
    textTransform: 'uppercase',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
