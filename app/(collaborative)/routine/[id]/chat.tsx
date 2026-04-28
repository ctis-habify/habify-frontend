import { HomeButton } from '@/components/navigation/home-button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeOutDown, FadeOutUp, LinearTransition } from "react-native-reanimated";

import { RoutineCompletedAnimation } from '@/components/animations/routine-completed-animation';
import { ImageFullscreenModal } from '@/components/modals/image-fullscreen-modal';
import { ChatVerificationItem } from '@/components/routines/chat-verification-item';
import { Colors, getBackgroundGradient } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { PredefinedRoutineMessage } from '@/services/routine.service';
import { routineService } from '@/services/routine.service';
import { RoutineLog } from '@/types/routine';

type ChatMessage = {
  id: string;
  text: string;
  sender: 'me' | 'system' | 'other';
  senderName: string;
  senderAvatar?: string;
  createdAt?: string;
  isSystemEvent?: boolean;
};
type RawChatMessage = {
  id?: string | number;
  routineId?: string;
  message?: string;
  sentAt?: string;
  userId?: string;
  user?: {
    id?: string;
    name?: string;
    username?: string;
    email?: string;
    avatar?: string;
    avatarUrl?: string;
    avatar_url?: string;
    profileImage?: string;
    user_avatar?: string;
  };
  userAvatar?: string;
  profileImage?: string;
  user_avatar?: string;
};

type RoutineParticipant = {
  id: string;
  name: string;
};

const CHAT_CACHE_KEY_PREFIX = 'routine_chat_cache_';
const PREDEFINED_CATEGORY_ORDER = [
  'motivation',
  'checkin',
  'support',
  'spicy',
  'funny',
  'general',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  motivation: 'Motivation',
  checkin: 'Check-in',
  support: 'Support',
  spicy: 'Spicy',
  funny: 'Funny',
};

const getCategoryLabel = (category: string): string =>
  CATEGORY_LABELS[category.trim().toLowerCase()] || 'General';

const CATEGORY_COLORS: Record<string, string> = {
  motivation: '#22c55e',
  checkin: '#3b82f6',
  support: '#f59e0b',
  spicy: '#ef4444',
  funny: '#e879f9',
};

const getCategoryAccentColor = (category: string): string =>
  CATEGORY_COLORS[category.trim().toLowerCase()] || '#a78bfa';

const inferCategoryFromMessageText = (text: string): string => {
  const lower = text.toLowerCase();
  if (
    lower.includes('great job') ||
    lower.includes('streak') ||
    lower.includes('congratulations') ||
    lower.includes('motivate') ||
    lower.includes('best today')
  ) {
    return 'motivation';
  }
  if (
    lower.includes('completed my routine') ||
    lower.includes('check in') ||
    lower.includes('might be late')
  ) {
    return 'checkin';
  }
  if (lower.includes('help me') || lower.includes('encouragement')) {
    return 'support';
  }
  if (
    lower.includes('still zero') ||
    lower.includes('excuses again') ||
    lower.includes('showing up first') ||
    lower.includes('team carrying') ||
    lower.includes('alarm won again')
  ) {
    return 'spicy';
  }
  if (
    lower.includes('oops') ||
    lower.includes('procrastination') ||
    lower.includes('tomorrow') ||
    lower.includes('coffee') ||
    lower.includes('just here for the chat') ||
    lower.includes('couch') ||
    lower.includes('almost did it') ||
    lower.includes('ruin')
  ) {
    return 'funny';
  }
  return 'general';
};

const normalizeChatMessages = (
  value: unknown,
  currentUserId?: string,
  currentRoutineId?: string,
): ChatMessage[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const msg = (item || {}) as RawChatMessage;
      const text = (msg.message || '').trim();

      // Skip empty messages
      if (!text) return null;

      const senderId = msg.userId || msg.user?.id;
      const senderName =
        msg.user?.name ||
        msg.user?.username ||
        msg.user?.email ||
        (senderId ? `User ${String(senderId).slice(0, 6)}` : 'Unknown User');
      const isSystemMessage = /^\[SYSTEM\]\s*/i.test(text);

      const senderAvatar =
        msg.user?.avatar ||
        msg.user?.avatarUrl ||
        msg.user?.avatar_url ||
        msg.user?.profileImage ||
        msg.user?.user_avatar ||
        msg.userAvatar ||
        msg.profileImage ||
        msg.user_avatar;

      return {
        id: String(msg.id ?? `${senderId || 'msg'}-${index}-${text.slice(0, 8)}`),
        text: text.replace(/^\[SYSTEM\]\s*/i, ''),
        sender: isSystemMessage
          ? 'system'
          : currentUserId && String(senderId) === String(currentUserId)
            ? 'me'
            : 'other',
        senderName: isSystemMessage ? 'System' : senderName,
        senderAvatar: senderAvatar ? String(senderAvatar) : undefined,
        createdAt: msg.sentAt,
        isSystemEvent: isSystemMessage,
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
    const raw = await AsyncStorage.getItem(getChatCacheKey(routineId));
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
    await AsyncStorage.setItem(getChatCacheKey(routineId), JSON.stringify(messages));
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

const renderChatMessageText = (text: string, color?: string) => {
  const mentionMatch = text.match(/^(.*?)(\s@[^@\s].*)$/);
  if (!mentionMatch) {
    return <Text style={[styles.chatBubbleText, color ? { color } : {}]}>{text}</Text>;
  }

  const [, messageBody, mentionText] = mentionMatch;

  return (
    <Text style={[styles.chatBubbleText, color ? { color } : {}]}>
      {messageBody}
      <Text style={styles.chatMentionText}>{mentionText}</Text>
    </Text>
  );
};

export default function CollaborativeChatScreen() {
  const params = useLocalSearchParams<{ id: string; routineName?: string }>();
  const routineId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { user } = useAuth();
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const colors = Colors[theme];
  const gradientColors = getBackgroundGradient(theme, 'collaborative');
  const collaborativePrimary = colors.collaborativePrimary;

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [headerTitle, setHeaderTitle] = useState(params.routineName || 'Group Chat');

  // Image Preview State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const handleImagePreview = (url: string) => {
    setPreviewImage(url);
    setIsPreviewVisible(true);
  };
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  const [predefinedMessages, setPredefinedMessages] = useState<PredefinedRoutineMessage[]>([]);
  const [predefinedLoading, setPredefinedLoading] = useState(false);
  const [participants, setParticipants] = useState<RoutineParticipant[]>([]);
  const [taggedParticipant, setTaggedParticipant] = useState<RoutineParticipant | null>(null);
  const [selectedPredefinedMessage, setSelectedPredefinedMessage] = useState<string | null>(null);
  const [pendingLogs, setPendingLogs] = useState<RoutineLog[]>([]);
  const [isQuickReplyOpen, setIsQuickReplyOpen] = useState(false);
  const [votersModalLog, setVotersModalLog] = useState<RoutineLog | null>(null);
  const [votersModalTab, setVotersModalTab] = useState<'approvals' | 'rejections'>('approvals');
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [completionRewardText, setCompletionRewardText] = useState('');
  const lastApprovedLogIdsRef = useRef<Set<number>>(new Set());

  const displayMessages = useMemo(() => {
    // 1. First, create all virtual messages from logs (these are high-quality and have buttons)
    const virtualLogMessages: ChatMessage[] = pendingLogs
      .map((log) => {
        const imageUrl = log.verificationImageUrl;
        if (!imageUrl) return null;

        return {
          id: `virtual-log-${log.id}`,
          text: imageUrl,
          sender: log.userId === user?.id ? 'me' : 'system',
          senderName: log.userName || 'Member',
          senderAvatar: log.userAvatar,
          createdAt: log.createdAt || log.logDate,
        } as ChatMessage;
      })
      .filter((m): m is ChatMessage => m !== null);

    // 2. Filter chat messages to remove any that are actually covered by the virtualLogMessages
    const filteredChatMessages = chatMessages.filter((m) => {
      const text = m.text.toLowerCase();
      const imageRegex = /\.(jpg|jpeg|png|gif|webp|heic|heif)(\?.*)?$/i;
      const isPhoto = /^\[photo\]:/i.test(text) || text.includes('storage.googleapis.com') || imageRegex.test(text);

      if (!isPhoto) return true;

      // Extract filename for comparison
      const msgFileName = text.split('/').pop()?.split('?')[0] || '???';

      // If this photo message exists in our pending logs, skip this raw message
      const isAlreadyInLogs = pendingLogs.some(log => {
        const logUrl = (log.verificationImageUrl || '').toLowerCase();
        const logFileName = logUrl.split('/').pop()?.split('?')[0] || '!!!';
        return logUrl.includes(msgFileName) || (logFileName.length > 5 && msgFileName.includes(logFileName));
      });

      return !isAlreadyInLogs;
    });

    const merged = [...filteredChatMessages, ...virtualLogMessages];

    return merged.sort((a, b) => {
      const aTime = getMessageTimestamp(a.createdAt);
      const bTime = getMessageTimestamp(b.createdAt);

      const at = aTime || 0;
      const bt = bTime || 0;

      if (at === bt) {
        return a.id.localeCompare(b.id);
      }
      return at - bt;
    });
  }, [chatMessages, pendingLogs, user?.id]);

  const chatListRef = useRef<FlatList<ChatMessage> | null>(null);
  const isSendingMessageRef = useRef(false);

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

  const loadChatMessages = useCallback(
    async (isInitial: boolean = false): Promise<void> => {
      if (!routineId) return;

      // Always show loading for initial load to ensure fresh data is fetched
      if (isInitial) {
        setChatLoading(true);
      }

      // Read from cache immediately for initial load to avoid flicker
      const cached = await readCachedChatMessages(routineId);
      if (isInitial && cached.length > 0) {
        setChatMessages(cached);
      }

      setChatError(null);
      try {
        const messages = await routineService.getRoutineChatMessages(routineId);
        const normalized = sortChatMessagesOldToNew(
          normalizeChatMessages(messages, user?.id),
        );
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
    },
    [routineId, user?.id],
  );

  const fetchPendingLogs = useCallback(async () => {
    if (!routineId) return;
    try {
      const logs = await routineService.getRoutineLogs(routineId);
      const logsWithImages = logs.filter((l) => !!l.verificationImageUrl);
      const newlyApprovedByGroup = logsWithImages.find((log) => {
        if (!user?.id || log.userId !== user.id) return false;
        const isApproved = log.status === 'approved' || log.isCompletedByGroup;
        return isApproved && !lastApprovedLogIdsRef.current.has(log.id);
      });

      if (newlyApprovedByGroup) {
        const xp = newlyApprovedByGroup.completionXp || 10;
        const streak = newlyApprovedByGroup.submitterStreak || 0;
        setCompletionRewardText(streak > 0 ? `+${xp} XP  ·  🔥 Streak ${streak}` : `+${xp} XP`);
        setShowCompletionAnimation(true);
      }

      lastApprovedLogIdsRef.current = new Set(
        logsWithImages
          .filter((log) => log.status === 'approved' || log.isCompletedByGroup)
          .map((log) => log.id),
      );
      setPendingLogs(logsWithImages);
    } catch (_e) {
      // ignore
    }
  }, [routineId, user?.id]);

  const loadPredefinedMessages = useCallback(async (): Promise<void> => {
    if (!routineId) return;
    setPredefinedLoading(true);
    try {
      const messagesFromApi = await routineService.getRoutinePredefinedMessages();
      const messagesWithFallbackCategory = messagesFromApi.map((item) => ({
        ...item,
        category:
          item.category && item.category.toLowerCase() !== 'general'
            ? item.category.toLowerCase()
            : inferCategoryFromMessageText(item.text),
      }));
      const sortedWithFallback = [...messagesWithFallbackCategory].sort((a, b) => {
        const categoryA = a.category?.toLowerCase() || 'general';
        const categoryB = b.category?.toLowerCase() || 'general';
        const categoryIndexA = PREDEFINED_CATEGORY_ORDER.indexOf(
          categoryA as (typeof PREDEFINED_CATEGORY_ORDER)[number],
        );
        const categoryIndexB = PREDEFINED_CATEGORY_ORDER.indexOf(
          categoryB as (typeof PREDEFINED_CATEGORY_ORDER)[number],
        );
        const aIndex = categoryIndexA === -1 ? PREDEFINED_CATEGORY_ORDER.length : categoryIndexA;
        const bIndex = categoryIndexB === -1 ? PREDEFINED_CATEGORY_ORDER.length : categoryIndexB;
        if (aIndex !== bIndex) return aIndex - bIndex;
        return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
      });
      setPredefinedMessages(sortedWithFallback);
    } catch (_messageError) {
      setPredefinedMessages([]);
    } finally {
      setPredefinedLoading(false);
    }
  }, [routineId]);

  const loadParticipants = useCallback(async (): Promise<void> => {
    if (!routineId) return;

    try {
      const groupDetail = await routineService.getGroupDetail(routineId);
      const normalizedParticipants = Array.isArray(groupDetail?.participants)
        ? groupDetail.participants
          .map((participant) => {
            const source =
              participant && typeof participant === 'object'
                ? (participant as Record<string, unknown>)
                : {};
            const userInfo =
              source.user && typeof source.user === 'object'
                ? (source.user as Record<string, unknown>)
                : {};

            const id = String(source.userId || source.id || userInfo.id || '').trim();
            const name = String(
              source.username || source.name || userInfo.username || userInfo.name || '',
            ).trim();

            if (!id || !name || id === user?.id) {
              return null;
            }

            return { id, name } satisfies RoutineParticipant;
          })
          .filter((participant): participant is RoutineParticipant => participant !== null)
        : [];

      setParticipants(normalizedParticipants);
      if (groupDetail?.routineName) {
        setHeaderTitle(groupDetail.routineName);
      }
      setTaggedParticipant((current) =>
        current && normalizedParticipants.some((participant) => participant.id === current.id)
          ? current
          : null,
      );
    } catch {
      setParticipants([]);
      setTaggedParticipant(null);
    }
  }, [routineId, user?.id]);

  useEffect(() => {
    const initPage = async () => {
      setIsInitialLoading(true);
      try {
        await Promise.all([
          loadChatMessages(true),
          loadPredefinedMessages(),
          loadParticipants(),
          fetchPendingLogs(),
        ]);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initPage();

    // Listen for manual refreshes 
    const sub = DeviceEventEmitter.addListener('refreshCollaborativeRoutines', () => {
      fetchPendingLogs();
      loadChatMessages();
    });

    const intervalId = setInterval(() => {
      loadChatMessages();
      fetchPendingLogs();
    }, 1500);

    return () => {
      clearInterval(intervalId);
      sub.remove();
    };
  }, [loadChatMessages, loadPredefinedMessages, loadParticipants, fetchPendingLogs]);

  useEffect(() => {
    if (displayMessages.length === 0) return;
    const timeout = setTimeout(() => {
      chatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [displayMessages.length]);

  const handleSendPredefinedMessage = useCallback(
    async (text: string, participantToTag?: RoutineParticipant | null): Promise<void> => {
      if (!routineId || !text.trim() || isSendingMessageRef.current) return;
      isSendingMessageRef.current = true;

      const finalTaggedParticipant = participantToTag ?? taggedParticipant;
      const outgoingText = finalTaggedParticipant
        ? `${text} @${finalTaggedParticipant.name}`
        : text;

      const senderName = user?.name || user?.email || 'You';
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage: ChatMessage = {
        id: optimisticId,
        text: outgoingText,
        sender: 'me',
        senderName,
        createdAt: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, optimisticMessage]);
      setSendingMessage(text);
      setChatError(null);

      try {
        await routineService.sendRoutineChatMessage(routineId, outgoingText);
        setChatMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
        setTaggedParticipant(null);
        setSelectedPredefinedMessage(null);
        setIsQuickReplyOpen(false);
        await loadChatMessages();
      } catch (sendError: unknown) {
        setChatMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
        await loadChatMessages();
        let errorMessage = 'Could not send message.';
        if (axios.isAxiosError(sendError)) {
          const apiMessage = sendError.response?.data?.message;
          if (Array.isArray(apiMessage)) {
            errorMessage = apiMessage.join(', ');
          } else if (typeof apiMessage === 'string' && apiMessage.trim()) {
            errorMessage = apiMessage;
          }
        } else if (sendError instanceof Error && sendError.message.trim()) {
          errorMessage = sendError.message;
        }
        setChatError(errorMessage);
      } finally {
        setSendingMessage(null);
        isSendingMessageRef.current = false;
      }
    },
    [routineId, taggedParticipant, loadChatMessages, user?.email, user?.name],
  );

  const handleCaptureAndUploadImage = useCallback(() => {
    if (!routineId) {
      Alert.alert('Error', 'Routine ID is missing.');
      return;
    }

    // Navigate to the custom camera modal
    router.push({
      pathname: '/(collaborative)/camera-modal',
      params: { routineId },
    });
  }, [routineId, router]);

  const handleApproveLog = async (logId: number) => {
    try {
      await routineService.verifyCollaborativeLog(logId, 'approved');

      // Update local state for immediate feedback
      setPendingLogs((prev) =>
        prev.map((l) => {
          if (l.id === logId) {
            const alreadyApproved = (l.approvals || []).some(
              (item) => (typeof item === 'string' ? item : item?.id) === user?.id,
            );
            const voterObj =
              user && !alreadyApproved ? { id: user.id, name: user.name || 'You' } : null;
            const newApprovals = [...(l.approvals || []), ...(voterObj ? [voterObj] : [])];
            const requiredApprovals = l.requiredApprovals || 0;
            const isCompletedByGroup =
              requiredApprovals > 0
                ? newApprovals.length >= requiredApprovals
                : l.status === 'approved' || l.isCompletedByGroup === true;
            return {
              ...l,
              approvals: newApprovals,
              approvalCount: newApprovals.length,
              status: isCompletedByGroup ? 'approved' : 'pending',
              isCompletedByGroup,
            };
          }
          return l;
        }),
      );

      Alert.alert('Success', 'Your vote has been recorded.');
      fetchPendingLogs();
    } catch (_e) {
      Alert.alert('Error', 'Failed to approve. Please try again.');
    }
  };

  const handleRejectLog = async (logId: number) => {
    try {
      await routineService.verifyCollaborativeLog(logId, 'rejected');

      // Update local state
      setPendingLogs((prev) =>
        prev.map((l) => {
          if (l.id === logId) {
            const alreadyRejected = (l.rejections || []).some(
              (item) => (typeof item === 'string' ? item : item?.id) === user?.id,
            );
            const voterObj =
              user && !alreadyRejected ? { id: user.id, name: user.name || 'You' } : null;
            const newRejections = [...(l.rejections || []), ...(voterObj ? [voterObj] : [])];
            return {
              ...l,
              status: 'rejected',
              rejections: newRejections,
            };
          }
          return l;
        }),
      );

      Alert.alert('Rejected', 'The log has been rejected.');
      fetchPendingLogs();
    } catch (_e) {
      Alert.alert('Error', 'Failed to reject. Please try again.');
    }
  };

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <Animated.View entering={FadeInDown.duration(350)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {headerTitle}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleCaptureAndUploadImage}
          style={[
            styles.detailsButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              marginRight: 4,
            },
          ]}
        >
          <Ionicons name="camera-outline" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/(collaborative)/routine/[id]',
            params: { id: routineId }
          } as never)}
          style={[styles.detailsButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="information-circle-outline" size={20} color={colors.text} />
          <Text style={[styles.detailsButtonText, { color: colors.text }]}>Details</Text>
        </TouchableOpacity>
        <HomeButton color={colors.text} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]} />
      </Animated.View>

      <View style={styles.chatContainer}>
        {isInitialLoading ? (
          <View style={styles.centeredBlock}>
            <ActivityIndicator color={collaborativePrimary} size="large" />
            <Text style={[styles.loadingText, { color: colors.text, opacity: 0.6 }]}>
              Loading group chat...
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={chatListRef}
              data={displayMessages}
              keyExtractor={(item) => item.id}
              style={styles.chatList}
              contentContainerStyle={styles.chatListContent}
              ListEmptyComponent={
                chatLoading ? (
                  <View style={styles.chatStateBox}>
                    <ActivityIndicator size="small" color={colors.text} />
                    <Text style={[styles.chatStateText, { color: colors.text }]}>Loading group chat...</Text>
                  </View>
                ) : (
                  <View style={styles.chatStateBox}>
                    <Ionicons name="chatbubble-outline" size={14} color={colors.icon} />
                    <Text style={[styles.chatStateText, { color: colors.text, opacity: 0.6 }]}>No messages yet.</Text>
                  </View>
                )
              }
              renderItem={({ item, index }) => (
                <Animated.View
                  entering={FadeInDown.delay(Math.min(index, 6) * 15).duration(500).springify().damping(28)}
                  exiting={FadeOutUp}
                  layout={LinearTransition.springify().damping(24).stiffness(140).duration(500)}
                  style={
                    item.isSystemEvent
                      ? styles.chatRowSystemEvent
                      : item.sender === 'me'
                        ? styles.chatRowMine
                        : styles.chatRowOther
                  }
                >
                  <View style={[
                    styles.chatRowWrapper,
                    item.sender === 'me' ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }
                  ]}>
                    {item.sender === 'other' && !item.isSystemEvent && (
                      <View style={styles.chatAvatarWrapper}>
                        <UserAvatar
                          url={item.senderAvatar}
                          name={item.senderName}
                          size={32}
                          borderColor="rgba(255,255,255,0.1)"
                          borderWidth={1}
                        />
                      </View>
                    )}

                    <View
                      style={[
                        styles.chatBubble,
                        item.isSystemEvent
                          ? [styles.chatBubbleEvent, { backgroundColor: colors.surface, borderColor: colors.border }]
                          : item.sender === 'me'
                            ? [styles.chatBubbleMine, { backgroundColor: collaborativePrimary }]
                            : [styles.chatBubbleOther, { backgroundColor: colors.card }],
                      ]}
                    >
                      {!item.isSystemEvent ? (
                        <Text style={[styles.chatSender, { color: item.sender === 'me' ? colors.white : colors.text, opacity: 0.8 }]}>
                          {item.sender === 'me' ? 'You' : item.senderName}
                        </Text>
                      ) : (
                        <Text style={[styles.chatSystemLabel, { color: colors.icon }]}>System</Text>
                      )}

                      {(() => {
                        const imageRegex = /\.(jpg|jpeg|png|gif|webp|heic|heif)(\?.*)?$/i;
                        const isPhotoMessage =
                          /^\[photo\]:/i.test(item.text) ||
                          item.text.includes('storage.googleapis.com') ||
                          imageRegex.test(item.text);

                        if (!isPhotoMessage) {
                          return renderChatMessageText(item.text, item.sender === 'me' ? colors.white : colors.text);
                        }

                        const isPrefixed = /^\[photo\]:/i.test(item.text);
                        let imageUrl = (isPrefixed ? item.text.replace(/^\[photo\]:/i, '') : item.text).trim();

                        if (!imageUrl.startsWith('http')) {
                          imageUrl = `https://storage.googleapis.com/habify-photo-uploads/${imageUrl.trim()}`;
                        }

                        const matchingLog = pendingLogs.find((l) => {
                          const logUrl = (l.verificationImageUrl || '').toLowerCase().trim();
                          const msgUrl = imageUrl.toLowerCase().trim();
                          const logFileName = logUrl.split('/').pop()?.split('?')[0] || '!!!';
                          const msgFileName = msgUrl.split('/').pop()?.split('?')[0] || '???';
                          return (
                            logUrl === msgUrl ||
                            msgUrl.includes(logUrl) ||
                            logUrl.includes(msgUrl) ||
                            (logFileName !== '!!!' && logFileName === msgFileName)
                          );
                        });

                        if (matchingLog) {
                          return (
                            <ChatVerificationItem
                              log={matchingLog}
                              onApprove={handleApproveLog}
                              onReject={handleRejectLog}
                              onViewVotes={(log, tab) => {
                                setVotersModalTab(tab);
                                setVotersModalLog(log);
                              }}
                              onPressImage={handleImagePreview}
                              currentUserId={user?.id}
                            />
                          );
                        }

                        return (
                          <View style={styles.chatImageWrapper}>
                            <View style={styles.imageLoadingPlaceholder}>
                              <ActivityIndicator color={colors.primary} size="small" />
                            </View>
                            <TouchableOpacity
                              onPress={() => handleImagePreview(imageUrl)}
                              activeOpacity={0.9}
                              style={{ zIndex: 2 }}
                            >
                              <Image
                                source={{ uri: imageUrl }}
                                style={styles.chatImage}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          </View>
                        );
                      })()}

                      {!!item.createdAt && (
                        <Text style={[styles.chatTime, { color: item.sender === 'me' ? colors.white : colors.textSecondary, opacity: 0.7 }]}>{formatMessageTime(item.createdAt)}</Text>
                      )}
                    </View>
                  </View>
                </Animated.View>
              )}
            />

            {!!chatError && (
              <View style={styles.chatStateBox}>
                <Ionicons name="warning-outline" size={14} color={colors.error} />
                <Text style={[styles.chatStateText, { color: colors.error }]}>{chatError}</Text>
              </View>
            )}

            {predefinedMessages.length > 0 && (
              <TouchableOpacity
                style={[styles.openReplyBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}
                onPress={() => {
                  setSelectedPredefinedMessage(null);
                  setTaggedParticipant(null);
                  setIsQuickReplyOpen(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.openReplyText, { color: colors.text, opacity: 0.6 }]}>✨ Type a message...</Text>
                <Ionicons name="chatbubbles" size={20} color={collaborativePrimary} />
              </TouchableOpacity>
            )}
          </>
        )}

        <Modal visible={isQuickReplyOpen} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => {
                setIsQuickReplyOpen(false);
                setSelectedPredefinedMessage(null);
                setTaggedParticipant(null);
              }}
            />
            <View style={[styles.quickReplyBottomSheet, { borderTopColor: colors.border, borderTopWidth: 1, overflow: 'hidden' }]}>
              <LinearGradient
                colors={isDark ? ['#1E1B4B', '#0F172A'] : ['#F5F3FF', '#EDE9FE']}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.bottomSheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)' }]} />
              <TouchableOpacity
                onPress={() => {
                  setIsQuickReplyOpen(false);
                  setSelectedPredefinedMessage(null);
                  setTaggedParticipant(null);
                }}
                style={[styles.floatingCloseBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Ionicons name="close" size={20} color={isDark ? '#e7d0ff' : colors.primary} />
              </TouchableOpacity>
              <View style={styles.bottomSheetHeader}>
                <View style={styles.bottomSheetTitleWrap}>
                  <Text style={[styles.quickReplyTitle, { color: colors.text }]}>Quick replies</Text>
                  <Text style={[styles.quickReplySubtitle, { color: colors.textSecondary }]}>
                    Pick a message, then send it to the group or mention one teammate.
                  </Text>
                </View>
              </View>

              {predefinedLoading ? (
                <View style={styles.quickReplyStateBox}>
                  <ActivityIndicator size="small" color={collaborativePrimary} />
                </View>
              ) : (
                <Animated.ScrollView
                  layout={LinearTransition.duration(260)}
                  style={styles.quickReplyScroll}
                  contentContainerStyle={styles.quickReplyScrollContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {selectedPredefinedMessage ? (
                    <Animated.View
                      entering={FadeInUp.duration(600).springify().damping(28).stiffness(100)}
                      exiting={FadeOutDown.duration(240)}
                      style={[styles.selectedMessageCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <Text style={[styles.selectedMessageLabel, { color: colors.primary }]}>Selected message</Text>
                      <View style={[styles.selectedMessagePreview, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 12 }]}>
                        <Ionicons name="sparkles-outline" size={16} color={isDark ? "#c4b5fd" : colors.primary} />
                        <Text style={[styles.selectedMessageText, { color: colors.text }]}>{selectedPredefinedMessage}</Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.sendToGroupButton,
                          { backgroundColor: collaborativePrimary },
                          sendingMessage === selectedPredefinedMessage &&
                          styles.quickReplyBtnSending,
                        ]}
                        onPress={() => handleSendPredefinedMessage(selectedPredefinedMessage, null)}
                        activeOpacity={0.85}
                        disabled={sendingMessage !== null}
                      >
                        {sendingMessage === selectedPredefinedMessage && !taggedParticipant ? (
                          <ActivityIndicator size="small" color={colors.white} />
                        ) : null}
                        <Text style={[styles.sendToGroupText, { color: colors.white }]}>Send to group</Text>
                      </TouchableOpacity>

                      {participants.length > 0 ? (
                        <View style={styles.tagSection}>
                          <Text style={[styles.tagSectionLabel, { color: colors.textTertiary }]}>Mention a teammate</Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.tagScrollContent}
                          >
                            {participants.map((participant) => {
                              const isSelected = taggedParticipant?.id === participant.id;
                              return (
                                <TouchableOpacity
                                  key={participant.id}
                                  style={[
                                    styles.tagChip,
                                    { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border },
                                    isSelected && { backgroundColor: isDark ? 'rgba(167, 139, 250, 0.3)' : colors.primary, borderColor: colors.primary }
                                  ]}
                                  onPress={() => setTaggedParticipant(participant)}
                                  activeOpacity={0.85}
                                >
                                  <Text
                                    style={[
                                      styles.tagChipText,
                                      { color: isSelected ? colors.white : colors.textSecondary },
                                      isSelected && styles.tagChipTextSelected,
                                    ]}
                                  >
                                    @{participant.name}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>

                          <TouchableOpacity
                            style={[
                              styles.sendTaggedButton,
                              { backgroundColor: taggedParticipant ? collaborativePrimary : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') },
                              !taggedParticipant && styles.sendTaggedButtonDisabled,
                              sendingMessage === selectedPredefinedMessage &&
                              taggedParticipant &&
                              styles.quickReplyBtnSending,
                            ]}
                            onPress={() =>
                              taggedParticipant
                                ? handleSendPredefinedMessage(
                                  selectedPredefinedMessage,
                                  taggedParticipant,
                                )
                                : undefined
                            }
                            activeOpacity={0.85}
                            disabled={!taggedParticipant || sendingMessage !== null}
                          >
                            {sendingMessage === selectedPredefinedMessage && taggedParticipant ? (
                              <ActivityIndicator size="small" color={colors.white} />
                            ) : null}
                            <Text style={[styles.sendTaggedText, { color: taggedParticipant ? colors.white : colors.textSecondary }]}>
                              {taggedParticipant
                                ? `Send to @${taggedParticipant.name}`
                                : 'Select a teammate above'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}

                      <TouchableOpacity
                        style={styles.changeMessageButton}
                        onPress={() => {
                          setSelectedPredefinedMessage(null);
                          setTaggedParticipant(null);
                        }}
                        activeOpacity={0.85}
                        disabled={sendingMessage !== null}
                      >
                        <Text style={[styles.changeMessageText, { color: isDark ? '#c4b5fd' : colors.primary }]}>Choose a different message</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ) : (
                    <Animated.View
                      entering={FadeInDown.duration(260)}
                      exiting={FadeOutUp.duration(280)}
                      layout={LinearTransition.duration(260)}
                    >
                      {PREDEFINED_CATEGORY_ORDER.map((categoryKey) => {
                        const items = predefinedMessages.filter(
                          (msg) => (msg.category || 'general').toLowerCase() === categoryKey,
                        );
                        if (items.length === 0) return null;

                        return (
                          <View key={categoryKey} style={styles.quickReplyCategorySection}>
                            <Text style={[styles.quickReplyCategoryTitle, { color: isDark ? '#e7d0ff' : colors.primary }]}>
                              {getCategoryLabel(categoryKey)}
                            </Text>
                            <View style={styles.quickReplyGrid}>
                              {items.map((message, index) => {
                                const accentColor = getCategoryAccentColor(categoryKey);
                                return (
                                  <TouchableOpacity
                                    key={`${message.text}-${index}`}
                                    style={[
                                      styles.quickReplyBtn,
                                      {
                                        backgroundColor: `${accentColor}22`,
                                        borderColor: `${accentColor}55`,
                                      },
                                      sendingMessage === message.text &&
                                      styles.quickReplyBtnSending,
                                    ]}
                                    onPress={() => {
                                      setSelectedPredefinedMessage(message.text);
                                      setTaggedParticipant(null);
                                    }}
                                    activeOpacity={0.7}
                                    disabled={sendingMessage !== null}
                                  >
                                    {sendingMessage === message.text ? (
                                      <ActivityIndicator size="small" color={accentColor} />
                                    ) : null}
                                    <Text
                                      style={[styles.quickReplyBtnText, { color: accentColor }]}
                                      numberOfLines={2}
                                    >
                                      {message.text}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        );
                      })}
                    </Animated.View>
                  )}
                </Animated.ScrollView>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={!!votersModalLog} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setVotersModalLog(null)} />
            <View style={[styles.votersContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.votersHeader}>
                <Text style={[styles.votersTitle, { color: colors.text }]}>Verification Status</Text>
                <TouchableOpacity onPress={() => setVotersModalLog(null)}>
                  <Ionicons name="close" size={20} color={colors.icon} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 16 }}>
                {votersModalTab === 'approvals' &&
                  votersModalLog?.approvals &&
                  votersModalLog.approvals.length > 0 && (
                    <View style={{ gap: 8 }}>
                      <Text
                        style={{
                          color: '#4ade80',
                          fontSize: 13,
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                        }}
                      >
                        Approvals
                      </Text>
                      {votersModalLog.approvals.map((voter, index) => {
                        const id = typeof voter === 'string' ? voter : voter.id;
                        const name = typeof voter === 'string' ? 'Member' : voter.name;
                        const avatarUrl = typeof voter === 'string' ? undefined : voter.avatarUrl;
                        return (
                          <View
                            key={`approve-${id}-${index}`}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              padding: 10,
                              borderRadius: 12,
                              gap: 10,
                            }}
                          >
                            <UserAvatar
                              url={(voter as any).avatar || (voter as any).avatarUrl || (voter as any).profileImage}
                              name={name}
                              size={28}
                            />
                            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                              {name}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                {votersModalTab === 'rejections' &&
                  votersModalLog?.rejections &&
                  votersModalLog.rejections.length > 0 && (
                    <View style={{ gap: 8 }}>
                      <Text
                        style={{
                          color: '#f87171',
                          fontSize: 13,
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                        }}
                      >
                        Rejections
                      </Text>
                      {votersModalLog.rejections.map((voter, index) => {
                        const id = typeof voter === 'string' ? voter : voter.id;
                        const name = typeof voter === 'string' ? 'Member' : voter.name;
                        const avatarUrl = typeof voter === 'string' ? undefined : voter.avatarUrl;
                        return (
                          <View
                            key={`reject-${id}-${index}`}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              padding: 10,
                              borderRadius: 12,
                              gap: 10,
                            }}
                          >
                            <UserAvatar
                              url={(voter as any).avatar || (voter as any).avatarUrl || (voter as any).profileImage}
                              name={name}
                              size={28}
                            />
                            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
                              {name}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                {(votersModalTab === 'approvals' && !votersModalLog?.approvals?.length) ||
                  (votersModalTab === 'rejections' && !votersModalLog?.rejections?.length) ? (
                  <Text
                    style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 10 }}
                  >
                    No votes yet.
                  </Text>
                ) : null}
              </View>

              <ScrollView style={styles.votersList} showsVerticalScrollIndicator={false}>
                {votersModalTab === 'approvals' ? (
                  (votersModalLog?.approvals || []).length > 0 ? (
                    (votersModalLog?.approvals || []).map((voter: any, idx: number) => (
                      <View key={idx} style={[styles.voterRow, { borderBottomColor: colors.border }]}>
                        <UserAvatar
                          url={voter.avatar || voter.avatarUrl || voter.profileImage}
                          name={voter.name || voter.username}
                          size={32}
                          style={styles.voterAvatar}
                        />
                        <Text style={[styles.voterName, { color: colors.text }]}>{voter.name || voter.username || 'Member'}</Text>
                        <Ionicons name="checkmark-circle" size={18} color={getCategoryAccentColor('motivation')} />
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.votersEmpty, { color: colors.icon }]}>No approvals yet.</Text>
                  )
                ) : (
                  (votersModalLog?.rejections || []).length > 0 ? (
                    (votersModalLog?.rejections || []).map((voter: any, idx: number) => (
                      <View key={idx} style={[styles.voterRow, { borderBottomColor: colors.border }]}>
                        <UserAvatar
                          url={voter.avatar || voter.avatarUrl || voter.profileImage}
                          name={voter.name || voter.username}
                          size={32}
                          style={styles.voterAvatar}
                        />
                        <Text style={[styles.voterName, { color: colors.text }]}>{voter.name || voter.username || 'Member'}</Text>
                        <Ionicons name="close-circle" size={18} color={getCategoryAccentColor('spicy')} />
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.votersEmpty, { color: colors.icon }]}>No rejections yet.</Text>
                  )
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <ImageFullscreenModal
          visible={isPreviewVisible}
          imageUrl={previewImage || ''}
          onClose={() => setIsPreviewVisible(false)}
        />

        <RoutineCompletedAnimation
          visible={showCompletionAnimation}
          rewardText={completionRewardText}
          onComplete={() => setShowCompletionAnimation(false)}
        />

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 58,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chatContainer: {
    flex: 1,
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    padding: 16,
    paddingBottom: 24,
  },
  chatRowMine: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  chatRowOther: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  chatRowSystemEvent: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  chatBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 18,
  },
  chatBubbleMine: {
    borderBottomRightRadius: 4,
  },
  chatBubbleOther: {
    borderBottomLeftRadius: 4,
  },
  chatBubbleEvent: {
    maxWidth: '90%',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  chatMentionText: {
    color: '#8B5CF6', // Medium-Dark Violet (Visible on both)
    fontWeight: '800',
  },
  chatSender: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  chatSystemLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
    opacity: 0.6,
  },
  chatBubbleText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  chatTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  chatStateBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chatStateText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  chatImageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.4)',
    marginVertical: 4,
    width: 200,
    height: 250,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatImage: {
    width: 200,
    height: 250,
  },
  imageLoadingPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  openReplyBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
  openReplyText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  quickReplyBottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40,
    minHeight: '60%',
    maxHeight: '85%',
  },
  bottomSheetHeader: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  quickReplyTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#e7d0ff',
  },
  floatingCloseBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
  },
  bottomSheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 16,
  },
  bottomSheetTitleWrap: {
    gap: 6,
    paddingRight: 44,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickReplyScroll: {
    flex: 1,
    maxHeight: 420,
  },
  quickReplyScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  quickReplyCategorySection: {
    marginBottom: 24,
    width: '100%',
  },
  quickReplyCategoryTitle: {
    color: '#e7d0ff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    gap: 8,
  },
  quickReplySubtitle: {
    color: 'rgba(231, 208, 255, 0.7)',
    fontSize: 13,
    lineHeight: 18,
  },
  selectedMessageCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
    gap: 14,
  },
  selectedMessageLabel: {
    color: 'rgba(231, 208, 255, 0.72)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  selectedMessageText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    flex: 1,
  },
  selectedMessagePreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  sendToGroupButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(250, 247, 252, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(236, 230, 243, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sendToGroupText: {
    color: '#fffcff',
    fontSize: 15,
    fontWeight: '700',
  },
  tagSection: {
    gap: 10,
    marginTop: 2,
  },
  tagSectionLabel: {
    color: 'rgba(231, 208, 255, 0.72)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tagScrollContent: {
    gap: 10,
    paddingRight: 8,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tagChipSelected: {
    backgroundColor: 'rgba(247, 243, 251, 0.24)',
    borderColor: 'rgba(232, 224, 241, 0.36)',
  },
  tagChipText: {
    color: '#e7d0ff',
    fontSize: 13,
    fontWeight: '600',
  },
  tagChipTextSelected: {
    color: '#ffffff',
  },
  sendTaggedButton: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(248, 244, 252, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(233, 225, 242, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sendTaggedButtonDisabled: {
    opacity: 0.55,
  },
  sendTaggedText: {
    fontSize: 14,
    fontWeight: '700',
  },
  changeMessageButton: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  changeMessageText: {
    color: '#c4b5fd',
    fontSize: 13,
    fontWeight: '600',
  },
  quickReplyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  quickReplyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: '22%',
    flexGrow: 1,
  },
  quickReplyBtnSending: {
    opacity: 0.5,
  },
  quickReplyBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  quickReplyStateBox: {
    padding: 40,
    alignItems: 'center',
  },
  votersContent: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: '50%',
  },
  votersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  votersTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  votersTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  votersTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  votersTabActive: {
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  votersTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  votersTabTextActive: {
    fontWeight: '700',
  },
  votersList: {
    flex: 1,
  },
  voterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  voterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  voterLetter: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '800',
  },
  voterName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  votersEmpty: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  centeredBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chatRowWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
  chatAvatarWrapper: {
    marginRight: 8,
    marginBottom: 4,
  },
  chatAvatar: {
    width: 32,
    height: 32,
  },
});
