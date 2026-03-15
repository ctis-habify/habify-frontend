import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuth } from '@/hooks/use-auth';
import { routineService } from '@/services/routine.service';
import { verificationService } from '@/services/verification.service';

type ChatMessage = {
  id: string;
  text: string;
  sender: 'me' | 'system';
  senderName: string;
  createdAt?: string;
};

const _COLLABORATIVE_PRIMARY = '#E879F9';
const CHAT_CACHE_KEY_PREFIX = 'routine_chat_cache_';

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

const debugLog = (..._args: unknown[]): void => {
  if (__DEV__) {
    // console.log('[CollaborativeChatPage]', ...args);
  }
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
  const [_predefinedError, setPredefinedError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
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

  const loadPredefinedMessages = useCallback(async (): Promise<void> => {
    if (!routineId) return;
    setPredefinedLoading(true);
    try {
      const messagesFromApi = await routineService.getRoutinePredefinedMessages();
      setPredefinedMessages(messagesFromApi);
      setPredefinedError(messagesFromApi.length === 0 ? 'No predefined messages found.' : null);
    } catch (_messageError) {
      setPredefinedMessages([]);
      setPredefinedError('Could not load predefined messages.');
    } finally {
      setPredefinedLoading(false);
    }
  }, [routineId]);

  useEffect(() => {
    loadChatMessages();
    loadPredefinedMessages();
    const intervalId = setInterval(() => {
      loadChatMessages();
    }, 4000);

    return () => clearInterval(intervalId);
  }, [loadChatMessages, loadPredefinedMessages]);

  useEffect(() => {
    if (chatMessages.length === 0) return;
    const timeout = setTimeout(() => {
      chatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timeout);
  }, [chatMessages]);

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
        setChatError('Could not send message.');
      } finally {
        setSendingMessage(null);
        isSendingMessageRef.current = false;
      }
    },
    [routineId, loadChatMessages, user?.email, user?.name],
  );

  const handleCaptureAndUploadImage = useCallback(async () => {
    if (!routineId || uploadingImage) return;

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'We need camera permissions to share photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      setUploadingImage(true);

      // 1. Get signed URL
      const ext = asset.uri.split('.').pop() || 'jpg';
      const { signedUrl, objectPath } = await verificationService.getSignedUrl(ext, `image/${ext === 'png' ? 'png' : 'jpeg'}`);

      // 2. Upload to GCS
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      await verificationService.uploadToGcs(signedUrl, blob);

      // 3. Send message with the public URL
      // The public URL corresponds to the objectPath in our GCS bucket setup
      const publicUrl = `https://storage.googleapis.com/habify-verification-photos/${objectPath}`;
      await routineService.sendRoutineChatMessage(routineId, publicUrl);
      
      await loadChatMessages();
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Upload Failed', 'Could not share the photo. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  }, [routineId, uploadingImage, loadChatMessages]);

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
          disabled={true} // Temporarily disabled by user request
          style={[
            styles.detailsButton, 
            { 
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              borderColor: 'rgba(255, 255, 255, 0.2)', 
              marginRight: 4,
              opacity: 0.5 // Visual hint for disabled state
            }
          ]}
        >
          {uploadingImage ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="camera-outline" size={20} color="#ffffff" />
          )}
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
                {item.text.startsWith('http') && (item.text.includes('.jpg') || item.text.includes('.jpeg') || item.text.includes('.png') || item.text.includes('storage.googleapis.com')) ? (
                  <Image source={{ uri: item.text }} style={styles.chatImage} resizeMode="cover" />
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
          {!predefinedLoading && (
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
          )}
        </View>
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
  quickReplySection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  quickReplyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quickReplyTitle: {
    color: '#f4d8ff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickReplyCount: {
    color: '#eec8ff',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  quickReplyList: {
    maxHeight: 220,
  },
  quickReplyListContent: {
    gap: 10,
    paddingBottom: 10,
  },
  quickReplyBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 12,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  quickReplyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  quickReplyBtnSending: {
    opacity: 0.6,
  },
  quickReplyStateBox: {
    padding: 15,
    alignItems: 'center',
  },
  quickReplyStateText: {
    color: '#f5dfff',
    fontSize: 13,
    marginTop: 8,
  },
});
