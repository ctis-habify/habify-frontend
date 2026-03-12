import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { LeaveRoutineModal } from '@/components/modals/leave-routine-modal';
import { getBackgroundGradient } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { routineService } from '@/services/routine.service';
import { Routine } from '@/types/routine';

type GroupParticipant = {
  id?: string;
  userId?: string;
  name?: string;
  username?: string;
  role?: string;
  user?: {
    id?: string;
    name?: string;
    username?: string;
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

const COLLABORATIVE_PRIMARY = '#E879F9';
const COLLABORATIVE_GRADIENT = ['#2e1065', '#581c87'] as const;

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
  const start = startTime.split(':').slice(0, 2).join(':');
  const end = endTime.split(':').slice(0, 2).join(':');
  return `${start} - ${end}`;
};

const formatGender = (gender?: string): string => {
  if (!gender || gender.toLowerCase() === 'na') return '';
  return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
};

const getCategoryName = (detail: CollaborativeRoutineDetail | null): string => {
  if (!detail) return '';
  if (detail.categoryName) return detail.categoryName;
  if (typeof detail.category === 'string') return detail.category;
  if (detail.category?.name) return detail.category.name;
  return '';
};

const _debugLog = (...args: unknown[]): void => {
  if (__DEV__) {
    console.log('[CollaborativeRoutineDetail]', ...args);
  }
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
    user_id?: string;
  }>();
  const routineId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { user } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const gradientColors = theme === 'dark' ? getBackgroundGradient(theme) : COLLABORATIVE_GRADIENT;

  const [routineDetail, setRoutineDetail] = useState<CollaborativeRoutineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLeavingRoutine, setIsLeavingRoutine] = useState(false);
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);

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
    setError(null);
    try {
      const detail = await routineService.getGroupDetail(routineId);
      setRoutineDetail(detail);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError));
    } finally {
      setLoading(false);
    }
  }, [getErrorMessage, routineId]);

  useEffect(() => {
    loadRoutineDetail();
  }, [loadRoutineDetail]);

  const participantNames = useMemo(() => {
    return (routineDetail?.participants || []).map((participant) => {
      const user = participant.user;
      return (
        user?.name || participant.name || user?.username || participant.username || 'Unnamed User'
      );
    });
  }, [routineDetail?.participants]);

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
      'routine_name',
      'name',
      'title',
      'routine.routineName',
    ]) ||
    'Unnamed Routine';
  const displayDescription =
    descriptionFromParams ||
    detailString(routineDetail, ['description', 'desc', 'routine.description'])?.trim() ||
    'No description provided.';
  const displayCategory = categoryFromParams || getCategoryName(routineDetail) || '-';
  const displayTimeRange = formatTimeRange(
    startTimeFromParams ||
    detailString(routineDetail, [
      'startTime',
      'start_time',
      'startAt',
      'schedule.startTime',
      'routine.startTime',
    ]),
    endTimeFromParams ||
    detailString(routineDetail, [
      'endTime',
      'end_time',
      'endAt',
      'schedule.endTime',
      'routine.endTime',
    ]),
  );
  const displayFrequency = formatFrequency(
    frequencyFromParams ||
    detailString(routineDetail, ['frequencyType', 'frequency_type', 'routine.frequencyType']),
  );
  const displayLives =
    livesFromParams ??
    detailNumber(routineDetail, [
      'lives',
      'life',
      'remainingLives',
      'remaining_lives',
      'routine.lives',
    ]) ??
    0;
  const displayStreak =
    streakFromParams ??
    detailNumber(routineDetail, ['streak', 'current_streak', 'currentStreak', 'routine.streak']) ??
    0;
  const displayReward =
    rewardFromParams ||
    detailString(routineDetail, [
      'rewardCondition',
      'reward_condition',
      'routine.rewardCondition',
    ]) ||
    '';
  const displayGender = formatGender(
    genderFromParams ||
    detailString(routineDetail, [
      'genderRequirement',
      'gender_requirement',
      'routine.genderRequirement',
    ]),
  );
  const displayAge =
    ageFromParams ??
    detailNumber(routineDetail, ['ageRequirement', 'age_requirement', 'routine.ageRequirement']) ??
    null;
  const visibilityRaw = String(
    pickDetailValue(routineDetail, ['visibility', 'privacy', 'routine.visibility']) || '',
  ).toLowerCase();
  const detailIsPublic =
    pickDetailValue(routineDetail, ['isPublic', 'is_public', 'routine.isPublic']) === true ||
    visibilityRaw === 'public';
  const displayVisibility = (isPublicFromParams ?? detailIsPublic) ? 'Public' : 'Private';

  const currentUserId = user?.id ? String(user.id).trim() : '';
  const creatorCandidate = pickDetailValue(routineDetail, [
    'creatorId',
    'creator_id',
    'createdBy',
    'userId',
    'user_id',
    'ownerId',
    'creator.id',
    'user.id',
    'routine.creatorId',
    'routine.user_id',
  ]);
  const isParticipantAdmin = (routineDetail?.participants || []).some(
    (p) =>
      p.role &&
      ['admin', 'creator', 'owner'].includes(p.role.toLowerCase()) &&
      String(p.userId || p.user?.id) === currentUserId
  );

  const isCreatorByCandidate = !!currentUserId && !!creatorCandidate && currentUserId === String(creatorCandidate).trim();
  const isCreatorFromParams = !!currentUserId && !!params.user_id && currentUserId === String(params.user_id).trim();

  // Consider the user as creator if any of the conditions match
  const isCreator = isCreatorByCandidate || isParticipantAdmin || isCreatorFromParams;

  const detailRows = useMemo<DetailRow[]>(() => {
    const rows: DetailRow[] = [
      { label: 'Category', value: displayCategory },
      { label: 'Start - End Time', value: displayTimeRange },
      { label: 'Frequency', value: displayFrequency },
      { label: 'Visibility', value: displayVisibility },
      { label: 'Lives', value: String(displayLives) },
      { label: 'Streak', value: String(displayStreak) },
    ];

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

  const handleLeaveRoutineClick = useCallback((): void => {
    setIsLeaveModalVisible(true);
  }, []);

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Routine Details</Text>
        {!isCreator && (
          <TouchableOpacity
            onPress={handleLeaveRoutineClick}
            style={styles.leaveButton}
            disabled={isLeavingRoutine}
            hitSlop={10}
          >
            {isLeavingRoutine ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="exit-outline" size={16} color="#ffffff" />
                <Text style={styles.leaveButtonText}>Leave</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centeredBlock}>
            <ActivityIndicator color={COLLABORATIVE_PRIMARY} size="large" />
            <Text style={styles.loadingText}>Loading routine details...</Text>
          </View>
        ) : null}

        {!!error && !loading ? (
          <Animated.View entering={FadeInDown.delay(80).duration(320)} style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={16} color="#ffd7de" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </Animated.View>
        ) : null}

        {canRenderContent ? (
          <>
            <Animated.View entering={FadeInDown.delay(120).duration(420)} style={styles.card}>
              <Text style={styles.sectionTitle}>Routine Name</Text>
              <Text style={styles.primaryValue}>{displayRoutineName}</Text>

              <Text style={[styles.sectionTitle, styles.spacingTop]}>Description</Text>
              <Text style={styles.secondaryValue}>{displayDescription}</Text>

              <View style={styles.pillRow}>
                <View style={styles.metaPill}>
                  <Ionicons name="repeat-outline" size={13} color="#f4b3ff" />
                  <Text style={styles.metaPillText}>{displayFrequency}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Ionicons name="heart" size={13} color="#ff8ca0" />
                  <Text style={styles.metaPillText}>Lives {displayLives}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Ionicons name="flame" size={13} color="#ffbb8a" />
                  <Text style={styles.metaPillText}>Streak {displayStreak}</Text>
                </View>
              </View>

              <Text style={[styles.sectionTitle, styles.spacingTop]}>Enrolled Users</Text>
              {participantNames.length === 0 ? (
                <Text style={styles.secondaryValue}>No users enrolled yet.</Text>
              ) : (
                <View style={styles.participantsContainer}>
                  {participantNames.map((name, index) => (
                    <View key={`${name}-${index}`}>
                      <Animated.View
                        entering={FadeInDown.delay(180 + index * 60).duration(280)}
                        style={styles.participantChip}
                      >
                        <Text style={styles.participantChipText} numberOfLines={1}>
                          {name}
                        </Text>
                      </Animated.View>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(220).duration(420)} style={styles.card}>
              <Text style={styles.sectionTitle}>Routine Details</Text>
              {detailRows.map((row, index) => (
                <View key={`${row.label}-${index}`}>
                  <Animated.View
                    entering={FadeInDown.delay(260 + index * 50).duration(250)}
                    style={styles.infoRow}
                  >
                    <Text style={styles.infoLabel}>{row.label}</Text>
                    <Text style={styles.infoValue}>{row.value}</Text>
                  </Animated.View>
                </View>
              ))}
            </Animated.View>
          </>
        ) : null}

        {!canRenderContent && !loading ? (
          <View style={styles.centeredBlock}>
            <Text style={styles.errorText}>No routine data available.</Text>
            <TouchableOpacity onPress={loadRoutineDetail} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <LeaveRoutineModal
        visible={isLeaveModalVisible}
        routineName={displayRoutineName}
        onClose={() => setIsLeaveModalVisible(false)}
        onConfirm={confirmLeaveRoutine}
        onAnimationFinished={() => {
          DeviceEventEmitter.emit('refreshCollaborativeRoutines');
          router.back();
        }}
        isLoading={isLeavingRoutine}
      />
    </LinearGradient >
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
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.55)',
  },
  leaveButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  headerTitle: {
    color: '#ffffff',
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
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 14,
  },
  errorBanner: {
    marginBottom: 10,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBannerText: {
    color: '#ffd7de',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  retryButton: {
    borderRadius: 12,
    backgroundColor: COLLABORATIVE_PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.17)',
    marginBottom: 14,
    shadowColor: '#050110',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  sectionTitle: {
    color: '#F8E9FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  spacingTop: {
    marginTop: 14,
  },
  primaryValue: {
    marginTop: 8,
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  secondaryValue: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.87)',
    fontSize: 15,
    lineHeight: 22,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaPillText: {
    color: '#ffffff',
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
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(232, 121, 249, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(232, 121, 249, 0.4)',
    maxWidth: '100%',
  },
  participantChipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  infoRow: {
    marginTop: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '500',
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    flexShrink: 1,
  },
});
