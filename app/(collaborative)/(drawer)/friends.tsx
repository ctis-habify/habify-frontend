import { Colors } from '@/constants/theme';
import {
  friendService,
  FriendRequestReceivedItem,
  FriendRequestSentItem,
  UserSearchResult,
} from '@/services/friend.service';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
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

const COLLABORATIVE_PRIMARY = '#E879F9';

type SegmentTab = 'invitations' | 'sent' | 'list';

export default function FriendsScreen(): React.ReactElement {
  const router = useRouter();
  const [segment, setSegment] = useState<SegmentTab>('invitations');
  const [pendingRequests, setPendingRequests] = useState<FriendRequestReceivedItem[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestSentItem[]>([]);
  const [friendsList, setFriendsList] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const list = await friendService.getReceivedRequests();
      setPendingRequests(list);
    } catch {
      setPendingRequests([]);
    } finally {
      setLoading(false);
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
      if (segment === 'invitations') fetchInvitations();
      if (segment === 'sent') fetchSent();
      if (segment === 'list') fetchFriends();
    }, [segment, fetchInvitations, fetchSent, fetchFriends]),
  );

  const handleAccept = useCallback(
    async (item: FriendRequestReceivedItem) => {
      setActioningId(item.id);
      try {
        await friendService.acceptRequest(item.id);
        setPendingRequests((prev) => prev.filter((r) => r.id !== item.id));
        setFriendsList((prev) => [
          ...prev,
          {
            id: item.fromUser.id,
            name: item.fromUser.name,
            username: item.fromUser.username ?? null,
            avatarUrl: item.fromUser.avatarUrl ?? null,
            totalXp: 0,
          },
        ]);
      } catch {
        Alert.alert('Error', 'Could not accept request.');
      } finally {
        setActioningId(null);
      }
    },
    [],
  );

  const handleDecline = useCallback(
    async (item: FriendRequestReceivedItem) => {
      setActioningId(item.id);
      try {
        await friendService.declineRequest(item.id);
        setPendingRequests((prev) => prev.filter((r) => r.id !== item.id));
      } catch {
        Alert.alert('Error', 'Could not decline request.');
      } finally {
        setActioningId(null);
      }
    },
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Friends</Text>
      </View>

      {/* Segment bar */}
      <View style={styles.segmentBar}>
        <TouchableOpacity
          style={[styles.segmentTab, segment === 'invitations' && styles.segmentTabActive]}
          onPress={() => setSegment('invitations')}
        >
          <Ionicons
            name="mail-outline"
            size={16}
            color={segment === 'invitations' ? '#fff' : Colors.light.icon}
          />
          <Text
            style={[
              styles.segmentTabText,
              segment === 'invitations' && styles.segmentTabTextActive,
            ]}
            numberOfLines={1}
          >
            Invitations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentTab, segment === 'sent' && styles.segmentTabActive]}
          onPress={() => setSegment('sent')}
        >
          <Ionicons
            name="send-outline"
            size={16}
            color={segment === 'sent' ? '#fff' : Colors.light.icon}
          />
          <Text
            style={[styles.segmentTabText, segment === 'sent' && styles.segmentTabTextActive]}
            numberOfLines={1}
          >
            Sent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentTab, segment === 'list' && styles.segmentTabActive]}
          onPress={() => setSegment('list')}
        >
          <Ionicons
            name="people-outline"
            size={16}
            color={segment === 'list' ? '#fff' : Colors.light.icon}
          />
          <Text
            style={[styles.segmentTabText, segment === 'list' && styles.segmentTabTextActive]}
            numberOfLines={1}
          >
            Friend List
          </Text>
        </TouchableOpacity>
      </View>

      {segment === 'invitations' && (
        <>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={COLLABORATIVE_PRIMARY} />
            </View>
          ) : pendingRequests.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="mail-open-outline" size={48} color={Colors.light.icon} />
              <Text style={styles.emptyTitle}>No pending invitations</Text>
              <Text style={styles.emptySubtitle}>
                When someone sends you a request, it appears here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={pendingRequests}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={styles.avatarWrap}>
                    {item.fromUser.avatarUrl ? (
                      <Image source={{ uri: item.fromUser.avatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarLetter}>
                          {item.fromUser.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.fromUser.name}
                    </Text>
                    {item.fromUser.username && (
                      <Text style={styles.meta} numberOfLines={1}>
                        @{item.fromUser.username}
                      </Text>
                    )}
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.iconBtn, styles.acceptBtn, actioningId === item.id && styles.btnDisabled]}
                      onPress={() => handleAccept(item)}
                      disabled={actioningId !== null}
                    >
                      {actioningId === item.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="checkmark" size={22} color="#fff" />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconBtn, styles.declineBtn, actioningId === item.id && styles.btnDisabled]}
                      onPress={() => handleDecline(item)}
                      disabled={actioningId !== null}
                    >
                      <Ionicons name="close" size={22} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </>
      )}

      {segment === 'sent' && (
        <>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={COLLABORATIVE_PRIMARY} />
            </View>
          ) : sentRequests.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="send-outline" size={48} color={Colors.light.icon} />
              <Text style={styles.emptyTitle}>No sent requests</Text>
              <Text style={styles.emptySubtitle}>
                Requests you send from Add Friend will appear here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={sentRequests}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={styles.avatarWrap}>
                    {item.toUser.avatarUrl ? (
                      <Image source={{ uri: item.toUser.avatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarLetter}>
                          {item.toUser.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.toUser.name}
                    </Text>
                    {item.toUser.username && (
                      <Text style={styles.meta} numberOfLines={1}>
                        @{item.toUser.username}
                      </Text>
                    )}
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>Pending</Text>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </>
      )}

      {segment === 'list' && (
        <>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={COLLABORATIVE_PRIMARY} />
            </View>
          ) : friendsList.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="people-outline" size={48} color={Colors.light.icon} />
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptySubtitle}>
                Accept invitations to see your friends here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={friendsList}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={styles.avatarWrap}>
                    {item.avatarUrl ? (
                      <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarLetter}>
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.username && (
                      <Text style={styles.meta} numberOfLines={1}>
                        @{item.username}
                      </Text>
                    )}
                    <Text style={styles.xpText}>{item.totalXp} XP</Text>
                  </View>
                </View>
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 56,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  segmentBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentTabActive: {
    backgroundColor: COLLABORATIVE_PRIMARY,
  },
  segmentTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  segmentTabTextActive: {
    color: '#fff',
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
    color: Colors.light.text,
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
    backgroundColor: COLLABORATIVE_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  meta: {
    fontSize: 13,
    color: Colors.light.icon,
    marginTop: 2,
  },
  xpText: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: {
    backgroundColor: Colors.light.success,
  },
  declineBtn: {
    backgroundColor: Colors.light.error,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: 'rgba(232, 121, 249, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLLABORATIVE_PRIMARY,
  },
});
