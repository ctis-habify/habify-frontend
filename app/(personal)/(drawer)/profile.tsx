import { CupIndicator } from '@/components/cup-indicator';
import { HomeButton } from '@/components/navigation/home-button';
import { FriendList } from '@/components/profile/FriendList';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Colors, getBackgroundGradient } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCollaborativeScore } from '@/hooks/use-collaborative-score';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFriends } from '@/hooks/use-friends';
import { getCupInfoByTier } from '@/types/collaborative-score';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';

  const { friends, loading: friendsLoading } = useFriends();
  const {
    cup,
    points: collaborativePoints,
    nextBonusPoints,
    nextBonusStreak,
    loading: collaborativeScoreLoading,
  } = useCollaborativeScore();

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || 'user@example.com';
  const initial = displayName.charAt(0).toUpperCase();
  const cupInfo = getCupInfoByTier(cup?.tier);

  // Helper to calculate age
  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return 'N/A';
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(user?.birthDate);

  const getStatus = (pts: number) => {
    if (pts >= 100) return { label: 'Pro', color: '#FFD700' };
    if (pts >= 50) return { label: 'Good', color: '#FF8C00' };
    return { label: 'Beginner', color: '#4CAF50' };
  };

  const status = getStatus(user?.totalXp || 0);

  const handlePressFriend = useCallback(
    (friendId: string): void => {
      router.push({ pathname: '/(personal)/friend-profile', params: { userId: friendId } });
    },
    [router],
  );


  return (
    <LinearGradient colors={getBackgroundGradient(theme)} style={styles.container}>
      {/* Header with Menu Button */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={[styles.menuButton, { backgroundColor: Colors[theme].surface }]}
        >
          <Ionicons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <HomeButton color={colors.text} style={[styles.menuButton, { backgroundColor: Colors[theme].surface }]} />

      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={FadeInDown.delay(100).duration(600).springify()}
          style={styles.heroSection}
        >
          <View style={styles.avatarWrapper}>
            <UserAvatar 
              url={user?.avatar} 
              name={displayName} 
              size={110} 
              borderColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)'}
              borderWidth={4}
            />
          </View>
          
          <View style={styles.heroTextContent}>
            <Text style={[styles.nameText, { color: colors.text }]}>{displayName}</Text>
            <Text style={[styles.emailText, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)' }]}>{displayEmail}</Text>
          </View>

          <View style={[styles.heroStatsContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)' }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{age}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Age</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{user?.totalXp || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total XP</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: status.color }]}>{status.label}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Status</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(180).duration(600).springify()}
          style={[styles.achievementCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.achievementHeader}>
            <Text style={[styles.achievementTitle, { color: colors.text }]}>Collaborative Cup</Text>
            {collaborativeScoreLoading ? (
              <ActivityIndicator color={colors.textSecondary} size="large" />
            ) : (
              <Ionicons name="trophy" size={20} color={cupInfo?.color || '#FACC15'} />
            )}
          </View>

          <View style={styles.achievementContent}>
            <View style={styles.achievementLeft}>
              {cup ? (
                <CupIndicator cup={cup} transparent large />
              ) : (
                <Text style={[styles.emptyCupText, { color: colors.text }]}>No cup yet</Text>
              )}
              <Text style={[styles.achievementSubtitle, { color: colors.textSecondary }]}>
                {cupInfo
                  ? 'Awarded based on first-place leaderboard finishes'
                  : 'Reach 1st place on the leaderboard to start earning cups!'}
              </Text>
            </View>

            <View style={[styles.pointsBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.pointsValue, { color: colors.text }]}>{collaborativePoints}</Text>
              <Text style={[styles.pointsLabel, { color: colors.textTertiary }]}>Points</Text>
              <Text style={[styles.pointsHint, { color: isDark ? 'rgba(255,255,255,0.82)' : colors.textTertiary }]}>
                Next reward at {nextBonusStreak} days: +{nextBonusPoints}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(240).duration(600).springify()}
          style={[styles.friendsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.friendsHeader}>
            <Text style={[styles.friendsTitle, { color: colors.text }]}>Friends</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {friendsLoading ? (
            <ActivityIndicator color={colors.textTertiary} style={styles.loadingIndicator} />
          ) : (
            <FriendList friends={friends} onPressFriend={handlePressFriend} />
          )}
        </Animated.View>
      </ScrollView>
    </LinearGradient>
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
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  avatarWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  heroTextContent: {
    alignItems: 'center',
    marginTop: 16,
    gap: 4,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
  },
  heroStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 24,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  friendsCard: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    marginBottom: 30,
  },
  friendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  friendsTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  achievementCard: {
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    marginBottom: 24,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  achievementLeft: {
    flex: 1,
    gap: 10,
  },
  achievementSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  emptyCupText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pointsBadge: {
    minWidth: 100,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  pointsLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pointsHint: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  loadingIndicator: {
    paddingVertical: 30,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
