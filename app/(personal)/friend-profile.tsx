import { Colors, getBackgroundGradient } from '@/constants/theme';
import { HomeButton } from '@/components/navigation/home-button';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useUserPublicRoutines } from '@/hooks/use-user-public-routines';
import { routineService } from '@/services/routine.service';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FriendProfileScreen(): React.ReactElement {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const isDark = theme === 'dark';

  const { user, loading, error } = useUserProfile(userId ?? '');
  const { routines: publicRoutines, loading: routinesLoading, markAsJoined } = useUserPublicRoutines(userId ?? '');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const handleJoin = useCallback(async (routineId: string) => {
    setJoiningId(routineId);
    try {
      await routineService.joinPublicRoutine(routineId);
      markAsJoined(routineId);
      DeviceEventEmitter.emit('refreshCollaborativeRoutines');
      DeviceEventEmitter.emit('SHOW_TOAST', 'Successfully joined the routine!');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to join routine');
    } finally {
      setJoiningId(null);
    }
  }, [markAsJoined]);

  const displayName = user?.name || 'User';
  const displayEmail = user?.email || '';

  const calculateAge = (birthDateString?: string): number | string => {
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

  const getAvatarUrl = (name: string): string => {
    return `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(name)}`;
  };

  const avatarUrl = getAvatarUrl(displayName);

  if (loading) {
    return (
      <LinearGradient colors={getBackgroundGradient(theme)} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.backButton, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <HomeButton color={colors.text} style={[styles.backButton, { backgroundColor: colors.surface }]} />

        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </LinearGradient>
    );
  }

  if (error || !user) {
    return (
      <LinearGradient colors={getBackgroundGradient(theme)} style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.backButton, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <HomeButton color={colors.text} style={[styles.backButton, { backgroundColor: colors.surface }]} />

        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error || 'User not found.'}</Text>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.errorButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          >
            <Text style={[styles.errorButtonText, { color: colors.text }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={getBackgroundGradient(theme)} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
        <HomeButton color={colors.text} style={[styles.backButton, { backgroundColor: colors.surface }]} />

      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={FadeInDown.delay(100).duration(600).springify()}
          style={styles.heroSection}
        >
          <View style={styles.avatarWrapper}>
            <Image 
              source={{ uri: avatarUrl }} 
              style={[styles.avatarImage, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)', borderWidth: 4 }]} 
            />
          </View>

          <View style={styles.heroTextContent}>
            <Text style={[styles.nameText, { color: '#0F172A' }]}>{displayName}</Text>
            {displayEmail ? (
              <Text style={[styles.emailText, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)' }]}>{displayEmail}</Text>
            ) : null}
          </View>

          <View style={[styles.heroStatsContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)' }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#0F172A' }]}>{age}</Text>
              <Text style={[styles.statLabel, { color: '#475569' }]}>AGE</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#0F172A' }]}>{user.totalXp || 0}</Text>
              <Text style={[styles.statLabel, { color: '#475569' }]}>TOTAL XP</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#0F172A' }]}>{user.currentStreak || 0}</Text>
              <Text style={[styles.statLabel, { color: '#475569' }]}>STREAK</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(600).springify()}
          style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.05)' }]}>
              <Ionicons name="calendar" size={18} color={colors.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoLabel, { color: '#64748B' }]}>MEMBER SINCE</Text>
              <Text style={[styles.infoValue, { color: '#1E293B' }]}>
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
          
          {user.gender && user.gender !== 'na' ? (
            <View style={styles.infoRow}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)' }]}>
                <Ionicons name="person" size={18} color={colors.success} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: '#64748B' }]}>GENDER</Text>
                <Text style={[styles.infoValue, { color: '#1E293B' }]}>
                  {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
                </Text>
              </View>
            </View>
          ) : null}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(280).duration(600).springify()}
          style={[styles.routinesCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.routinesHeader}>
            <Text style={[styles.routinesTitle, { color: colors.text }]}>Public Routines</Text>
            <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
          </View>
          {routinesLoading ? (
            <ActivityIndicator color="rgba(255,255,255,0.7)" style={{ paddingVertical: 16 }} />
          ) : publicRoutines.length === 0 ? (
            <Text style={styles.emptyText}>No public routines yet.</Text>
          ) : (
            publicRoutines.map((routine) => {
              const isJoined = routine.isAlreadyMember;
              const isJoining = joiningId === routine.id;
              return (
                <TouchableOpacity
                  key={routine.id}
                  style={styles.routineRow}
                  onPress={() => {
                    if (!isJoined) return;
                    router.push({
                      pathname: '/(collaborative)/routine/[id]/chat',
                      params: { id: routine.id, routineName: routine.routineName },
                    } as never);
                  }}
                  activeOpacity={isJoined ? 0.7 : 1}
                >
                  <View style={styles.routineInfo}>
                    <Text style={styles.routineName}>{routine.routineName}</Text>
                    {routine.category ? (
                      <Text style={styles.routineMeta}>{routine.category}</Text>
                    ) : null}
                  </View>
                  <View style={styles.routineBadges}>
                    <View style={styles.badge}>
                      <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{routine.frequencyType}</Text>
                    </View>
                    <View style={styles.badge}>
                      <Ionicons name="people" size={14} color={colors.textTertiary} />
                      <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{routine.memberCount}</Text>
                    </View>
                    {isJoined ? (
                      <View style={styles.joinedBadge}>
                        <Ionicons name="checkmark" size={12} color="#4CAF50" />
                        <Text style={styles.joinedText}>Joined</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.joinButton}
                        onPress={() => handleJoin(routine.id)}
                        disabled={isJoining}
                      >
                        {isJoining ? (
                          <ActivityIndicator size={12} color="#fff" />
                        ) : (
                          <Text style={styles.joinButtonText}>Join</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
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
  backButton: {
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
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  errorButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  heroTextContent: {
    alignItems: 'center',
    marginTop: 16,
    gap: 4,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '800',
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
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  detailsCard: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    marginBottom: 24,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoTextContainer: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  routinesCard: {
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  routinesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  routinesTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
    opacity: 0.5,
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  routineInfo: {
    flex: 1,
    gap: 4,
  },
  routineName: {
    fontSize: 15,
    fontWeight: '800',
  },
  routineMeta: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
  },
  routineBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  joinedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
});
