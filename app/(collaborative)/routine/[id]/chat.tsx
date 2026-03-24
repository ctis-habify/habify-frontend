import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ChatVerificationItem } from '@/components/routines/chat-verification-item';
import { useAuth } from '@/hooks/use-auth';
import { routineService } from '@/services/routine.service';
import { RoutineLog } from '@/types/routine';

type ChatMessage = {
  id: string;
  text: string;
  sender: 'me' | 'system';
  senderName: string;
  createdAt?: string;
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

const CHAT_CACHE_KEY_PREFIX = 'routine_chat_cache_';

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

      return {
        id: String(msg.id ?? `${senderId || 'msg'}-${index}-${text.slice(0, 8)}`),
        text,
        sender: currentUserId && senderId === currentUserId ? 'me' : 'system',
        senderName,
        createdAt: msg.sentAt,
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

export default function CollaborativeChatScreen() {
  const params = useLocalSearchParams<{ id: string; routineName?: string }>();
  const routineId = params.id;
  const router = useRouter();
  const { user } = useAuth();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  const [predefinedMessages, setPredefinedMessages] = useState<string[]>([]);
  const [predefinedLoading, setPredefinedLoading] = useState(false);
  const [pendingLogs, setPendingLogs] = useState<RoutineLog[]>([]);
  const [isQuickReplyOpen, setIsQuickReplyOpen] = useState(false);
  const [votersModalLog, setVotersModalLog] = useState<RoutineLog | null>(null);

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

  const loadChatMessages = useCallback(async (): Promise<void> => {
    if (!routineId) return;
    setChatLoading(true);
    setChatError(null);
    const cached = await readCachedChatMessages(routineId);
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
      setPendingLogs(logsWithImages);
    } catch (_e) {
      // ignore
    }
  }, [routineId]);

  const loadPredefinedMessages = useCallback(async (): Promise<void> => {
    if (!routineId) return;
    setPredefinedLoading(true);
    try {
      const messagesFromApi = await routineService.getRoutinePredefinedMessages();
      setPredefinedMessages(messagesFromApi);
    } catch (_messageError) {
      setPredefinedMessages([]);
    } finally {
      setPredefinedLoading(false);
    }
  }, [routineId]);

  useEffect(() => {
    loadChatMessages();
    loadPredefinedMessages();
    fetchPendingLogs();
    
    // Listen for manual refreshes (e.g. after camera upload)
    const sub = DeviceEventEmitter.addListener('refreshCollaborativeRoutines', () => {
      fetchPendingLogs();
      loadChatMessages();
    });

    const intervalId = setInterval(() => {
      loadChatMessages();
      fetchPendingLogs();
    }, 4000);

    return () => {
      clearInterval(intervalId);
      sub.remove();
    };
  }, [loadChatMessages, loadPredefinedMessages, fetchPendingLogs]);

  useEffect(() => {
    if (displayMessages.length === 0) return;
    const timeout = setTimeout(() => {
      chatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [displayMessages.length]);

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
        await routineService.sendRoutineChatMessage(routineId, text);
        setChatMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
        await loadChatMessages();
      } catch (_sendError) {
        setChatMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
        await loadChatMessages();
        setChatError('Could not send message.');
      } finally {
        setSendingMessage(null);
        isSendingMessageRef.current = false;
      }
    },
    [routineId, loadChatMessages, user?.email, user?.name],
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
          const voterObj = user ? { id: user.id, name: user.name || 'You', avatarUrl: ('avatar' in user ? String(user.avatar) : '') } : '';
          const newApprovals = [...(l.approvals || []), voterObj].filter(Boolean);
          return { 
            ...l, 
            status: 'approved',
            approvals: newApprovals as string[]
          };
        }
        return l;
      }));
      
      Alert.alert('Success', 'Log approved successfully!');
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
          const voterObj = user ? { id: user.id, name: user.name || 'You', avatarUrl: ('avatar' in user ? String(user.avatar) : '') } : '';
          const newRejections = [...(l.rejections || []), voterObj].filter(Boolean);
          return { 
            ...l, 
            status: 'rejected',
            rejections: newRejections as string[]
          };
        }
        return l;
      }));
      
      Alert.alert('Rejected', 'The log has been rejected.');
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
                {item.text.includes('storage.googleapis.com') || item.text.startsWith('[PHOTO]:') || item.text.includes('.jpg') || item.text.includes('.png') ? (
                  (() => {
                    const isPrefixed = item.text.startsWith('[PHOTO]:');
                    let imageUrl = isPrefixed ? item.text.replace('[PHOTO]:', '') : item.text;
                    
                    if (!imageUrl.startsWith('http') && (imageUrl.includes('.jpg') || imageUrl.includes('.png'))) {
                       imageUrl = `https://storage.googleapis.com/habify-verification-photos/${imageUrl}`;
                    }

                    // Try to find a matching pending log for this image
                    const matchingLog = pendingLogs.find(l => {
                      const logUrl = (l.verificationImageUrl || '').toLowerCase();
                      const msgUrl = imageUrl.toLowerCase();
                      const logFileName = logUrl.split('/').pop() || '!!!';
                      const msgFileName = msgUrl.split('/').pop() || '???';

                      return logUrl === msgUrl || msgUrl.includes(logUrl) || logUrl.includes(msgUrl) || logFileName === msgFileName;
                    });

                    /* removed console.log */

                    if (matchingLog) {
                      return (
                        <ChatVerificationItem 
                          log={matchingLog}
                          onApprove={handleApproveLog}
                          onReject={handleRejectLog}
                          onViewVotes={(log) => setVotersModalLog(log)}
                          currentUserId={user?.id}
                        />
                      );
                    }
                    return <Image source={{ uri: imageUrl }} style={styles.chatImage} resizeMode="contain" />;
                  })()
                ) : (
                  <Text style={styles.chatBubbleText}>{item.text}</Text>
                )}
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
            onPress={() => setIsQuickReplyOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.openReplyText}>✨ Type a message...</Text>
            <Ionicons name="chatbubbles" size={20} color="#e7d0ff" />
          </TouchableOpacity>
        )}

        {/* Quick Replies Bottom Modal */}
        <Modal visible={isQuickReplyOpen} transparent animationType="slide">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsQuickReplyOpen(false)}
          >
            <TouchableOpacity activeOpacity={1} style={styles.quickReplyBottomSheet}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.quickReplyTitle}>✨ Say something...</Text>
                <TouchableOpacity onPress={() => setIsQuickReplyOpen(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#e7d0ff" />
                </TouchableOpacity>
              </View>

              {predefinedLoading ? (
                <View style={styles.quickReplyStateBox}>
                  <ActivityIndicator size="small" color="#e879f9" />
                </View>
              ) : (
                <View style={styles.quickReplyGrid}>
                  {predefinedMessages.map((message, index) => (
                    <TouchableOpacity
                      key={`${message}-${index}`}
                      style={[
                        styles.quickReplyBtn,
                        sendingMessage === message && styles.quickReplyBtnSending,
                      ]}
                      onPress={() => {
                        handleSendPredefinedMessage(message);
                        setIsQuickReplyOpen(false);
                      }}
                      activeOpacity={0.7}
                      disabled={sendingMessage !== null}
                    >
                      {sendingMessage === message ? (
                        <ActivityIndicator size="small" color="#e879f9" />
                      ) : null}
                      <Text style={styles.quickReplyText} numberOfLines={2}>
                        {message}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
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
                {votersModalLog?.approvals && votersModalLog.approvals.length > 0 && (
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

                {votersModalLog?.rejections && votersModalLog.rejections.length > 0 && (
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
                
                {(!votersModalLog?.approvals?.length && !votersModalLog?.rejections?.length) && (
                   <Text style={{color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 10}}>No votes yet.</Text>
                )}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
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
  chatBubbleText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  chatSender: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  chatTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  chatImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
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
  quickReplyBottomSheet: {
    backgroundColor: '#200f4a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
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
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: '800',
  },
  quickReplyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
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
});
