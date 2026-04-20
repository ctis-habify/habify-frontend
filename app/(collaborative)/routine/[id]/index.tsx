import { HomeButton } from '@/components/navigation/home-button';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withDelay,
    withTiming,
    ZoomIn,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { DeleteRoutineModal } from '@/components/modals/delete-routine-modal';
import { LeaveRoutineModal } from '@/components/modals/leave-routine-modal';
import { PokeAnimation } from '@/components/animations/poke-animation';
import { CupIndicator } from '@/components/cup-indicator';
import { Colors, getBackgroundGradient } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { collaborativeScoreService } from '@/services/collaborative-score.service';
import { routineService } from '@/services/routine.service';
import { notificationService } from '@/services/notification.service';
import { LeaderboardEntry, UserCupAward, createLeaderboardCupAward } from '@/types/collaborative-score';
import { Routine } from '@/types/routine';
import { RoutineScoreList, RoutineLeaderboardEntry } from '@/components/routine-score-list';
import { ThrobbingHeart } from '@/components/animations/throbbing-heart';
import { AnimatedFlame } from '@/components/animations/animated-flame';

type GroupParticipant = {
  id?: string;
  userId?: string;
  name?: string;
  username?: string;
  role?: string;
  cup?: UserCupAward | null;
  user?: {
    id?: string;
    name?: string;
    username?: string;
    cup?: UserCupAward | null;
  };
};

type CollaborativeRoutineDetail = Routine & {
  participants?: GroupParticipant[];
  category?: { name?: string } | string;
};

type DetailRow = {
  label: string;
  value: string;
};

const toNumber = (value?: string | string[]): number | null => {
  if (typeof value !== 'string') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatFrequency = (frequency?: string): string => {
  if (!frequency) return '-';
  const normalized = frequency.toUpperCase();
  if (normalized === 'DAILY') return 'Daily';
  if (normalized === 'WEEKLY') return 'Weekly';
  return frequency;
};

const formatTimeRange = (startTime?: string, endTime?: string): string => {
  if (!startTime || !endTime) return '-';
  const pad = (s: string) => s.padStart(2, '0');
  const format = (t: string) => t.split(':').slice(0, 2).map(pad).join(':');
  return `${format(startTime)} - ${format(endTime)}`;
};

const formatGender = (gender?: string): string => {
  if (!gender || gender.toLowerCase() === 'na') return '';
  return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
};

const getDetailByPath = (source: unknown, path: string): unknown => {
  if (!source || typeof source !== 'object') return undefined;
  let current: unknown = source;
  for (const key of path.split('.')) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
};

const pickDetailValue = (source: unknown, paths: string[]): unknown => {
  for (const path of paths) {
    const value = getDetailByPath(source, path);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
};

const detailString = (source: unknown, paths: string[]): string | undefined => {
  const value = pickDetailValue(source, paths);
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return toStringOrUndefined(obj.name || obj.value || obj.type || obj.label || obj.text);
  }
  return undefined;
};

const toStringOrUndefined = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return toStringOrUndefined(obj.name || obj.value || obj.type || obj.label || obj.text);
  }
  return undefined;
};

const detailNumber = (source: unknown, paths: string[]): number | undefined => {
  const value = pickDetailValue(source, paths);
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

export default function CollaborativeRoutineViewScreen(): React.ReactElement {
  const params = useLocalSearchParams<{
    id: string | string[];
    routineName?: string;
    description?: string;
    categoryName?: string;
    startTime?: string;
    endTime?: string;
    frequencyType?: string;
    lives?: string;
    streak?: string;
    rewardCondition?: string;
    genderRequirement?: string;
    ageRequirement?: string;
    isPublic?: string;
    userId?: string;
  }>();
  const routineId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { user, token } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const colors = Colors[theme];
  const gradientColors = getBackgroundGradient(theme, 'collaborative');
  const collaborativePrimary = colors.collaborativePrimary;

  const [routineDetail, setRoutineDetail] = useState<CollaborativeRoutineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLeavingRoutine, setIsLeavingRoutine] = useState(false);
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeletingRoutine, setIsDeletingRoutine] = useState(false);
  const [pokingUserId, setPokingUserId] = useState<string | null>(null);
  const [pokeAnimationVisible, setPokeAnimationVisible] = useState(false);
  const [pokeTrigger, setPokeTrigger] = useState(0);
  const [pokedName, setPokedName] = useState('');
  
  const [leaderboard, setLeaderboard] = useState<RoutineLeaderboardEntry[]>([]);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const getErrorMessage = useCallback((error: unknown): string => {
    const message =
      error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
    if (message.toLowerCase().includes('network')) {
      return 'Network issue. Check your connection and backend URL.';
    }
    return 'Could not refresh routine details. Showing available data.';
  }, []);

  const loadRoutineDetail = useCallback(async (): Promise<void> => {
    if (!routineId) return;
    setLoading(true);
    setLoadingLeaderboard(true);
    setError(null);
    try {
      const [detail, leaderboardData, globalLeaderboardData] = await Promise.all([
        routineService.getGroupDetail(routineId),
        routineService.getCollaborativeRoutineLeaderboard(routineId).catch(() => []),
        collaborativeScoreService.getLeaderboard(200).catch(() => []),
      ]);
      setRoutineDetail(detail);
      setLeaderboard(leaderboardData);
      setGlobalLeaderboard(globalLeaderboardData);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError));
    } finally {
      setLoading(false);
      setLoadingLeaderboard(false);
    }
  }, [getErrorMessage, routineId]);

  useEffect(() => {
    loadRoutineDetail();

    // Also listen for refresh events
    const sub = DeviceEventEmitter.addListener('refreshCollaborativeRoutines', () => {
      loadRoutineDetail();
    });

    return () => sub.remove();
  }, [loadRoutineDetail]);

  const routineNameFromParams = typeof params.routineName === 'string' ? params.routineName : '';
  const descriptionFromParams = typeof params.description === 'string' ? params.description : '';
  const frequencyFromParams = typeof params.frequencyType === 'string' ? params.frequencyType : '';
  const categoryFromParams = typeof params.categoryName === 'string' ? params.categoryName : '';
  const startTimeFromParams = typeof params.startTime === 'string' ? params.startTime : '';
  const endTimeFromParams = typeof params.endTime === 'string' ? params.endTime : '';
  const rewardFromParams = typeof params.rewardCondition === 'string' ? params.rewardCondition : '';
  const genderFromParams =
    typeof params.genderRequirement === 'string' ? params.genderRequirement : '';
  const ageFromParams = toNumber(params.ageRequirement);
  const livesFromParams = toNumber(params.lives);
  const streakFromParams = toNumber(params.streak);
  const isPublicFromParams = typeof params.isPublic === 'string' ? params.isPublic === '1' : null;

  const displayRoutineName =
    routineNameFromParams ||
    detailString(routineDetail, [
      'routineName',
      'title',
    ]) ||
    'Unnamed Routine';
  const displayDescription =
    descriptionFromParams ||
    detailString(routineDetail, ['description'])?.trim() ||
    'No description provided.';
  const displayCategory = categoryFromParams ||
    (routineDetail?.categoryName) ||
    (typeof routineDetail?.category === 'string' ? routineDetail.category : (routineDetail?.category as { name?: string })?.name) ||
    '-';
  const displayTimeRange = formatTimeRange(
    startTimeFromParams ||
    detailString(routineDetail, ['startTime']),
    endTimeFromParams ||
    detailString(routineDetail, ['endTime']),
  );
  const displayFrequency = formatFrequency(
    frequencyFromParams ||
    detailString(routineDetail, ['frequencyType', 'frequency']),
  );
  const displayLives =
    livesFromParams ??
    detailNumber(routineDetail, ['lives']) ??
    0;
  const displayMaxLives =
    detailNumber(routineDetail, ['maxLives']) ??
    detailNumber(routineDetail, ['rules.lives']) ??
    displayLives;
  const displayStreak =
    streakFromParams ??
    detailNumber(routineDetail, ['streak']) ??
    0;
  const displayReward =
    rewardFromParams ||
    detailString(routineDetail, ['rewardCondition']) ||
    '';
  const displayGender = formatGender(
    genderFromParams ||
    detailString(routineDetail, ['genderRequirement']),
  );
  const displayAge =
    ageFromParams ??
    detailNumber(routineDetail, ['ageRequirement']) ??
    null;
  const visibilityRaw = String(detailString(routineDetail, ['visibility']) || '').toLowerCase();
  const detailIsPublic =
    detailNumber(routineDetail, ['isPublic']) === 1 ||
    detailString(routineDetail, ['isPublic']) === 'true' ||
    visibilityRaw === 'public';
  const displayVisibility = (isPublicFromParams ?? detailIsPublic) ? 'Public' : 'Private';

  const currentUserId = user?.id ? String(user.id).trim() : '';
  const globalCupByUserId = useMemo(() => {
    const cupMap = new Map<string, UserCupAward | null>();

    globalLeaderboard.forEach((entry) => {
      const userId = String(entry.userId || '').trim();
      if (!userId) return;

      cupMap.set(
        userId,
        entry.cup || createLeaderboardCupAward(entry.rank, entry.totalPoints) || null,
      );
    });

    return cupMap;
  }, [globalLeaderboard]);

  const leaderboardWithGlobalCups = useMemo(
    () =>
      leaderboard.map((entry) => ({
        ...entry,
        cup: entry.cup || globalCupByUserId.get(String(entry.userId || '').trim()) || null,
      })),
    [globalCupByUserId, leaderboard],
  );

  const uniqueParticipants = useMemo(() => {
    const participants = routineDetail?.participants || [];
    const seen = new Set<string>();
    return participants.filter((p) => {
      const uId = String(p.userId || p.user?.id || p.id || '').trim();
      if (!uId || seen.has(uId)) return false;
      seen.add(uId);
      return true;
    });
  }, [routineDetail?.participants]);

  const creatorCandidate = pickDetailValue(routineDetail, ['userId', 'creatorId']);
  const isParticipantAdmin = (routineDetail?.participants || []).some(
    (p) =>
      p.role &&
      ['admin', 'creator', 'owner'].includes(p.role.toLowerCase()) &&
      String(p.userId || p.user?.id) === currentUserId
  );

  const isCreatorByCandidate = !!currentUserId && !!creatorCandidate && currentUserId === String(creatorCandidate).trim();
  const isCreatorFromParams = !!currentUserId && !!params.userId && currentUserId === String(params.userId).trim();

  // Consider the user as creator if any of the conditions match
  const isCreator = isCreatorByCandidate || isParticipantAdmin || isCreatorFromParams;

  const detailRows = useMemo<DetailRow[]>(() => {
    const rows: DetailRow[] = [{ label: 'Category', value: displayCategory }];

    if (displayFrequency.toLowerCase() !== 'weekly') {
      rows.push({ label: 'Start - End Time', value: displayTimeRange });
    }

    rows.push(
      { label: 'Frequency', value: displayFrequency },
      { label: 'Visibility', value: displayVisibility },
      { label: 'Lives', value: `${displayLives}/${displayMaxLives}` },
      { label: 'Streak', value: String(displayStreak) },
    );

    if (displayReward) rows.push({ label: 'Reward', value: displayReward });
    if (displayGender) rows.push({ label: 'Gender Restriction', value: displayGender });
    if (displayAge !== null && displayAge > 0) {
      rows.push({ label: 'Age Restriction', value: `${displayAge}+` });
    }

    return rows;
  }, [
    displayAge,
    displayCategory,
    displayFrequency,
    displayGender,
    displayLives,
    displayReward,
    displayStreak,
    displayTimeRange,
    displayVisibility,
  ]);

  const canRenderContent =
    !loading &&
    (routineDetail !== null ||
      Boolean(routineNameFromParams || descriptionFromParams || categoryFromParams));

  const participantNames = useMemo(() => {
    return uniqueParticipants.map((p) => {
      const u = p.user;
      return (
        u?.name || p.name || u?.username || p.username || 'Unnamed User'
      );
    });
  }, [uniqueParticipants]);

  const handlePoke = useCallback(async (participant: GroupParticipant) => {
    const targetUserId = participant.userId || participant.user?.id || participant.id;
    if (!targetUserId || !routineId) return;

    const targetName = participant.user?.name || participant.name || participant.user?.username || participant.username || 'User';

    // Optimistic Trigger: Show animation and haptics instantly
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPokedName(targetName);
    setPokeTrigger(prev => prev + 1);
    setPokeAnimationVisible(true);

    try {
      // Background Request: Don't wait for completion to enable subsequent pokes
      await notificationService.sendPoke(targetUserId, routineId);
    } catch (err: unknown) {
      // Revert if critical? No, poking is social. Just log?
      console.warn('Poke request failed:', err);
      // Optional: Show error only if they aren't spamming
    }
  }, [routineId]);

  const handleLeaveRoutineClick = useCallback((): void => {
    setIsLeaveModalVisible(true);
  }, []);

  const handleDeleteRoutineClick = useCallback((): void => {
    setIsDeleteModalVisible(true);
  }, []);

  const confirmDeleteRoutine = useCallback(async (): Promise<void> => {
    if (!routineId || !token) return;
    setIsDeletingRoutine(true);
    try {
      await routineService.deleteRoutine(routineId, token);
    } catch (deleteError: unknown) {
      const message =
        deleteError && typeof deleteError === 'object' && 'message' in deleteError
          ? String((deleteError as { message: unknown }).message)
          : 'Could not delete the routine. Please try again.';
      Alert.alert('Error', message);
      throw deleteError;
    } finally {
      setIsDeletingRoutine(false);
    }
  }, [routineId, token]);

  const confirmLeaveRoutine = useCallback(async (): Promise<void> => {
    setIsLeavingRoutine(true);
    try {
      if (routineId) {
        await routineService.leaveRoutine(routineId);
      }
    } catch (leaveError: unknown) {
      const message =
        leaveError && typeof leaveError === 'object' && 'message' in leaveError
          ? String((leaveError as { message: unknown }).message)
          : 'Could not leave the routine. Please try again.';
      Alert.alert('Error', message);
      throw leaveError; // Re-throw to handle in modal
    } finally {
      setIsLeavingRoutine(false);
    }
  }, [routineId]);


  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <Animated.View entering={FadeInDown.duration(350)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: Colors[theme].surface, borderColor: colors.border }]} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Routine Details</Text>
        {!isCreator ? (
          <TouchableOpacity
            onPress={handleLeaveRoutineClick}
            style={[styles.leaveButton, { backgroundColor: colors.error }]}
            disabled={isLeavingRoutine}
            hitSlop={10}
          >
            {isLeavingRoutine ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="exit-outline" size={16} color={colors.white} />
                <Text style={[styles.leaveButtonText, { color: colors.white }]}>Leave</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleDeleteRoutineClick}
            style={[styles.leaveButton, { backgroundColor: colors.error }]}
            disabled={isDeletingRoutine}
            hitSlop={10}
          >
            {isDeletingRoutine ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={16} color={colors.white} />
                <Text style={[styles.leaveButtonText, { color: colors.white }]}>Delete</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        <HomeButton color={colors.text} style={[styles.backButton, { backgroundColor: colors.surface }]} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centeredBlock}>
            <ActivityIndicator color={collaborativePrimary} size="large" />
            <Text style={[styles.loadingText, { color: colors.text, opacity: 0.6 }]}>Loading routine details...</Text>
          </View>
        ) : null}

        {!!error && !loading ? (
          <Animated.View entering={FadeInDown.delay(80).duration(320)} style={[styles.errorBanner, { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }]}>
            <Ionicons name="warning-outline" size={16} color={colors.error} />
            <Text style={[styles.errorBannerText, { color: colors.error }]}>{error}</Text>
          </Animated.View>
        ) : null}

        {canRenderContent ? (
          <>
            <Animated.View entering={FadeInDown.delay(120).duration(420)} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: collaborativePrimary }]}>Routine Name</Text>
              <Text style={[styles.primaryValue, { color: colors.text }]}>{displayRoutineName}</Text>

              <Text style={[styles.sectionTitle, styles.spacingTop, { color: collaborativePrimary }]}>Description</Text>
              <Text style={[styles.secondaryValue, { color: colors.text }]}>{displayDescription}</Text>

              <View style={styles.pillRow}>
                <View style={[styles.metaPill, { backgroundColor: Colors[theme].surface, borderColor: colors.border }]}>
                  <Ionicons name="repeat-outline" size={13} color={collaborativePrimary} />
                  <Text style={[styles.metaPillText, { color: colors.text }]}>{displayFrequency}</Text>
                </View>
                <View style={[styles.metaPill, { backgroundColor: Colors[theme].surface, borderColor: colors.border }]}>
                  <ThrobbingHeart lives={displayLives} size={13} />
<<<<<<< Updated upstream:app/(collaborative)/routine/[id]/index.tsx
                  <Text style={[styles.metaPillText, { color: colors.text }]}>Lives {displayLives}</Text>
=======
                  <Text style={styles.metaPillText}>Lives {displayLives}/{displayMaxLives}</Text>
>>>>>>> Stashed changes:app/(collaborative)/routine/[id].tsx
                </View>
                <View style={[styles.metaPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <AnimatedFlame streak={displayStreak} size={13} />
                  <Text style={[styles.metaPillText, { color: colors.text }]}>Streak {displayStreak}</Text>
                </View>
              </View>

              <Text style={[styles.sectionTitle, styles.spacingTop, { color: collaborativePrimary }]}>Enrolled Users</Text>
              <Text style={[styles.pokeHint, { color: colors.text, opacity: 0.6 }]}>Tap a member to poke them 👈</Text>
              {participantNames.length === 0 ? (
                <Text style={[styles.secondaryValue, { color: colors.text }]}>No users enrolled yet.</Text>
              ) : (
                <View style={styles.participantsContainer}>
                  {uniqueParticipants.map((participant, index) => {
                    const u = participant.user;
                    const name = u?.name || participant.name || u?.username || participant.username || 'Unnamed User';
                    const participantUserId = participant.userId || u?.id || participant.id;
                    const participantCup =
                      participant.cup ||
                      u?.cup ||
                      globalCupByUserId.get(String(participantUserId || '').trim()) ||
                      null;
                    const isSelf = !!currentUserId && currentUserId === String(participantUserId || '').trim();
                    const isPoking = pokingUserId === participantUserId;

                    return (
                      <Animated.View
                        key={`${name}-${participantUserId}-${index}`}
                        entering={FadeInDown.delay(180 + index * 60).duration(280)}
                      >
                        <ParticipantChip
                          participant={participant}
                          isSelf={isSelf}
                          isPoking={false} // No longer blocking
                          onPoke={handlePoke}
                          disabled={false}
                          name={name}
                          participantCup={participantCup}
                        />
                      </Animated.View>
                    );
                  })}
                </View>
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(220).duration(420)} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: collaborativePrimary }]}>Routine Details</Text>
              {detailRows.map((row, index) => (
                <Animated.View
                  key={`${row.label}-${index}`}
                  entering={FadeInDown.delay(260 + index * 50).duration(250)}
                  style={[styles.infoRow, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.infoLabel, { color: colors.text, opacity: 0.6 }]}>{row.label}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{row.value}</Text>
                </Animated.View>
              ))}
            </Animated.View>

            <RoutineScoreList 
              leaderboard={leaderboardWithGlobalCups} 
              currentUserId={currentUserId} 
              loading={loadingLeaderboard} 
            />
          </>
        ) : null}

        {!canRenderContent && !loading ? (
          <View style={styles.centeredBlock}>
            <Text style={[styles.errorText, { color: colors.text }]}>No routine data available.</Text>
            <TouchableOpacity onPress={loadRoutineDetail} style={[styles.retryButton, { backgroundColor: collaborativePrimary }]}>
              <Text style={[styles.retryButtonText, { color: colors.white }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
      <ChatFab
        routineId={routineId}
        displayRoutineName={displayRoutineName}
        router={router}
        accentColor={collaborativePrimary}
      />


      <LeaveRoutineModal
        visible={isLeaveModalVisible}
        routineName={displayRoutineName}
        onClose={() => setIsLeaveModalVisible(false)}
        onConfirm={confirmLeaveRoutine}
        onAnimationFinished={() => {
          DeviceEventEmitter.emit('refreshCollaborativeRoutines');
          router.replace('/(collaborative)/(drawer)/routines');
        }}
        isLoading={isLeavingRoutine}
      />

      <DeleteRoutineModal
        visible={isDeleteModalVisible}
        routineName={displayRoutineName}
        onClose={() => setIsDeleteModalVisible(false)}
        onConfirm={confirmDeleteRoutine}
        onAnimationFinished={() => {
          DeviceEventEmitter.emit('refreshCollaborativeRoutines');
          router.replace('/(collaborative)/(drawer)/routines');
        }}
        isLoading={isDeletingRoutine}
      />

      <PokeAnimation
        play={pokeAnimationVisible}
        triggerKey={pokeTrigger}
        targetName={pokedName}
        onComplete={() => setPokeAnimationVisible(false)}
      />

    </LinearGradient >
  );
}

function ParticipantChip({
  participant,
  isSelf,
  isPoking,
  onPoke,
  disabled,
  name,
  participantCup
}: {
  participant: GroupParticipant;
  isSelf: boolean;
  isPoking: boolean;
  onPoke: (p: GroupParticipant) => void;
  disabled: boolean;
  name: string;
  participantCup: UserCupAward | null;
}) {
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const rippleX = useSharedValue(0);
  const rippleY = useSharedValue(0);

  const handlePress = (event: any) => {
    if (isSelf || disabled) return;

    // Get touch coordinates
    const { locationX, locationY } = event.nativeEvent;
    rippleX.value = locationX;
    rippleY.value = locationY;

    // Trigger ripple
    rippleScale.value = 0;
    rippleOpacity.value = 0.4;
    rippleScale.value = withTiming(2.5, { duration: 400 });
    rippleOpacity.value = withTiming(0, { duration: 400 });

    onPoke(participant);
  };

  const rippleStyle = useAnimatedStyle(() => ({
    top: rippleY.value - 10,
    left: rippleX.value - 10,
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const colors = Colors[theme];
  const collaborativePrimary = colors.collaborativePrimary;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.participantChip,
        { backgroundColor: colors.surface, borderColor: colors.border },
        isSelf && [styles.participantChipSelf, { borderColor: collaborativePrimary, backgroundColor: `${collaborativePrimary}22` }],
        isPoking && [styles.participantChipPoking, { borderColor: collaborativePrimary }],
        pressed && !isSelf && { opacity: 0.85 }
      ]}
      onPress={handlePress}
      disabled={isSelf || disabled}
    >
      <Animated.View style={[styles.ripple, rippleStyle]} />
      {isPoking ? (
        <ActivityIndicator size="small" color={isDark ? "#E879F9" : collaborativePrimary} />
      ) : (
        <>
          {!isSelf && <Text style={styles.pokeIcon}>👈</Text>}
            <View style={styles.participantNameRow}>
              <Text
                style={[
                  styles.participantChipText,
                  { color: colors.text },
                  isSelf && { color: collaborativePrimary, fontWeight: '700' },
                ]}
                numberOfLines={1}
              >
                {name}
                {isSelf ? ' (You)' : ''}
              </Text>
              <CupIndicator cup={participantCup} compact transparent />
            </View>
        </>
      )}
    </Pressable>
  );
}

function ChatFab({
  routineId,
  displayRoutineName,
  router,
  accentColor,
}: {
  routineId: string;
  displayRoutineName: string;
  router: any;
  accentColor: string;
}) {
  const floatY = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const jiggleRotation = useSharedValue(0);
  const pressScale = useSharedValue(1);

  React.useEffect(() => {
    // Continuous floating animation
    floatY.value = withRepeat(
      withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    // Continuous subtle pulse
    pulseScale.value = withRepeat(
      withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [floatY, pulseScale]);

  // Optional: Link this to routine-specific unread message state when available
  const hasUnread = false; 

  React.useEffect(() => {
    if (hasUnread) {
      jiggleRotation.value = withRepeat(
        withSequence(
          withDelay(2000, withTiming(10, { duration: 100 })),
          withTiming(-10, { duration: 100 }),
          withTiming(8, { duration: 100 }),
          withTiming(-8, { duration: 100 }),
          withTiming(0, { duration: 100 })
        ),
        -1,
        false
      );
    }
  }, [hasUnread, jiggleRotation]);

  const longPressGesture = Gesture.LongPress()
    .onStart(() => {
      glowScale.value = 0;
      glowOpacity.value = 0.6;
      glowScale.value = withTiming(4, { duration: 600, easing: Easing.out(Easing.quad) });
      glowOpacity.value = withTiming(0, { duration: 600 });
    });

  const animatedWrapperStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { scale: pulseScale.value }
    ],
  }));

  const animatedFabStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateZ: `${jiggleRotation.value}deg` },
      { scale: pressScale.value }
    ],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View
      entering={ZoomIn.duration(650).springify().damping(35).delay(500)}
      style={styles.chatFabWrap}
    >
      <Animated.View style={[{ flex: 1 }, animatedWrapperStyle]}>
        <GestureDetector gesture={longPressGesture}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.chatFab, { backgroundColor: accentColor }]}
            onPressIn={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              pressScale.value = withSpring(0.94, { damping: 20, stiffness: 200 });
            }}
            onPressOut={() => {
              pressScale.value = withSpring(1, { damping: 20, stiffness: 200 });
            }}
            onPress={() =>
              router.replace({
                pathname: '/(collaborative)/routine/[id]/chat',
                params: { id: routineId, routineName: displayRoutineName },
              } as never)
            }
          >
            <Animated.View style={[styles.glowRing, animatedGlowStyle]} />
            <Animated.View style={[styles.chatFabInner, animatedFabStyle]}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#ffffff" />
              <Text style={[styles.chatFabText, { color: '#ffffff' }]}>Chat</Text>
            </Animated.View>
            {hasUnread && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        </GestureDetector>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leaveButton: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ef4444',
  },
  leaveButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  centeredBlock: {
    marginTop: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 14,
  },
  errorBanner: {
    marginBottom: 10,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  retryButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    marginBottom: 16,
    shadowColor: '#1E1B4B', // Indigo-950 for tinted shadow
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  spacingTop: {
    marginTop: 14,
  },
  primaryValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '800',
  },
  secondaryValue: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.9,
  },
  pillRow: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  participantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  participantChip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
    shadowColor: '#1E1B4B',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  participantChipSelf: {
  },
  participantChipPoking: {
  },
  participantChipText: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  participantChipTextSelf: {
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    maxWidth: '100%',
  },
  pokeIcon: {
    fontSize: 12,
  },
  pokeHint: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 2,
    fontStyle: 'italic',
  },
  infoRow: {
    marginTop: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    flexShrink: 1,
  },
  chatFabWrap: {
    position: 'absolute',
    right: 18,
    bottom: 24,
  },
  chatFab: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  chatFabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  glowRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(232, 121, 249, 0.4)',
  },
  chatFabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ripple: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(232, 121, 249, 0.4)',
  },
});
