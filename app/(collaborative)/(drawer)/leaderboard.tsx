import { Colors } from '@/constants/theme';
import { collaborativeScoreService } from '@/services/collaborative-score.service';
import { LeaderboardEntry, resolveCollaborativeRank } from '@/types/collaborative-score';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';

const COLLABORATIVE_PRIMARY = '#E879F9';

const MEDAL_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },  // Gold
  2: { bg: '#F1F5F9', border: '#94A3B8', text: '#475569' },  // Silver
  3: { bg: '#FFF7ED', border: '#EA580C', text: '#9A3412' },  // Bronze
};

const MEDAL_ICONS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

function EmptyLeaderboard(): React.ReactElement {
  return (
    <View style={styles.centered}>
      <Ionicons name="trophy-outline" size={64} color={COLLABORATIVE_PRIMARY} style={{ opacity: 0.5 }} />
      <Text style={styles.emptyTitle}>No scores yet</Text>
      <Text style={styles.emptySubtitle}>
        Complete collaborative routines to earn points and climb the leaderboard!
      </Text>
    </View>
  );
}

function LeaderboardRow({ item, index }: { item: LeaderboardEntry; index: number }): React.ReactElement {
  const medal = MEDAL_COLORS[item.rank];
  const rankInfo = resolveCollaborativeRank(item.totalPoints);
  const isTopThree = item.rank <= 3;

  return (
    <Animated.View
      entering={ZoomIn.delay(index * 40).duration(280).springify()}
      style={[
        styles.row,
        isTopThree && medal && {
          borderColor: medal.border,
          borderWidth: 1.5,
          backgroundColor: medal.bg,
        },
      ]}
    >
      {/* Rank */}
      <View style={[
        styles.rankBadge,
        isTopThree && medal
          ? { backgroundColor: medal.border }
          : { backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.border },
      ]}>
        {isTopThree ? (
          <Text style={styles.medalEmoji}>{MEDAL_ICONS[item.rank]}</Text>
        ) : (
          <Text style={[styles.rankText, { color: Colors.light.icon }]}>{item.rank}</Text>
        )}
      </View>

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: rankInfo.color }]}>
            <Text style={styles.avatarLetter}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, isTopThree && medal && { color: medal.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.username && (
          <Text style={styles.meta} numberOfLines={1}>@{item.username}</Text>
        )}
      </View>

      {/* Points */}
      <View style={styles.pointsWrap}>
        <Text style={[styles.pointsValue, isTopThree && medal && { color: medal.text }]}>
          {item.totalPoints}
        </Text>
        <Text style={styles.pointsLabel}>pts</Text>
      </View>
    </Animated.View>
  );
}

export default function LeaderboardScreen(): React.ReactElement {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await collaborativeScoreService.getLeaderboard(50);
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard();
    }, [fetchLeaderboard]),
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={styles.header} entering={FadeInDown.duration(400).springify()}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Leaderboard</Text>
        <Ionicons name="trophy" size={22} color={COLLABORATIVE_PRIMARY} style={{ marginLeft: 8 }} />
      </Animated.View>

      {/* Subtitle pill */}
      <Animated.View style={styles.subtitleWrap} entering={FadeIn.delay(80).duration(320)}>
        <LinearGradient
          colors={[COLLABORATIVE_PRIMARY, '#D946EF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.subtitlePill}
        >
          <Ionicons name="people" size={16} color="#fff" />
          <Text style={styles.subtitleText}>
            {loading ? 'Loading…' : `${entries.length} participant${entries.length !== 1 ? 's' : ''}`}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLLABORATIVE_PRIMARY} />
        </View>
      ) : entries.length === 0 ? (
        <Animated.View entering={FadeIn.delay(80).duration(320)} style={styles.centered}>
          <EmptyLeaderboard />
        </Animated.View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <LeaderboardRow item={item} index={index} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 56,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  subtitleWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  subtitlePill: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: COLLABORATIVE_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  medalEmoji: {
    fontSize: 18,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  meta: {
    fontSize: 13,
    color: Colors.light.icon,
    marginTop: 1,
  },
  pointsWrap: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLLABORATIVE_PRIMARY,
  },
  pointsLabel: {
    fontSize: 11,
    color: Colors.light.icon,
    fontWeight: '500',
  },
});
