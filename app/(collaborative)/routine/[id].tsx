import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { getBackgroundGradient } from '@/app/theme';
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

type ChatMessage = {
  id: string;
  text: string;
  sender: 'me' | 'system';
  senderName: string;
  createdAt?: string;
};

const COLLABORATIVE_PRIMARY = '#E879F9';
const COLLABORATIVE_GRADIENT = ['#2e1065', '#581c87'] as const;
const CHAT_CACHE_KEY_PREFIX = 'routine_chat_cache_';

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

const normalizeChatMessages = (
  value: unknown,
  currentUserId?: string,
  currentRoutineId?: string,
): ChatMessage[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const msg = (item || {}) as {
        id?: string | number;
        routineId?: string;
        message?: string;
        text?: string;
        content?: string;
        createdAt?: string;
        created_at?: string;
        sentAt?: string;
        sender?: { id?: string; name?: string; username?: string };
        user?: { id?: string; name?: string; username?: string; email?: string };
        userId?: string;
        senderId?: string;
        senderName?: string;
        username?: string;
        name?: string;
      };

      const text = (msg.message || msg.text || msg.content || '').trim();
      if (!text) return null;
      if (currentRoutineId && msg.routineId && msg.routineId !== currentRoutineId) return null;

      const senderObj = msg.sender || msg.user;
      const senderId = msg.userId || senderObj?.id || msg.senderId;
      const senderName =
        senderObj?.name ||
        senderObj?.username ||
        (senderObj as { email?: string } | undefined)?.email ||
        (msg.user as { email?: string } | undefined)?.email ||
        msg.senderName ||
        msg.name ||
        msg.username ||
        (senderId ? `User ${String(senderId).slice(0, 6)}` : 'Unknown User');

      return {
        id: String(msg.id ?? `${senderId || 'msg'}-${index}-${text.slice(0, 8)}`),
        text,
        sender: currentUserId && senderId === currentUserId ? 'me' : 'system',
        senderName,
        createdAt: msg.sentAt || msg.createdAt || msg.created_at,
      } as ChatMessage;
    })
    .filter((item): item is ChatMessage => item !== null);
};

const getMessageTimestamp = (value?: string): number | null => {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

const sortChatMessagesOldToNew = (messages: ChatMessage[]): ChatMessage[] => {
  return [...messages].sort((a, b) => {
    const at = getMessageTimestamp(a.createdAt);
    const bt = getMessageTimestamp(b.createdAt);
    if (at !== null && bt !== null) return at - bt;
    if (at !== null) return -1;
    if (bt !== null) return 1;
    return 0;
  });
};

const mergeChatMessages = (current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] => {
  const mergedMap = new Map<string, ChatMessage>();

  [...current, ...incoming].forEach((message) => {
    const stableId =
      message.id || `${message.senderName}-${message.text}-${message.createdAt || ''}`;
    mergedMap.set(stableId, message);
  });

  return sortChatMessagesOldToNew(Array.from(mergedMap.values()));
};

const getChatCacheKey = (routineId?: string): string =>
  `${CHAT_CACHE_KEY_PREFIX}${routineId || 'unknown'}`;

const readCachedChatMessages = async (routineId?: string): Promise<ChatMessage[]> => {
  if (!routineId) return [];
  try {
    const raw = await SecureStore.getItemAsync(getChatCacheKey(routineId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCachedChatMessages = async (
  routineId: string | undefined,
  messages: ChatMessage[],
): Promise<void> => {
  if (!routineId) return;
  try {
    await SecureStore.setItemAsync(getChatCacheKey(routineId), JSON.stringify(messages));
  } catch {
    // ignore cache write errors
  }
};

const formatMessageTime = (value?: string): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const debugLog = (...args: unknown[]): void => {
  if (__DEV__) {
    console.log('[CollaborativeChat]', ...args);
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
  }>();
  const routineId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { user } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const gradientColors = theme === 'dark' ? getBackgroundGradient(theme) : COLLABORATIVE_GRADIENT;

  const [routineDetail, setRoutineDetail] = useState<CollaborativeRoutineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [predefinedMessages, setPredefinedMessages] = useState<string[]>([]);
  const [predefinedLoading, setPredefinedLoading] = useState(false);
  const [predefinedError, setPredefinedError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  const [isLeavingRoutine, setIsLeavingRoutine] = useState(false);
  const chatListRef = useRef<FlatList<ChatMessage> | null>(null);
  const isSendingMessageRef = useRef(false);

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

  const loadPredefinedMessages = useCallback(async (): Promise<void> => {
    if (!routineId) return;
    setPredefinedLoading(true);
    try {
      const messagesFromApi = await routineService.getRoutinePredefinedMessages();
      debugLog('predefined_messages_response', {
        routineId,
        count: messagesFromApi.length,
        messages: messagesFromApi,
      });
      setPredefinedMessages(messagesFromApi);
      setPredefinedError(messagesFromApi.length === 0 ? 'No predefined messages found.' : null);
    } catch (messageError) {
      debugLog('predefined_messages_error', { routineId, error: messageError });
      const msg =
        messageError && typeof messageError === 'object' && 'message' in messageError
          ? String(messageError.message)
          : '';
      setPredefinedMessages([]);
      setPredefinedError(
        msg.toLowerCase().includes('network')
          ? 'Could not load predefined messages due to network issue.'
          : 'Could not load predefined messages.',
      );
    } finally {
      setPredefinedLoading(false);
    }
  }, [routineId]);

  useEffect(() => {
    loadPredefinedMessages();
  }, [loadPredefinedMessages]);

  useEffect(() => {
    let mounted = true;
    const hydrateChatCache = async () => {
      const cached = await readCachedChatMessages(routineId);
      if (!mounted || cached.length === 0) return;
      setChatMessages(cached);
    };
    hydrateChatCache();
    return () => {
      mounted = false;
    };
  }, [routineId]);

  const loadChatMessages = useCallback(async (): Promise<void> => {
    if (!routineId) return;
    setChatLoading(true);
    setChatError(null);
    const cached = await readCachedChatMessages(routineId);
    try {
      const messages = await routineService.getRoutineChatMessages(routineId);
      debugLog('chat_messages_raw_response', {
        routineId,
        rawCount: Array.isArray(messages) ? messages.length : -1,
        raw: messages,
      });
      const normalized = sortChatMessagesOldToNew(
        normalizeChatMessages(messages, user?.id, routineId),
      );
      debugLog('chat_messages_normalized', {
        routineId,
        normalizedCount: normalized.length,
        normalized,
      });
      if (normalized.length === 0 && cached.length > 0) {
        setChatMessages(cached);
      } else {
        setChatMessages((prev) => {
          const merged = mergeChatMessages(prev, normalized);
          writeCachedChatMessages(routineId, merged);
          return merged;
        });
      }
    } catch (fetchError) {
      debugLog('chat_messages_error', { routineId, error: fetchError });
      const message =
        fetchError && typeof fetchError === 'object' && 'message' in fetchError
          ? String(fetchError.message)
          : '';
      if (cached.length > 0) {
        setChatMessages(cached);
      }
      setChatError(
        message.toLowerCase().includes('network')
          ? 'Could not refresh live chat. Showing last saved messages.'
          : 'Could not load group chat messages.',
      );
    } finally {
      setChatLoading(false);
    }
  }, [routineId, user?.id]);

  useEffect(() => {
    if (!isChatVisible) return;
    loadChatMessages();
    const intervalId = setInterval(() => {
      loadChatMessages();
    }, 4000);

    return () => clearInterval(intervalId);
  }, [isChatVisible, loadChatMessages]);

  useEffect(() => {
    if (!routineId || chatMessages.length === 0) return;
    writeCachedChatMessages(routineId, chatMessages);
  }, [chatMessages, routineId]);

  useEffect(() => {
    if (!isChatVisible || chatMessages.length === 0) return;
    const timeout = setTimeout(() => {
      chatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [chatMessages, isChatVisible]);

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

  const handleSendPredefinedMessage = useCallback(
    async (text: string): Promise<void> => {
      if (!routineId || !text.trim() || isSendingMessageRef.current) return;
      isSendingMessageRef.current = true;

      const senderName = user?.name || user?.email || 'You';
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage: ChatMessage = {
        id: optimisticId,
        text,
        sender: 'me',
        senderName,
        createdAt: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, optimisticMessage]);
      setSendingMessage(text);
      setChatError(null);

      try {
        const sendResult = await routineService.sendRoutineChatMessage(routineId, text);
        debugLog('chat_send_success', { routineId, message: text, response: sendResult });
        setChatMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
        console.log('Predefined messages: ', sendResult);
        await loadChatMessages();
      } catch (sendError) {
        debugLog('chat_send_error', { routineId, message: text, error: sendError });
        setChatMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
        const message =
          sendError && typeof sendError === 'object' && 'message' in sendError
            ? String(sendError.message)
            : '';
        setChatError(
          message.toLowerCase().includes('network')
            ? 'Could not send message due to network issue.'
            : 'Could not send message.',
        );
      } finally {
        setSendingMessage(null);
        isSendingMessageRef.current = false;
      }
    },
    [routineId, loadChatMessages, user?.email, user?.name],
  );

  const handleLeaveRoutine = useCallback((): void => {
    Alert.alert(
      'Leave Routine',
      'Are you sure you want to leave this routine?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setIsLeavingRoutine(true);
            try {
              await routineService.leaveRoutine(routineId ?? '');
              DeviceEventEmitter.emit('refreshCollaborativeRoutines');
              router.back();
            } catch (leaveError: unknown) {
              const message =
                leaveError && typeof leaveError === 'object' && 'message' in leaveError
                  ? String((leaveError as { message: unknown }).message)
                  : 'Could not leave the routine. Please try again.';
              Alert.alert('Error', message);
            } finally {
              setIsLeavingRoutine(false);
            }
          },
        },
      ],
    );
  }, [routineId, router]);

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <Animated.View entering={FadeInDown.duration(350)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Routine Details</Text>
        <TouchableOpacity
          onPress={handleLeaveRoutine}
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
                    <Animated.View
                      key={`${name}-${index}`}
                      entering={FadeInDown.delay(180 + index * 60).duration(280)}
                      style={styles.participantChip}
                    >
                      <Text style={styles.participantChipText} numberOfLines={1}>
                        {name}
                      </Text>
                    </Animated.View>
                  ))}
                </View>
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(220).duration(420)} style={styles.card}>
              <Text style={styles.sectionTitle}>Routine Details</Text>
              {detailRows.map((row, index) => (
                <Animated.View
                  key={`${row.label}-${index}`}
                  entering={FadeInDown.delay(260 + index * 50).duration(250)}
                  style={styles.infoRow}
                >
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </Animated.View>
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

      <Animated.View entering={FadeInDown.delay(280).duration(320)} style={styles.chatFabWrap}>
        <TouchableOpacity style={styles.chatFab} onPress={() => setIsChatVisible(true)}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#ffffff" />
          <Text style={styles.chatFabText}>Chat</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={isChatVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsChatVisible(false)}
      >
        <Pressable style={styles.chatOverlay} onPress={() => setIsChatVisible(false)}>
          <Pressable style={styles.chatSheet} onPress={() => null}>
            <LinearGradient
              colors={['#3b1a83', '#2e1065', '#200f4a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.chatGradient}
            >
              <View style={styles.sheetHandle} />
              <View style={styles.chatHeader}>
                <View>
                  <Text style={styles.chatTitle}>Routine Chat</Text>
                </View>
                <TouchableOpacity
                  style={styles.chatCloseBtn}
                  onPress={() => setIsChatVisible(false)}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <FlatList
                ref={chatListRef}
                data={chatMessages}
                keyExtractor={(item) => item.id}
                style={styles.chatList}
                contentContainerStyle={styles.chatListContent}
                ListEmptyComponent={
                  chatLoading ? (
                    <View style={styles.chatStateBox}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.chatStateText}>Loading group chat...</Text>
                    </View>
                  ) : (
                    <View style={styles.chatStateBox}>
                      <Ionicons name="chatbubble-outline" size={14} color="#e7d0ff" />
                      <Text style={styles.chatStateText}>No messages yet.</Text>
                    </View>
                  )
                }
                renderItem={({ item }) => (
                  <View style={item.sender === 'me' ? styles.chatRowMine : styles.chatRowOther}>
                    <View
                      style={[
                        styles.chatBubble,
                        item.sender === 'me' ? styles.chatBubbleMine : styles.chatBubbleSystem,
                      ]}
                    >
                      <Text style={styles.chatSender}>
                        {item.sender === 'me' ? 'You' : item.senderName}
                      </Text>
                      <Text style={styles.chatBubbleText}>{item.text}</Text>
                      {!!item.createdAt && (
                        <Text style={styles.chatTime}>{formatMessageTime(item.createdAt)}</Text>
                      )}
                    </View>
                  </View>
                )}
              />
              {!!chatError && (
                <View style={styles.chatStateBox}>
                  <Ionicons name="warning-outline" size={14} color="#ffd7de" />
                  <Text style={styles.chatStateText}>{chatError}</Text>
                </View>
              )}

              <View style={styles.quickReplySection}>
                <View style={styles.quickReplyHeader}>
                  <Text style={styles.quickReplyTitle}>Predefined Messages</Text>
                  <Text style={styles.quickReplyCount}>{predefinedMessages.length}</Text>
                </View>
                {predefinedLoading ? (
                  <View style={styles.quickReplyStateBox}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.quickReplyStateText}>Loading messages...</Text>
                  </View>
                ) : null}
                {!!predefinedError && !predefinedLoading ? (
                  <View style={styles.quickReplyStateBox}>
                    <Ionicons name="warning-outline" size={14} color="#ffd7de" />
                    <Text style={styles.quickReplyStateText}>{predefinedError}</Text>
                  </View>
                ) : null}
                {!predefinedLoading && !predefinedError ? (
                  <FlatList
                    data={predefinedMessages}
                    keyExtractor={(item, index) => `${item}-${index}`}
                    style={styles.quickReplyList}
                    contentContainerStyle={styles.quickReplyListContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item: message }) => (
                      <TouchableOpacity
                        style={[
                          styles.quickReplyBtn,
                          sendingMessage === message ? styles.quickReplyBtnSending : null,
                        ]}
                        onPress={() => handleSendPredefinedMessage(message)}
                        activeOpacity={0.85}
                        disabled={sendingMessage !== null}
                      >
                        {sendingMessage === message ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Ionicons name="flash-outline" size={13} color="#eec8ff" />
                        )}
                        <Text style={styles.quickReplyText}>{message}</Text>
                      </TouchableOpacity>
                    )}
                  />
                ) : null}
              </View>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
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
  chatFabWrap: {
    position: 'absolute',
    right: 18,
    bottom: 24,
  },
  chatFab: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(232, 121, 249, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#120321',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  chatFabText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  chatOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  chatSheet: {
    height: '82%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  chatGradient: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 22,
  },
  sheetHandle: {
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.34)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chatTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  chatCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatList: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: 'rgba(8,6,18,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chatListContent: {
    padding: 10,
    gap: 8,
    flexGrow: 1,
  },
  chatRowMine: {
    alignItems: 'flex-end',
  },
  chatRowOther: {
    alignItems: 'flex-start',
  },
  chatStateBox: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  chatStateText: {
    color: '#f5dfff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  chatBubble: {
    maxWidth: '90%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  chatBubbleMine: {
    backgroundColor: 'rgba(232, 121, 249, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  chatBubbleSystem: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  chatBubbleText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
  },
  chatSender: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  chatTime: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  quickReplySection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 10,
  },
  quickReplyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickReplyTitle: {
    color: '#f4d8ff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  quickReplyCount: {
    color: '#e9ccff',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  quickReplyList: {
    maxHeight: 190,
  },
  quickReplyListContent: {
    gap: 8,
    paddingBottom: 2,
  },
  quickReplyStateBox: {
    marginTop: 2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickReplyStateText: {
    color: '#f5dfff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  quickReplyBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  quickReplyBtnSending: {
    opacity: 0.75,
  },
  quickReplyText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
});
