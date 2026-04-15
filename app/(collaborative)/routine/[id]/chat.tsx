import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
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
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';

import { ChatVerificationItem } from '@/components/routines/chat-verification-item';
import { RoutineCompletedAnimation } from '@/components/animations/routine-completed-animation';
import { ImageFullscreenModal } from '@/components/modals/image-fullscreen-modal';
import { useAuth } from '@/hooks/use-auth';
import { routineService } from '@/services/routine.service';
import type { PredefinedRoutineMessage } from '@/services/routine.service';
import { RoutineLog } from '@/types/routine';

type ChatMessage = {
  id: string;
  text: string;
  sender: 'me' | 'system';
  senderName: string;
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
  };
};

type RoutineParticipant = {
  id: string;
  name: string;
};

const CHAT_CACHE_KEY_PREFIX = 'routine_chat_cache_';
const PREDEFINED_CATEGORY_ORDER = ['motivation', 'checkin', 'support', 'spicy', 'funny', 'general'] as const;

const getCategoryLabel = (category: string): string => {
  const normalized = category.trim().toLowerCase();
  if (normalized === 'motivation') return 'Motivation';
  if (normalized === 'checkin') return 'Check-in';
  if (normalized === 'support') return 'Support';
  if (normalized === 'spicy') return 'Spicy';
  if (normalized === 'funny') return 'Funny';
  return 'General';
};

const getCategoryAccentColor = (category: string): string => {
  const normalized = category.trim().toLowerCase();
  if (normalized === 'motivation') return '#22c55e';
  if (normalized === 'checkin') return '#3b82f6';
  if (normalized === 'support') return '#f59e0b';
  if (normalized === 'spicy') return '#ef4444';
  if (normalized === 'funny') return '#e879f9';
  return '#a78bfa';
};

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
  if (
    lower.includes('help me') ||
    lower.includes('encouragement')
  ) {
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
      if (!text) return null;
      if (currentRoutineId && msg.routineId && String(msg.routineId) !== String(currentRoutineId)) return null;

      const senderId = msg.userId || msg.user?.id;
      const senderName =
        msg.user?.name ||
        msg.user?.username ||
        msg.user?.email ||
        (senderId ? `User ${String(senderId).slice(0, 6)}` : 'Unknown User');
      const isSystemMessage = /^\[SYSTEM\]\s*/i.test(text);

      return {
        id: String(msg.id ?? `${senderId || 'msg'}-${index}-${text.slice(0, 8)}`),
        text: text.replace(/^\[SYSTEM\]\s*/i, ''),
        sender: isSystemMessage ? 'system' : currentUserId && senderId === currentUserId ? 'me' : 'system',
        senderName: isSystemMessage ? 'System' : senderName,
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

const renderChatMessageText = (text: string) => {
  const mentionMatch = text.match(/^(.*?)(\s@[^@\s].*)$/);
  if (!mentionMatch) {
    return <Text style={styles.chatBubbleText}>{text}</Text>;
  }

  const [, messageBody, mentionText] = mentionMatch;

  return (
    <Text style={styles.chatBubbleText}>
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

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

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
    // 1. Create virtual messages for any logs that don't have a corresponding chat message
    const virtualLogMessages: ChatMessage[] = pendingLogs.map(log => {
      const imageUrl = log.verificationImageUrl;
      if (!imageUrl) return null;
      
      const logUrl = imageUrl.toLowerCase();
      const logFileName = logUrl.split('/').pop() || '!!!';

      // Check if any existing chat message already contains this log's URL or parts of it
      const hasMessage = chatMessages.some(m => {
        const text = m.text.toLowerCase();
        return text.includes(logUrl) || text.includes(logFileName);
      });
      
      if (hasMessage) return null;
      
      return {
        id: `virtual-log-${log.id}`,
        text: imageUrl, // Just the URL, our renderer handles it
        sender: log.userId === user?.id ? 'me' : 'system',
        senderName: log.userName || 'Member',
        createdAt: log.createdAt || log.logDate,
      } as ChatMessage;
    }).filter((m): m is ChatMessage => m !== null);

    const merged = [...chatMessages, ...virtualLogMessages];
    
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

  const loadChatMessages = useCallback(async (isInitial: boolean = false): Promise<void> => {
    if (!routineId) return;
    
    // Always show loading for initial load to ensure fresh data is fetched
    if (isInitial) {
      setChatLoading(true);
    }
    
    // Read from cache immediately for initial load to avoid flicker (optional if we cover it, but good to have)
    const cached = await readCachedChatMessages(routineId);
    if (isInitial && cached.length > 0) {
      setChatMessages(cached);
    }
    
    setChatError(null);
    try {
      const messages = await routineService.getRoutineChatMessages(routineId);
      const normalized = sortChatMessagesOldToNew(
        normalizeChatMessages(messages, user?.id, routineId),
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
  }, [routineId, user?.id]);

  const fetchPendingLogs = useCallback(async () => {
    if (!routineId) return;
    try {
      const logs = await routineService.getRoutineLogs(routineId);
      const logsWithImages = logs.filter(l => !!l.verificationImageUrl);
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
        const categoryIndexA = PREDEFINED_CATEGORY_ORDER.indexOf(categoryA as typeof PREDEFINED_CATEGORY_ORDER[number]);
        const categoryIndexB = PREDEFINED_CATEGORY_ORDER.indexOf(categoryB as typeof PREDEFINED_CATEGORY_ORDER[number]);
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
                source.username ||
                  source.name ||
                  userInfo.username ||
                  userInfo.name ||
                  '',
              ).trim();

              if (!id || !name || id === user?.id) {
                return null;
              }

              return { id, name } satisfies RoutineParticipant;
            })
            .filter((participant): participant is RoutineParticipant => participant !== null)
        : [];

      setParticipants(normalizedParticipants);
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
    
    // Listen for manual refreshes (e.g. after camera upload)
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
    async (
      text: string,
      participantToTag?: RoutineParticipant | null,
    ): Promise<void> => {
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
      params: { routineId }
    });
  }, [routineId, router]);

  const handleApproveLog = async (logId: number) => {
    try {
      await routineService.verifyCollaborativeLog(logId, 'approved');
      
      // Update local state for immediate feedback
      setPendingLogs(prev => prev.map(l => {
        if (l.id === logId) {
          const alreadyApproved = (l.approvals || []).some((item) =>
            (typeof item === 'string' ? item : item?.id) === user?.id,
          );
          const voterObj =
            user && !alreadyApproved
              ? { id: user.id, name: user.name || 'You' }
              : null;
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
      }));
      
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
      setPendingLogs(prev => prev.map(l => {
        if (l.id === logId) {
          const alreadyRejected = (l.rejections || []).some((item) =>
            (typeof item === 'string' ? item : item?.id) === user?.id,
          );
          const voterObj =
            user && !alreadyRejected
              ? { id: user.id, name: user.name || 'You' }
              : null;
          const newRejections = [...(l.rejections || []), ...(voterObj ? [voterObj] : [])];
          return { 
            ...l, 
            status: 'rejected',
            rejections: newRejections,
          };
        }
        return l;
      }));
      
      Alert.alert('Rejected', 'The log has been rejected.');
      fetchPendingLogs();
    } catch (_e) {
      Alert.alert('Error', 'Failed to reject. Please try again.');
    }
  };

  return (
    <LinearGradient colors={['#2e1065', '#200f4a']} style={styles.container}>
      <Animated.View entering={FadeInDown.duration(350)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{params.routineName || 'Group Chat'}</Text>
        </View>
        <TouchableOpacity 
          onPress={handleCaptureAndUploadImage}
          style={[
            styles.detailsButton, 
            { 
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              borderColor: 'rgba(255, 255, 255, 0.2)', 
              marginRight: 4,
            }
          ]}
        >
            <Ionicons name="camera-outline" size={20} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => router.push(`/(collaborative)/routine/${routineId}` as const)} 
          style={styles.detailsButton}
        >
          <Ionicons name="information-circle-outline" size={20} color="#ffffff" />
          <Text style={styles.detailsButtonText}>Details</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.chatContainer}>
        <FlatList
          ref={chatListRef}
          data={displayMessages}
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
            <View
              style={
                item.isSystemEvent
                  ? styles.chatRowSystemEvent
                  : item.sender === 'me'
                    ? styles.chatRowMine
                    : styles.chatRowOther
              }
            >
              <View
                style={[
                  styles.chatBubble,
                  item.isSystemEvent
                    ? styles.chatBubbleEvent
                    : item.sender === 'me'
                      ? styles.chatBubbleMine
                      : styles.chatBubbleSystem,
                ]}
              >
                {!item.isSystemEvent ? (
                  <Text style={styles.chatSender}>
                    {item.sender === 'me' ? 'You' : item.senderName}
                  </Text>
                ) : (
                  <Text style={styles.chatSystemLabel}>System</Text>
                )}
                {(() => {
                  const imageRegex = /\.(jpg|jpeg|png|gif|webp|heic|heif)(\?.*)?$/i;
                  const isPhotoMessage = item.text.startsWith('[PHOTO]:') || 
                                       item.text.includes('storage.googleapis.com') || 
                                       imageRegex.test(item.text);
                  
                  if (!isPhotoMessage) {
                    return renderChatMessageText(item.text);
                  }

                  const isPrefixed = item.text.startsWith('[PHOTO]:');
                  let imageUrl = isPrefixed ? item.text.replace('[PHOTO]:', '') : item.text;
                  
                  if (!imageUrl.startsWith('http')) {
                    imageUrl = `https://storage.googleapis.com/habify-verification-photos/${imageUrl.trim()}`;
                  }

                  const matchingLog = pendingLogs.find(l => {
                    const logUrl = (l.verificationImageUrl || '').toLowerCase();
                    const msgUrl = imageUrl.toLowerCase();
                    const logFileName = logUrl.split('/').pop() || '!!!';
                    const msgFileName = msgUrl.split('/').pop() || '???';
                    return logUrl === msgUrl || msgUrl.includes(logUrl) || logUrl.includes(msgUrl) || logFileName === msgFileName;
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
                    <TouchableOpacity 
                      style={styles.chatImageWrapper}
                      onPress={() => handleImagePreview(imageUrl)}
                      activeOpacity={0.9}
                    >
                      <Image 
                        source={{ uri: imageUrl }} 
                        style={styles.chatImage} 
                        resizeMode="contain" 
                      />
                    </TouchableOpacity>
                  );
                })()}
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

        {/* Bottom Bar to open Quick Replies */}
        {predefinedMessages.length > 0 && (
          <TouchableOpacity
            style={styles.openReplyBar}
            onPress={() => {
              setSelectedPredefinedMessage(null);
              setTaggedParticipant(null);
              setIsQuickReplyOpen(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.openReplyText}>✨ Type a message...</Text>
            <Ionicons name="chatbubbles" size={20} color="#e7d0ff" />
          </TouchableOpacity>
        )}

        {/* Quick Replies Bottom Modal */}
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
            <View style={styles.quickReplyBottomSheet}>
              <View style={styles.bottomSheetHandle} />
              <TouchableOpacity
                onPress={() => {
                  setIsQuickReplyOpen(false);
                  setSelectedPredefinedMessage(null);
                  setTaggedParticipant(null);
                }}
                style={styles.floatingCloseBtn}
              >
                <Ionicons name="close" size={20} color="#e7d0ff" />
              </TouchableOpacity>
              <View style={styles.bottomSheetHeader}>
                <View style={styles.bottomSheetTitleWrap}>
                  <Text style={styles.quickReplyTitle}>Quick replies</Text>
                  <Text style={styles.quickReplySubtitle}>
                    Pick a message, then send it to the group or mention one teammate.
                  </Text>
                </View>
              </View>

              {predefinedLoading ? (
                <View style={styles.quickReplyStateBox}>
                  <ActivityIndicator size="small" color="#e879f9" />
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
                      entering={FadeInUp.duration(300).springify().damping(18).stiffness(140)}
                      exiting={FadeOutDown.duration(240)}
                      style={styles.selectedMessageCard}
                    >
                      <Text style={styles.selectedMessageLabel}>Selected message</Text>
                      <View style={styles.selectedMessagePreview}>
                        <Ionicons name="sparkles-outline" size={16} color="#c4b5fd" />
                        <Text style={styles.selectedMessageText}>{selectedPredefinedMessage}</Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.sendToGroupButton,
                          sendingMessage === selectedPredefinedMessage && styles.quickReplyBtnSending,
                        ]}
                        onPress={() => handleSendPredefinedMessage(selectedPredefinedMessage, null)}
                        activeOpacity={0.85}
                        disabled={sendingMessage !== null}
                      >
                        {sendingMessage === selectedPredefinedMessage && !taggedParticipant ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : null}
                        <Text style={styles.sendToGroupText}>Send to group</Text>
                      </TouchableOpacity>

                      {participants.length > 0 ? (
                        <View style={styles.tagSection}>
                          <Text style={styles.tagSectionLabel}>Mention a teammate</Text>
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
                                  style={[styles.tagChip, isSelected && styles.tagChipSelected]}
                                  onPress={() => setTaggedParticipant(participant)}
                                  activeOpacity={0.85}
                                >
                                  <Text
                                    style={[
                                      styles.tagChipText,
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
                              <ActivityIndicator size="small" color="#ffffff" />
                            ) : null}
                            <Text style={styles.sendTaggedText}>
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
                        <Text style={styles.changeMessageText}>Choose a different message</Text>
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
                        <Text style={styles.quickReplyCategoryTitle}>{getCategoryLabel(categoryKey)}</Text>
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
                                  sendingMessage === message.text && styles.quickReplyBtnSending,
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
                                <Text style={[styles.quickReplyText, { color: accentColor }]} numberOfLines={2}>
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

        {/* Voters Bottom Modal */}
        <Modal visible={!!votersModalLog} transparent animationType="slide">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setVotersModalLog(null)}
          >
            <TouchableOpacity activeOpacity={1} style={styles.quickReplyBottomSheet}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.quickReplyTitle}>Votes</Text>
                <TouchableOpacity onPress={() => setVotersModalLog(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#e7d0ff" />
                </TouchableOpacity>
              </View>

              <View style={{gap: 16}}>
                {votersModalTab === 'approvals' &&
                  votersModalLog?.approvals &&
                  votersModalLog.approvals.length > 0 && (
                  <View style={{gap: 8}}>
                    <Text style={{color: '#4ade80', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1}}>Approvals</Text>
                    {votersModalLog.approvals.map((voter, index) => {
                      const id = typeof voter === 'string' ? voter : voter.id;
                      const name = typeof voter === 'string' ? 'Member' : voter.name;
                      const avatarUrl = typeof voter === 'string' ? undefined : voter.avatarUrl;
                      return (
                        <View key={`approve-${id}-${index}`} style={{flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12, gap: 10}}>
                          {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={{width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)'}} />
                          ) : (
                            <View style={{width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center'}}>
                              <Ionicons name="person" size={14} color="#e7d0ff" />
                            </View>
                          )}
                          <Text style={{color: '#fff', fontSize: 15, fontWeight: '600'}}>{name}</Text>
                        </View>
                      )
                    })}
                  </View>
                )}

                {votersModalTab === 'rejections' &&
                  votersModalLog?.rejections &&
                  votersModalLog.rejections.length > 0 && (
                  <View style={{gap: 8}}>
                    <Text style={{color: '#f87171', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1}}>Rejections</Text>
                    {votersModalLog.rejections.map((voter, index) => {
                      const id = typeof voter === 'string' ? voter : voter.id;
                      const name = typeof voter === 'string' ? 'Member' : voter.name;
                      const avatarUrl = typeof voter === 'string' ? undefined : voter.avatarUrl;
                      return (
                        <View key={`reject-${id}-${index}`} style={{flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12, gap: 10}}>
                          {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={{width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)'}} />
                          ) : (
                            <View style={{width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center'}}>
                              <Ionicons name="person" size={14} color="#e7d0ff" />
                            </View>
                          )}
                          <Text style={{color: '#fff', fontSize: 15, fontWeight: '600'}}>{name}</Text>
                        </View>
                      )
                    })}
                  </View>
                )}
                
                {(votersModalTab === 'approvals' && !votersModalLog?.approvals?.length) ||
                (votersModalTab === 'rejections' && !votersModalLog?.rejections?.length) ? (
                   <Text style={{color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 10}}>No votes yet.</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
      <RoutineCompletedAnimation
        visible={showCompletionAnimation}
        routineName={String(params.routineName || '')}
        rewardText={completionRewardText || 'Calculating rewards...'}
        onComplete={() => {
          setShowCompletionAnimation(false);
          setCompletionRewardText('');
        }}
      />

      <ImageFullscreenModal
        visible={isPreviewVisible}
        imageUrl={previewImage}
        onClose={() => setIsPreviewVisible(false)}
      />

      {/* Global Initial Loading Overlay */}
      {isInitialLoading && (
        <View style={styles.globalLoadingOverlay}>
          <ActivityIndicator size="large" color="#e879f9" />
          <Text style={styles.globalLoadingText}>Loading chat...</Text>
        </View>
      )}
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
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(232, 121, 249, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(232, 121, 249, 0.4)',
  },
  detailsButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  chatContainer: {
    flex: 1,
    padding: 14,
  },
  chatList: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(8,6,18,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chatListContent: {
    padding: 12,
    gap: 10,
    flexGrow: 1,
  },
  chatRowMine: {
    alignItems: 'flex-end',
  },
  chatRowOther: {
    alignItems: 'flex-start',
  },
  chatRowSystemEvent: {
    alignItems: 'center',
  },
  chatBubble: {
    maxWidth: '85%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chatBubbleMine: {
    backgroundColor: 'rgba(232, 121, 249, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chatBubbleSystem: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  chatBubbleEvent: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.32)',
    maxWidth: '94%',
  },
  chatBubbleText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  chatMentionText: {
    color: '#c4b5fd',
    fontWeight: '800',
  },
  chatSender: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  chatSystemLabel: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chatTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  chatStateBox: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  chatStateText: {
    color: '#f5dfff',
    fontSize: 13,
    fontWeight: '600',
  },
  openReplyBar: {
    marginTop: 10,
    backgroundColor: 'rgba(232, 121, 249, 0.15)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(232, 121, 249, 0.3)',
  },
  openReplyText: {
    color: '#e7d0ff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  quickReplyBottomSheet: {
    backgroundColor: '#200f4a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '78%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  floatingCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  bottomSheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 16,
  },
  bottomSheetHeader: {
    marginBottom: 20,
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
  quickReplyTitle: {
    color: '#e7d0ff',
    fontSize: 22,
    fontWeight: '800',
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
    color: '#fffaff',
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
  quickReplyScroll: {
    maxHeight: 420,
  },
  quickReplyScrollContent: {
    paddingBottom: 12,
  },
  quickReplyCategorySection: {
    width: '100%',
    marginBottom: 16,
  },
  quickReplyCategoryTitle: {
    color: '#e7d0ff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  quickReplyBtn: {
    backgroundColor: 'rgba(232, 121, 249, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(232, 121, 249, 0.3)',
    width: '48%',
  },
  quickReplyBtnSending: {
    opacity: 0.5,
    backgroundColor: 'rgba(232, 121, 249, 0.05)',
  },
  quickReplyText: {
    color: '#f4d8ff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  quickReplyStateBox: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  chatImageWrapper: {
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 4,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatImage: {
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  chatImageLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  globalLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,6,18,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  globalLoadingText: {
    color: '#e879f9',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
