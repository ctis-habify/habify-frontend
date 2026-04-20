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
          style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.avatarContainer, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          </View>

          <Text style={[styles.nameText, { color: colors.text }]}>{displayName}</Text>
          {displayEmail ? (
            <Text style={[styles.emailText, { color: colors.icon }]}>{displayEmail}</Text>
          ) : null}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{age}</Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>Age</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{user.totalXp || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>Total XP</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{user.currentStreak || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.icon }]}>Streak</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(600).springify()}
          style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.icon} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Member since</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          {user.gender && user.gender !== 'na' ? (
            <View style={[styles.infoRow, { borderTopWidth: 1.5, borderTopColor: colors.border, paddingTop: 16 }]}>
              <Ionicons name="person-outline" size={20} color={colors.icon} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Gender</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
              </Text>
            </View>
          ) : null}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(280).duration(600).springify()}
          style={styles.routinesCard}
        >
          <View style={styles.routinesHeader}>
            <Ionicons name="list-outline" size={20} color="#fff" />
            <Text style={styles.routinesTitle}>Public Routines</Text>
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
                      <Text style={styles.badgeText}>{routine.frequencyType}</Text>
                    </View>
                    <View style={styles.badge}>
                      <Ionicons name="people-outline" size={12} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.badgeText}>{routine.memberCount}</Text>
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
  profileCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  infoCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  routinesCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    marginTop: 18,
    gap: 12,
  },
  routinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  routinesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    paddingVertical: 8,
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  routineInfo: {
    flex: 1,
    gap: 2,
  },
  routineName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  routineMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  routineBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 44,
    justifyContent: 'center',
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  joinedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
});
