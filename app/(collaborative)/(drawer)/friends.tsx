import { HomeButton } from '@/components/navigation/home-button';
import { Colors } from '@/constants/theme';
import {
    FriendRequestSentItem,
    friendService,
    UserSearchResult,
} from '@/services/friend.service';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

const SEARCH_DEBOUNCE_MS = 400;

type SegmentTab = 'add' | 'sent' | 'list';

/** Sent boş ekranı: uçak sağa dönük, belirgin; sayfadan uçar */
function FlyingPlaneIllustration({ color }: { color: string }): React.ReactElement {
  const fly = useSharedValue(0);
  useEffect(() => {
    fly.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600 }),
        withDelay(400, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );
  }, [fly]);
  const planeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(fly.value, [0, 1], [-100, 420]) },
      { rotate: '8deg' },
    ],
  }));
  return (
    <View style={styles.emptyIllustration} pointerEvents="none">
      <Animated.View style={[styles.flyingPlaneWrap, planeStyle]}>
        <Svg width={72} height={56} viewBox="0 0 72 56" fill="none">
          {/* Uçak animasyonu */}
          <Path
            d="M64 28 L24 20 L16 28 L24 36 Z"
            fill={color}
            stroke={color}
            strokeWidth={1.5}
            strokeOpacity={0.5}
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}


function EmptyStateIllustration({ type, color }: { type: 'friends' | 'sent' | 'search', color: string }): React.ReactElement {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1400 }),
        withTiming(1, { duration: 1400 })
      ),
      -1,
      false
    );
  }, [pulse]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (type === 'sent') {
    return <FlyingPlaneIllustration color={color} />;
  }

  if (type === 'search') {
    return (
      <Animated.View style={[styles.emptyIllustrationSearch, animatedStyle]}>
        <Svg width={48} height={48} viewBox="0 0 88 88" fill="none">
          <Circle cx={38} cy={38} r={22} stroke={color} strokeWidth={4} fill="none" opacity={0.85} />
          <Path d="M54 54 L78 78" stroke={color} strokeWidth={5} strokeLinecap="round" opacity={0.85} />
        </Svg>
      </Animated.View>
    );
  }

  // friends
  return (
    <Animated.View style={[styles.emptyIllustration, animatedStyle]}>
      <Svg width={120} height={56} viewBox="0 0 120 56" fill="none">
        {/* Sol kişi: kafa + gövde (elips) */}
        <Circle cx={28} cy={20} r={9} fill={color} opacity={0.55} />
        <Path d="M28 30 A10 12 0 0 1 28 54 A10 12 0 0 1 28 30 Z" fill={color} opacity={0.5} />
        {/* Sağ kişi */}
        <Circle cx={92} cy={20} r={9} fill={color} opacity={0.55} />
        <Path d="M92 30 A10 12 0 0 1 92 54 A10 12 0 0 1 92 30 Z" fill={color} opacity={0.5} />
        {/* Kalp ortada */}
        <Path
          d="M60 40 C55 35 50 30 55 25 C58 22 60 25 60 27 C60 25 62 22 65 25 C70 30 65 35 60 40 Z"
          fill={color}
          opacity={0.9}
        />
      </Svg>
    </Animated.View>
  );
}

export default function FriendsScreen(): React.ReactElement {
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const collaborativePrimary = colors.collaborativePrimary;
  const isDark = theme === 'dark';

  const [segment, setSegment] = useState<SegmentTab>('add');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<FriendRequestSentItem[]>([]);
  const [friendsList, setFriendsList] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const data = await friendService.searchUsers(q);
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const t = setTimeout(() => search(), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery, search]);

  const sendRequest = useCallback(async (user: UserSearchResult) => {
    setSendingId(user.id);
    try {
      await friendService.sendFriendRequest(user.id);
      setSearchResults((prev) => prev.filter((r) => r.id !== user.id));
      Alert.alert('Sent', `Friend request sent to ${user.name}`);
    } catch (e: unknown) {
      const res = e && typeof e === 'object' && 'response' in e ? (e as { response?: { data?: { message?: string } } }).response : undefined;
      Alert.alert('Error', res?.data?.message ?? 'Failed to send request.');
    } finally {
      setSendingId(null);
    }
  }, []);

  const fetchSent = useCallback(async () => {
    setLoading(true);
    try {
      const list = await friendService.getSentRequests();
      setSentRequests(list);
    } catch {
      setSentRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const list = await friendService.getFriends();
      setFriendsList(list);
    } catch {
      setFriendsList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (segment === 'sent') fetchSent();
      if (segment === 'list') fetchFriends();
      if (segment === 'add') fetchFriends();
    }, [segment, fetchSent, fetchFriends]),
  );

  const friendIds = useMemo(() => new Set(friendsList.map((f) => f.id)), [friendsList]);

  const tabScaleAdd = useSharedValue(1);
  const tabScaleSent = useSharedValue(1);
  const tabScaleList = useSharedValue(1);
  const animatedTabAdd = useAnimatedStyle(() => ({
    transform: [{ scale: tabScaleAdd.value }],
  }));
  const animatedTabSent = useAnimatedStyle(() => ({
    transform: [{ scale: tabScaleSent.value }],
  }));
  const animatedTabList = useAnimatedStyle(() => ({
    transform: [{ scale: tabScaleList.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]} entering={FadeInDown.duration(400).springify()}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="menu" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Friends</Text>
        </View>
        <HomeButton color={colors.text} />
      </Animated.View>
      </Animated.View>

      <Animated.View
        style={styles.segmentBarWrapper}
        entering={FadeIn.delay(80).duration(320)}
      >
      {/* Segment bar: Add Friends | Sent | Friends */}
      <View style={[styles.segmentBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.segmentTab, segment === 'add' && { backgroundColor: collaborativePrimary }]}
          onPress={() => setSegment('add')}
          onPressIn={() => { tabScaleAdd.value = withSpring(0.94, { damping: 14, stiffness: 320 }); }}
          onPressOut={() => { tabScaleAdd.value = withSpring(1); }}
        >
          <Animated.View style={[styles.segmentTabInner, animatedTabAdd]}>
            <Ionicons
              name="person-add-outline"
              size={18}
              color={segment === 'add' ? colors.white : colors.icon}
            />
            <Text
              style={[styles.segmentLabel, { color: colors.icon }, segment === 'add' && { color: colors.white }]}
              numberOfLines={1}
            >
              Add Friends
            </Text>
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentTab, segment === 'sent' && { backgroundColor: collaborativePrimary }]}
          onPress={() => setSegment('sent')}
          onPressIn={() => { tabScaleSent.value = withSpring(0.94, { damping: 14, stiffness: 320 }); }}
          onPressOut={() => { tabScaleSent.value = withSpring(1); }}
        >
          <Animated.View style={[styles.segmentTabInner, animatedTabSent]}>
            <Ionicons
              name="paper-plane-outline"
              size={18}
              color={segment === 'sent' ? colors.white : colors.icon}
            />
            <Text
              style={[styles.segmentLabel, { color: colors.icon }, segment === 'sent' && { color: colors.white }]}
              numberOfLines={1}
            >
              Sent
            </Text>
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentTab, segment === 'list' && { backgroundColor: collaborativePrimary }]}
          onPress={() => setSegment('list')}
          onPressIn={() => { tabScaleList.value = withSpring(0.94, { damping: 14, stiffness: 320 }); }}
          onPressOut={() => { tabScaleList.value = withSpring(1); }}
        >
          <Animated.View style={[styles.segmentTabInner, animatedTabList]}>
            <Ionicons
              name="people"
              size={18}
              color={segment === 'list' ? colors.white : colors.icon}
            />
            <Text
              style={[styles.segmentLabel, { color: colors.icon }, segment === 'list' && { color: colors.white }]}
              numberOfLines={1}
            >
              Friends
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
      </Animated.View>

      {/* 1. Add Friends: arama + sonuçlar */}
      {segment === 'add' && (
        <Animated.View
          key="add"
          style={styles.flex1}
          entering={FadeIn.duration(280)}
        >
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={styles.searchRow}>
            <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Search by name or username..."
                placeholderTextColor={colors.icon}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={20} color={colors.icon} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <ScrollView
            style={styles.flex1}
            contentContainerStyle={styles.searchResultsContent}
            keyboardShouldPersistTaps="handled"
          >
            {searchLoading && (
              <Animated.View style={styles.centeredMinimal} entering={FadeIn.duration(200)}>
                <ActivityIndicator size="large" color={collaborativePrimary} />
              </Animated.View>
            )}
            {!searchLoading && searchQuery.trim() && searchResults.length === 0 && (
              <Animated.View entering={FadeIn.delay(100).duration(280)} style={styles.emptySearchWrap}>
                <EmptyStateIllustration type="search" color={collaborativePrimary} />
                <Text style={[styles.emptyText, { color: colors.icon }]}>No users found.</Text>
              </Animated.View>
            )}
            {!searchLoading && !searchQuery.trim() && (
              <Animated.View entering={FadeIn.duration(280)}>
                <Text style={[styles.hintText, { color: colors.icon }]}>Type a name or username to search.</Text>
              </Animated.View>
            )}
            {!searchLoading &&
              searchResults.map((user, index) => {
                const isFriend = friendIds.has(user.id);
                return (
                  <Animated.View
                    key={user.id}
                    entering={ZoomIn.delay(index * 50).duration(280).springify()}
                    style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.avatarWrap}>
                      {user.avatarUrl ? (
                        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                          <Text style={[styles.avatarLetter, { color: colors.text }]}>{user.name.charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.info}>
                      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                        {user.name}
                      </Text>
                      {(user.username || user.id) && (
                        <Text style={[styles.meta, { color: colors.text, opacity: 0.6 }]} numberOfLines={1}>
                          @{user.username || user.id.slice(0, 8)}
                        </Text>
                      )}
                      <Text style={[styles.xpText, { color: collaborativePrimary }]}>{user.totalXp} XP</Text>
                    </View>
                    {isFriend ? (
                      <View style={styles.friendsBadge}>
                        <Ionicons name="people" size={18} color={collaborativePrimary} />
                        <Text style={[styles.friendsBadgeText, { color: collaborativePrimary }]}>Friends</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.sendBtn, { backgroundColor: collaborativePrimary }, sendingId === user.id && styles.sendBtnDisabled]}
                        onPress={() => sendRequest(user)}
                        disabled={sendingId !== null}
                      >
                        {sendingId === user.id ? (
                          <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                          <>
                            <Ionicons name="person-add" size={18} color={colors.white} />
                            <Text style={[styles.sendBtnText, { color: colors.white }]}>Add</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </Animated.View>
                );
              })}
          </ScrollView>
        </KeyboardAvoidingView>
        </Animated.View>
      )}

      {segment === 'sent' && (
        <Animated.View key="sent" style={styles.flex1} entering={FadeIn.duration(280)}>
        <>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={collaborativePrimary} />
            </View>
          ) : sentRequests.length === 0 ? (
            <Animated.View style={styles.centered} entering={FadeIn.delay(80).duration(320)}>
              <EmptyStateIllustration type="sent" color={collaborativePrimary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No sent requests</Text>
              <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
                Requests you send from Add Friend will appear here.
              </Text>
            </Animated.View>
          ) : (
            <FlatList
              data={sentRequests}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item, index }) => (
                <Animated.View
                  entering={ZoomIn.delay(index * 50).duration(280).springify()}
                  style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.avatarWrap}>
                    {item.toUser.avatarUrl ? (
                      <Image source={{ uri: item.toUser.avatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.avatarLetter, { color: colors.text }]}>
                          {item.toUser.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.info}>
                    <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                      {item.toUser.name}
                    </Text>
                    {item.toUser.username && (
                      <Text style={[styles.meta, { color: colors.text, opacity: 0.6 }]} numberOfLines={1}>
                        @{item.toUser.username}
                      </Text>
                    )}
                    <View style={[styles.pendingBadge, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.pendingBadgeText, { color: colors.textTertiary }]}>Pending</Text>
                    </View>
                  </View>
                </Animated.View>
              )}
            />
          )}
        </>
        </Animated.View>
      )}

      {segment === 'list' && (
        <Animated.View key="list" style={styles.flex1} entering={FadeIn.duration(280)}>
        <>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={collaborativePrimary} />
            </View>
          ) : friendsList.length === 0 ? (
            <Animated.View style={styles.centered} entering={FadeIn.delay(80).duration(320)}>
              <EmptyStateIllustration type="friends" color={collaborativePrimary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No friends yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.icon }]}>
                Accept invitations to see your friends here.
              </Text>
            </Animated.View>
          ) : (
            <>
              <Animated.View
                style={styles.friendsCountWrap}
                entering={FadeInDown.delay(50).duration(300).springify()}
              >
                <LinearGradient
                  colors={[collaborativePrimary, colors.tint]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.friendsCountPill, { shadowColor: collaborativePrimary }]}
                >
                  <Ionicons name="heart" size={16} color={colors.white} />
                  <Text style={[styles.friendsCountText, { color: colors.white }]}>{friendsList.length} friend{friendsList.length !== 1 ? 's' : ''}</Text>
                </LinearGradient>
              </Animated.View>
            <FlatList
              data={friendsList}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item, index }) => (
                <Animated.View
                  entering={ZoomIn.delay(index * 50).duration(280).springify()}
                  style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.avatarWrap}>
                    {item.avatarUrl ? (
                      <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.avatarLetter, { color: colors.text }]}>
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.info}>
                    <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.username && (
                      <Text style={[styles.meta, { color: colors.text, opacity: 0.6 }]} numberOfLines={1}>
                        @{item.username}
                      </Text>
                    )}
                    <Text style={[styles.xpText, { color: collaborativePrimary }]}>{item.totalXp} XP</Text>
                  </View>
                </Animated.View>
              )}
            />
            </>
          )}
        </>
        </Animated.View>
      )}
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 56,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  segmentBarWrapper: {},
  segmentBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 5,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  segmentTabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 72,
  },
  emptyIllustration: {
    marginBottom: 12,
    overflow: 'visible',
  },
  emptyIllustrationSearch: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flyingPlaneWrap: {
    width: 72,
    height: 56,
    alignSelf: 'center',
    overflow: 'visible',
  },
  friendsCountWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  friendsCountPill: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  friendsCountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  flex1: {
    flex: 1,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearBtn: {
    padding: 4,
  },
  searchResultsContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  centeredMinimal: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 0,
    marginTop: 4,
  },
  emptySearchWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  hintText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sendBtnDisabled: {
    opacity: 0.7,
  },
  sendBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  friendsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  friendsBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '600',
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    marginTop: 1,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
