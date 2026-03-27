import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export type RoutineLeaderboardEntry = {
  rank: number;
  userId: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  score: number;
};

type RoutineScoreListProps = {
  leaderboard: RoutineLeaderboardEntry[];
  currentUserId: string;
  loading: boolean;
};

const COLLABORATIVE_PRIMARY = '#E879F9';

export const RoutineScoreList: React.FC<RoutineScoreListProps> = ({
  leaderboard,
  currentUserId,
  loading,
}) => {
  if (loading) {
    return null; // The parent can handle a global loading state or we just return null until ready
  }

  return (
    <Animated.View entering={FadeInDown.delay(300).duration(420)} style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="trophy" size={18} color="#FFD700" />
        <Text style={styles.sectionTitle}>Score List</Text>
      </View>

      {leaderboard.length === 0 ? (
        <Text style={styles.secondaryValue}>No scores available yet.</Text>
      ) : (
        <View style={styles.listContainer}>
          {leaderboard.map((entry, index) => {
            const isSelf = !!currentUserId && currentUserId === entry.userId;
            const displayName = entry.name || entry.username || 'Unnamed User';

            return (
              <Animated.View
                key={entry.userId}
                entering={FadeInDown.delay(350 + index * 60).duration(280)}
                style={[styles.row, isSelf && styles.rowSelf]}
              >
                <View style={styles.rankContainer}>
                  {entry.rank === 1 ? (
                    <Ionicons name="medal" size={20} color="#FFD700" />
                  ) : entry.rank === 2 ? (
                    <Ionicons name="medal" size={20} color="#C0C0C0" />
                  ) : entry.rank === 3 ? (
                    <Ionicons name="medal" size={20} color="#CD7F32" />
                  ) : (
                    <Text style={styles.rankText}>#{entry.rank}</Text>
                  )}
                </View>

                {entry.avatarUrl ? (
                  <Image source={{ uri: entry.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.nameContainer}>
                  <Text style={[styles.nameText, isSelf && styles.nameTextSelf]} numberOfLines={1}>
                    {displayName} {isSelf ? '(You)' : ''}
                  </Text>
                </View>

                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreText}>{entry.score}</Text>
                  <Text style={styles.ptsText}>pts</Text>
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.17)',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#F8E9FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  secondaryValue: {
    color: 'rgba(255,255,255,0.87)',
    fontSize: 15,
  },
  listContainer: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rowSelf: {
    backgroundColor: 'rgba(232, 121, 249, 0.15)',
    borderColor: 'rgba(232, 121, 249, 0.3)',
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rankText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '800',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarPlaceholderText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  nameTextSelf: {
    color: COLLABORATIVE_PRIMARY,
  },
  scoreContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  ptsText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2,
  },
});
