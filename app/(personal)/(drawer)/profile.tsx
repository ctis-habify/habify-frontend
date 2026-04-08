import { CupIndicator } from '@/components/cup-indicator';
import { FriendList } from '@/components/profile/FriendList';
import { getBackgroundGradient } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCollaborativeScore } from '@/hooks/use-collaborative-score';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFriends } from '@/hooks/use-friends';
import { getCupInfoByTier } from '@/types/collaborative-score';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback } from 'react';

export default function ProfileScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const { friends, loading: friendsLoading } = useFriends();
  const {
    cup,
    points: collaborativePoints,
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

  const handlePressFriend = useCallback(
    (friendId: string): void => {
      router.push({ pathname: '/(personal)/friend-profile', params: { userId: friendId } });
    },
    [router],
  );

  // Helper for Avatar URL
  const getAvatarUrl = (id?: string) => {
    switch (id) {
      case 'avatar1':
        return 'https://api.dicebear.com/7.x/avataaars/png?seed=Felix';
      case 'avatar2':
        return 'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka';
      case 'avatar3':
        return 'https://api.dicebear.com/7.x/avataaars/png?seed=Bob';
      case 'avatar4':
        return 'https://api.dicebear.com/7.x/avataaars/png?seed=Jack';
      case 'avatar5':
        return 'https://api.dicebear.com/7.x/avataaars/png?seed=Molly';
      default:
        return `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(displayName)}`;
    }
  };

  const avatarUrl = getAvatarUrl(user?.avatar);

  return (
    <LinearGradient colors={getBackgroundGradient(theme)} style={styles.container}>
      {/* Header with Menu Button */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View
          entering={FadeInDown.delay(100).duration(600).springify()}
          style={styles.profileCard}
        >
          <View
            style={[styles.avatarContainer, avatarUrl ? { backgroundColor: 'transparent' } : {}]}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>

          <Text style={styles.nameText}>{displayName}</Text>
          <Text style={styles.emailText}>{displayEmail}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{age}</Text>
              <Text style={styles.statLabel}>Age</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.totalXp || 0}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(180).duration(600).springify()}
          style={styles.achievementCard}
        >
          <View style={styles.achievementHeader}>
            <Text style={styles.achievementTitle}>Collaborative Cup</Text>
            {collaborativeScoreLoading ? (
              <ActivityIndicator color="rgba(255,255,255,0.7)" size="large" />
            ) : (
              <Ionicons name="trophy" size={20} color={cupInfo?.color || '#FACC15'} />
            )}
          </View>

          <View style={styles.achievementContent}>
            <View style={styles.achievementLeft}>
              {cup ? (
                <CupIndicator cup={cup} transparent large />
              ) : (
                <Text style={styles.emptyCupText}>No cup yet</Text>
              )}
              <Text style={styles.achievementSubtitle}>
                {cupInfo
                  ? 'Awarded based on first-place leaderboard finishes'
                  : 'Reach 1st place on the leaderboard to start earning cups!'}
              </Text>
            </View>

            <View style={styles.pointsBadge}>
              <Text style={styles.pointsValue}>{collaborativePoints}</Text>
              <Text style={styles.pointsLabel}>Collaborative Points</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(600).springify()}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Friends</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {friendsLoading ? (
            <ActivityIndicator color="rgba(255,255,255,0.7)" style={styles.loadingIndicator} />
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
    backgroundColor: 'transparent', // Gradient handles background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    // Removed explicit background color/border to blend with gradient
  },
  menuButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  achievementCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: 18,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  achievementLeft: {
    flex: 1,
    gap: 8,
  },
  achievementSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 18,
  },
  emptyCupText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  pointsBadge: {
    minWidth: 108,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  pointsLabel: {
    marginTop: 4,
    fontSize: 11,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.72)',
  },
  loadingIndicator: {
    paddingVertical: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  seeAllText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
});
