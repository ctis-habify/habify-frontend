import { HomeButton } from '@/components/navigation/home-button';
import { CupIndicator } from '@/components/cup-indicator';
import { Colors } from '@/constants/theme';
import { collaborativeScoreService } from '@/services/collaborative-score.service';
import { LeaderboardEntry, createLeaderboardCupAward, resolveCollaborativeRank } from '@/types/collaborative-score';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerActions, useNavigation } from '@react-navigation/native';
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

const getMedalColors = (rank: number, isDark: boolean, colors: any) => {
  if (rank === 1) return { bg: isDark ? 'rgba(251, 191, 36, 0.2)' : '#FEF3C7', border: '#F59E0B', text: isDark ? '#FCD34D' : '#92400E' };
  if (rank === 2) return { bg: isDark ? 'rgba(148, 163, 184, 0.2)' : '#F1F5F9', border: '#94A3B8', text: isDark ? '#CBD5E1' : '#475569' };
  if (rank === 3) return { bg: isDark ? 'rgba(234, 88, 12, 0.2)' : '#FFF7ED', border: '#EA580C', text: isDark ? '#FB923C' : '#9A3412' };
  return null;
};

const MEDAL_ICONS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

function EmptyLeaderboard({ color, textColor }: { color: string; textColor: string }): React.ReactElement {
  return (
    <View style={styles.centered}>
      <Ionicons name="trophy-outline" size={64} color={color} style={{ opacity: 0.5 }} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>No scores yet</Text>
      <Text style={[styles.emptySubtitle, { color: textColor, opacity: 0.6 }]}>
        Complete collaborative routines to earn points and climb the leaderboard!
      </Text>
    </View>
  );
}

function LeaderboardRow({ item, index }: { item: LeaderboardEntry; index: number }): React.ReactElement {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';
  
    const medal = getMedalColors(item.rank, isDark, colors);
    const rankInfo = resolveCollaborativeRank(item.totalPoints);
    const isTopThree = item.rank <= 3;
    const displayCup = item.cup || createLeaderboardCupAward(item.rank, item.totalPoints);

    return (
      <Animated.View
        entering={ZoomIn.delay(index * 40).duration(280).springify()}
        style={[
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border },
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
          : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
      ]}>
        {isTopThree ? (
          <Text style={styles.medalEmoji}>{MEDAL_ICONS[item.rank]}</Text>
        ) : (
          <Text style={[styles.rankText, { color: colors.icon }]}>{item.rank}</Text>
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
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }, isTopThree && medal && { color: medal.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <CupIndicator cup={displayCup} compact />
        </View>
        {item.username && (
          <Text style={[styles.meta, { color: colors.icon }]} numberOfLines={1}>@{item.username}</Text>
        )}
      </View>

      {/* Points */}
      <View style={styles.pointsWrap}>
        <Text style={[styles.pointsValue, { color: colors.collaborativePrimary }, isTopThree && medal && { color: medal.text }]}>
          {item.totalPoints}
        </Text>
        <Text style={[styles.pointsLabel, { color: colors.icon }]}>pts</Text>
      </View>
    </Animated.View>
  );
}

export default function LeaderboardScreen(): React.ReactElement {
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const collaborativePrimary = colors.collaborativePrimary;
  const isDark = theme === 'dark';

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]} entering={FadeInDown.duration(400).springify()}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="menu" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Leaderboard</Text>
          <Ionicons name="trophy" size={22} color={collaborativePrimary} style={{ marginLeft: 8 }} />
        </View>
        <HomeButton color={colors.text} />
      </Animated.View>
      </Animated.View>

      {/* Subtitle pill */}
      <Animated.View style={styles.subtitleWrap} entering={FadeIn.delay(80).duration(320)}>
        <LinearGradient
          colors={[collaborativePrimary, colors.tint]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.subtitlePill, { shadowColor: collaborativePrimary }]}
        >
          <Ionicons name="people" size={16} color={colors.white} />
          <Text style={[styles.subtitleText, { color: colors.white }]}>
            {loading ? 'Loading…' : `${entries.length} participant${entries.length !== 1 ? 's' : ''}`}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={collaborativePrimary} />
        </View>
      ) : entries.length === 0 ? (
        <Animated.View entering={FadeIn.delay(80).duration(320)} style={styles.centered}>
          <EmptyLeaderboard color={collaborativePrimary} textColor={colors.text} />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 56,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: '700',
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
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 14,
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
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
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
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  meta: {
    fontSize: 13,
    marginTop: 1,
  },
  pointsWrap: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  pointsLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
